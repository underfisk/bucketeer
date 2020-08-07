import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface RenameFileData {
    key: string;
    name: string;
  }
  
  @Component({
    selector: "rename-file-dialog",
    templateUrl: "rename-file.component.html",
  })
  export class RenameFileNameDialog {
    constructor(
      public dialogRef: MatDialogRef<RenameFileNameDialog>,
      @Inject(MAT_DIALOG_DATA) public data: RenameFileData
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  }