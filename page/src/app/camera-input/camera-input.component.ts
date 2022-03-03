import { Component, Inject, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { WebcamInitError } from 'ngx-webcam';
import { Subject } from 'rxjs';

export interface CameraInputData {
  animal: string;
  name: string;
}

@Component({
  selector: 'app-camera-input',
  templateUrl: './camera-input.component.html',
  styleUrls: ['./camera-input.component.scss']
})
export class CameraInputComponent implements OnInit {

  image:any;
  trigger: Subject<void> = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<CameraInputComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CameraInputData,
  ) { 
    this.image = null;
  }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handleInitError(error: WebcamInitError): void {
    if (error.mediaStreamError && error.mediaStreamError.name === "NotAllowedError") {
      console.warn("Camera access was not allowed by user!");
    }
  }

  imageCaptured(image:any) {
    console.debug(image);
    if (image._imageAsDataUrl) {
      this.image = image._imageAsDataUrl;
    }
  }

  captureImage() {
    this.trigger.next();
  }

  clearImage() {
    this.image = null;
  }

}

