import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../core/services/auth-service/auth.service';
import {StorageService} from '../core/services/storage/storage.service'
import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators'
import {Store, select} from '@ngrx/store';
import {initializeStorage, fileUploaded} from '../store/cloud-storage/cloud-storage.actions';
import {IRootStore} from '../store/index'
import {CloudStorage} from '../store/cloud-storage/cloud-storage.interface';
import {StorageFile} from '../core/services/storage/storage.interfaces';
import {getClassNameForExtension} from './file-extensions'
import {convertBytes} from '../core/services/storage/file.utils';
import {v4} from 'uuid'
import {MatSnackBar} from '@angular/material/snack-bar';
import dayjs from 'dayjs';
import {MatDialog} from '@angular/material/dialog';
import {PreviewImageDialog} from '../dialogs/preview-image-dialog/preview-image-dialog'
import {RenameFileNameDialog, RenameFileData} from '../dialogs/rename-file-dialog/rename-file.component';

export interface FileUpload {
	id: string
	name: string
	prettySize: string
	size: number
	icon: string
	isFinished: boolean
	progress: number
	isAborted: boolean
	error?: string
	type: string
	buffer: ArrayBuffer
}


@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

	cloudStorage$: Observable<CloudStorage>
	files: Observable<StorageFile[]>

	fileUploadQueue$: Subject<FileUpload> = new Subject()
	fileQueueAbort$: Subject<FileUpload> = new Subject()

	fileQueueList: FileUpload[] = []

	isLoading: boolean = true

	constructor(
	  private router: Router,
	  private readonly authService: AuthService,
	  private readonly storageService: StorageService,
	  private readonly store: Store<IRootStore>,
	  private _snackBar: MatSnackBar,
	  public dialog: MatDialog
	) {
		this.cloudStorage$ = store.pipe(select('cloudStorage'));
		this.files = store.select(state => state.cloudStorage.files)
		this.fileUploadQueue$.subscribe(file => this.processFileOfQueue(file))
	}

	openDialog(file: StorageFile): void {
		const dialogRef = this.dialog.open(RenameFileNameDialog, {
			width: '250px',
			data: {name: file?.name || "", key: file?.key || ""}
		});

		dialogRef.afterClosed().subscribe((result: RenameFileData) => {
			console.log('The dialog was closed');
			console.log(result)
			/**@todo Check if the name is equal and also save the extension from the original name (on the key) */
		});
	}

	showMessage(file: StorageFile) {
		this.openDialog(file)
	}

	openFile(file: StorageFile) {
		console.log("Open te file")
		console.log(file)
		if (file.extension.includes('jpg') || file.extension.includes('png')) {
			console.log("Its valid")
			return this.openImagePreview(file)
		}
	}

	/**@todo Download the file because its small so we can "cache it locally"  */
	async openImagePreview(img: StorageFile) {
		const body = await this.storageService.getObjectBody(img.key)
		// const body = await this.storageService.getObjectBody("eu-west-2:1fdf2733-7ebe-43ca-b859-de2164d2e422/Screenshot from 2020-04-27 18-33-50.png")
		if (!body) {
			return console.error("Something went wrong")
		}
		const dialogRef = this.dialog.open(PreviewImageDialog, {
			data: {body, name: img.name}
		});

		dialogRef.afterClosed().subscribe(result => {
			console.log(`Dialog result: ${result}`);
		});
	}

	async signOut() {
		this.authService.logout()
		return this.router.navigate(['/signin'])
	}

	async ngOnInit() {
		const user = this.authService.getCurrentUser();
		if (!user) {
			return this.signOut()
		}

		user.getSession(
		  async (err: Error, res: { idToken: { jwtToken: string } }) => {
			  if (err) {
				  alert(err.message || JSON.stringify(err));
				  /**@todo Handle this */
				  return;
			  }

			  user.getUserAttributes(async (err, attributes) => {
				  if (err) {
					  // Handle error
					  return this.signOut()
				  } else {
					  if (attributes === undefined) {
						  console.error("No attributes found")
						  return this.signOut()
					  }

					  //Setup the user profile that is authenticated
					  // this.store.dispatch(initialiazeSession(data))

					  const idToken = res.idToken.jwtToken;

					  this.storageService.init(idToken);
					  const list = await this.storageService.getRootObjects();

					  const {
						  folders,
						  files: singleFiles,
					  } = this.storageService.getFoldersFromObjects(list);

					  //Setup the cloud storage
					  this.store.dispatch(initializeStorage({
						  data: {
							  files: singleFiles,
							  folders,
							  deletedFiles: list.deletedFiles.map(e => ({
								  key: e.Key,
								  name: this.storageService.cleanFolderName(e.Key!),
								  versionkey: e.VersionId
							  }))
						  }
					  }))

					  this.isLoading = false
				  }
			  });
		  }
		);
	}

	async onFileUpload(event: any) {
		const files = event.target.files as FileList
		const filesArray = Array.from(files)

		//Is the queue full
		if (this.fileQueueList.length >= 20) {
			return this._snackBar.open('Upload queue is full, max to 20 files. Please wait some upload to finish', 'Close', {
				duration: 2000,
				horizontalPosition: 'start',
				verticalPosition: 'bottom',
			})
		}

		//Only allow up to 20 files at time
		if (files.length > 20) {
			event.preventDefault()
			return this._snackBar.open('You can only upload up to 20 files', 'Close', {
				duration: 2000,
				horizontalPosition: 'start',
				verticalPosition: 'bottom',
			})
		}

		const uploadSize = filesArray.reduce((prev, current) => prev + current.size, 0)
		let spaceUsed = 0
		let maxSpace = 0
		this.store.select(state => state.cloudStorage).pipe(take(1)).subscribe(s => {
			spaceUsed = s.spaceUsed
			maxSpace = s.maxSpace
		})

		const gibabyteInBytes = 1e+9
		const maxSpaceInBytes = maxSpace * gibabyteInBytes

		//Check if he has space available
		if (uploadSize + spaceUsed >= maxSpaceInBytes) {
			return this._snackBar.open('No free space available to upload', 'Close', {
				duration: 2000,
				horizontalPosition: 'start',
				verticalPosition: 'bottom',
			})
		}

		for (const file of filesArray) {
			const body = await file.arrayBuffer()
			this.fileUploadQueue$.next({
				id: v4(),
				name: file.name,
				prettySize: convertBytes(file.size),
				size: file.size,
				isAborted: false,
				isFinished: false,
				progress: 0,
				icon: getClassNameForExtension(file.type),
				type: file.type,
				buffer: body
			})
		}
	}


	onBinClick() {
		console.error("BIN")
	}

	onCloudClick() {
		return this.router.navigate(['/dashboard/cloud'])
	}

	onSignOut() {
		return this.signOut()
	}

	onLocalClick() {
		return this.router.navigate(['/dashboard/local'])
	}


	/**@todo Creete a service and move this into there */
	async processFileOfQueue(file: FileUpload) {
		this.fileQueueList.push(file)
		const targetIndex = this.fileQueueList.length - 1
		let indexOnFiles = -1
		this.store.select(state => state.cloudStorage.files.findIndex(e => e.key === uploadedFileKey)).pipe(take(1)).subscribe(s => indexOnFiles = s)

		const uploadedFileKey = await this.storageService.upload(file, this.fileQueueAbort$, percentage => {
			if (this.fileQueueList[targetIndex].progress === percentage) return
			this.fileQueueList[targetIndex].progress = percentage
		})

		if (uploadedFileKey) {
			this.store.dispatch(fileUploaded({
				file: {
					key: uploadedFileKey,
					name: file.name,
					createdAt: dayjs(),
					extension: file.type,
					prettySize: file.prettySize,
					lastModifiedAt: dayjs(),
					size: file.size
				},
				indexOnFiles
			}))
		}
		this.fileQueueList = this.fileQueueList.filter(e => e.id !== file.id)
	}
}
