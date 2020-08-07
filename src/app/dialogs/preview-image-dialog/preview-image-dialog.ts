import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

/**
 * @title Dialog with header, scrollable content and actions
 */
@Component({
  selector: "preview-image-dialog",
  templateUrl: "preview-image-dialog.html",
})
export class PreviewImageDialog {
  img: string;
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    /**@todo Check the way they created thumbains, we'll need for the grid system
     * https://github.com/slappforge/s3-thumbnail-generator/blob/master/s3-thumbnail-generator/handler.js
     *
     */
    const reader = new FileReader();
    reader.readAsDataURL(new Blob([data.body], { type: "image/png" })); // toBase64
    reader.onload = () => {
      this.img = reader.result.toString();
    };
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
