import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { ElectronService } from "../core/services";
import { Observable, of, from, Subject, PartialObserver } from "rxjs";
import { LocalFile } from "./local-file.interface";
import {
  getFileExtension,
  convertBytes,
} from "app/core/services/storage/file.utils";
import { map, distinct } from "rxjs/operators";
import { MatTableDataSource } from "@angular/material/table";
import { StorageFile, StorageFolder } from "../core/services/storage/storage.interfaces";
import { Store } from "@ngrx/store";
import { IRootStore } from "app/store";
import { loadLocalStorage, addLocalFile, removeLocalFile, addDirectory, removeDirectory, updateLocalFile } from '../store/local-storage/local-storage.actions'

import dayjs from "dayjs";
import { MatSort } from "@angular/material/sort";
import getClassNameForExtension from "app/dashboard/file-extensions";
import { LocalStorage } from "app/store/local-storage/local-storage.interface";

@Component({
  selector: "local-explorer",
  templateUrl: "./local-explorer.component.html",
  styleUrls: ["./local-explorer.component.css"],
})
export class LocalExplorerComponent implements OnInit, OnDestroy {
	displayedColumns: string[] = ['name', 'size', 'createdAt'];
	files: Observable<StorageFile[]>
	folders: Observable<StorageFolder[]>
	localStore$: Observable<LocalStorage>
  dataSource = new MatTableDataSource([])
  @ViewChild(MatSort, {static: true}) sort: MatSort;
	
  constructor(private readonly electronService: ElectronService, private readonly store: Store<IRootStore>) {
		this.files = store.select(state => state.localStorage.files)
		this.folders = store.select(state => state.localStorage.folders)
		this.localStore$ = store.select(state => state.localStorage)
	}

	ngOnInit(): void {
		this.dataSource.sort = this.sort;
		this.localStore$.subscribe(data => {
			this.dataSource.data = [
				...data.folders.map(e => ({
					name: e.name,
					size: 0,
					icon: 'folder'
				})),
				...data.files.map(e => ({
					name: e.name,
					size: e.size,
					icon: getClassNameForExtension(e.extension)
				}))
			]
		})
    const userDirectoryPath = localStorage.getItem("userDirectoryPath");
    this.electronService.ipcRenderer.send("load-directory", {
      userDirectoryPath,
    });

    this.electronService.ipcRenderer.on("directory-loaded", (event, args) => {
			const files: any[] = args.files;
			this.store.dispatch(loadLocalStorage({
				data: {
					files: files.map(e => ({
						key: e.fullpath, 
						name: e.name,
						createdAt: dayjs(e.createdAt),
						size: e.size,
						prettySize: convertBytes(e.size),
						extension: getFileExtension(e.name)
					} as StorageFile)),
					folders: args.folders.map(e => ({
						name: e.name,
						key: e.fullpath,
						size: e.size,
						files: [],
						folders: [],
						createdAt: e.createdAt
					} as StorageFolder))
				}
			}))
    });

    this.electronService.ipcRenderer.on("directory-error", (event, args) => {
      console.error("Something went wrong reading the directory");
    });

		//Root file actions
		this.electronService.ipcRenderer.on("root-file-created", (e, args) => this.onRootFileCreated(args))
		this.electronService.ipcRenderer.on('root-file-deleted', (e, args) => this.onRootFileDeleted(args))
		this.electronService.ipcRenderer.on('root-file-changed', (e, args) => this.onRootFileChanged(args))
		
		//Directory actions
		this.electronService.ipcRenderer.on('directory-created', (e, args) => this.onDirectoryCreated(args))
		this.electronService.ipcRenderer.on('directory-removed', (e, args) => this.onDirectoryRemoved(args))
  }

	onDirectoryRemoved(args){
		let exists = false 
		this.folders.subscribe(e => {
			if (e.some(e => e.name === args)){
				exists = true 
				return 
			}
		})

		if (!exists) return 
		this.store.dispatch(removeDirectory({ 
			name: args
		}))
	}

	onDirectoryCreated(args){
		let exists = false 
		this.folders.subscribe(e => {
			if (e.some(e => e.key === args.path)){
				exists = true 
				return 
			}
		})

		if (exists) return 
		this.store.dispatch(addDirectory({ 
			folder: {
				name: args.name,
				files: [],
				folders: [],
				createdAt: dayjs(args.createdAt),
				key: args.path
			}
		}))
	}

	onRootFileChanged(args){
		let exists = false 
		this.files.subscribe(e => {
			if (e.some(e => e.key === args.path)){
				exists = true 
				return 
			}
		})
		if (!exists) 

		this.store.dispatch(updateLocalFile({
			file: {
				key: args.path,
				size: args.size,
				lastModifiedAt: dayjs()
			}
		}))
	}

	onRootFileDeleted(path: string){
		let exists = false 
		this.files.subscribe(e => {
			if (e.some(e => e.key === path)){
				exists = true 
				return 
			}
		})
		if (!exists) 

		this.store.dispatch(removeLocalFile({
			key: path
		}))
	}

	onRootFileCreated(args){
		let exists = false 
		this.files.subscribe(e => {
			if (e.some(e => e.key === args.path)){
				exists = true 
				return 
			}
		})

		//Prevents multiple events dispatches and duplications
		if (exists){
			return 
		}

		this.store.dispatch(addLocalFile({
			file: {
				name: args.name,
				key: args.path,
				extension: getFileExtension(args.name),
				size: args.size || 0,
				prettySize: convertBytes(args.size || 0),
				createdAt: dayjs(),
			},
			indexOnFiles: -1
		}))
	}

  ngOnDestroy() {
    this.electronService.ipcRenderer.send("close-directory");
  }
}
