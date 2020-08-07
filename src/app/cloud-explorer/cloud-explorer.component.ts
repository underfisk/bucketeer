import { Component, OnInit, ViewChild } from '@angular/core';
import { FileUpload } from 'app/dashboard/dashboard.component';
import { Observable, Subject } from 'rxjs';
import { CloudStorage } from 'app/store/cloud-storage/cloud-storage.interface';
import { StorageFile } from 'app/core/services/storage/storage.interfaces';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/services/auth-service/auth.service';
import { StorageService } from 'app/core/services/storage/storage.service';
import { Store, select } from '@ngrx/store';
import { IRootStore } from 'app/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { RenameFileNameDialog, RenameFileData } from 'app/dialogs/rename-file-dialog/rename-file.component';
import { PreviewImageDialog } from 'app/dialogs/preview-image-dialog/preview-image-dialog';
import getClassNameForExtension from 'app/dashboard/file-extensions';
import { initializeStorage, fileUploaded } from 'app/store/cloud-storage/cloud-storage.actions';
import { take } from 'rxjs/operators';
import { v4 } from 'uuid';
import { convertBytes } from 'app/core/services/storage/file.utils';
import dayjs from 'dayjs';

@Component({
  selector: 'app-cloud-explorer',
  templateUrl: './cloud-explorer.component.html',
  styleUrls: ['./cloud-explorer.component.scss']
})
export class CloudExplorerComponent implements OnInit {
  displayedColumns: string[] = ['name', 'prettySize', 'lastModifiedAt'];
  cloudStorage$: Observable<CloudStorage>
  files: Observable<StorageFile[]>
  dataSource = new MatTableDataSource([])

  fileUploadQueue$: Subject<FileUpload> = new Subject()
  fileQueueAbort$: Subject<FileUpload>  = new Subject()

  fileQueueList: FileUpload[] = []

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(ContextMenuComponent) public basicMenu: ContextMenuComponent;

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
      data: {name: file?.name || "", key: file?.key || "" }
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
    if (file.extension.includes('jpg') || file.extension.includes('png')){
      console.log("Its valid")
      this.openImagePreview(file)
    }
  }

  /**@todo Download the file because its small so we can "cache it locally"  */
  async openImagePreview(img: StorageFile){
    const body = await this.storageService.getObjectBody(img.key)
    // const body = await this.storageService.getObjectBody("eu-west-2:1fdf2733-7ebe-43ca-b859-de2164d2e422/Screenshot from 2020-04-27 18-33-50.png")
    if (!body){
      return console.error("Something went wrong")
    }
    const dialogRef = this.dialog.open(PreviewImageDialog, {
      data: { body, name: img.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
  ngOnInit(): void { 
    this.dataSource.sort = this.sort;
    this.files.subscribe(files => {
      this.dataSource.data = files.map(e => ({
        ...e,
        lastModifiedAt: e.lastModifiedAt.format('DD MMMM YYYY HH:mm'),
        icon: getClassNameForExtension(e.extension)
      }))
    })
  }


  async onFileUpload(event: any){
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
    if (files.length > 20){
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

    for(const file of filesArray){
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

  onSignOut() {
    this.authService.logout()
    this.router.navigate(['/signin'])
  }

  onLocalClick() {
  this.router.navigate(['/dashboard/local'])
  }

  sortData(sort: Sort) {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'prettySize': return compare(a.size, b.size, isAsc)
        case 'lastModifiedAt': return sortDate(a.lastModifiedAt, b.lastModifiedAt, isAsc)
        default: return 0;
      }
    });
  }

  async processFileOfQueue(file: FileUpload){
    this.fileQueueList.push(file)
    const targetIndex = this.fileQueueList.length - 1
    let indexOnFiles = -1
    this.store.select(state => state.cloudStorage.files.findIndex(e => e.key === uploadedFileKey)).pipe(take(1)).subscribe(s => indexOnFiles = s)

    const uploadedFileKey = await this.storageService.upload(file, this.fileQueueAbort$, percentage => {
      if (this.fileQueueList[targetIndex].progress === percentage) return 
      this.fileQueueList[targetIndex].progress = percentage
    })

    if (uploadedFileKey){
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

function sortDate(a: string, b: string, isAsc: boolean){
  return (dayjs(a).isAfter(dayjs(b)) ? -1 : 1) * (isAsc  ? 1 : -1)
}
function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}