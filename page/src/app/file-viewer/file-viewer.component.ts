import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss']
})
export class FileViewerComponent implements OnInit {
  isImage:boolean;
  isPdf:boolean;
  isVideo:boolean;
  isOther:boolean;

  fileName:string;
  inputFile:string;
  @Input() edit:boolean;

@Output() delete:EventEmitter<any>;
@Output() move:EventEmitter<any>;

  @Input() set src(value:string) {
    if (value.length>0) {
      this.inputFile = value;
      this.setPath( value);
    }
    
  }
  @Input() set filePath(value:string) {
    if (value.length>0) {
      this.inputFile = value;
    this.setPath(this.createFullImageUrl(value));
    }
    
  }
  constructor(public data:DataService) {
      this.fileName = "";
      this.isImage=false;
      this.isPdf=false;
      this.isVideo=false;
      this.isOther=false;
      this.inputFile = "";

      this.edit = false;
      this.delete  = new EventEmitter();
      this.move = new EventEmitter();
   }

  ngOnInit(): void {
  }
  
  createFullImageUrl(path:string):string {
    return this.data.createFullImageUrl(path);
  }

  setPath(path:string) {
    if (!path) {
      path = "";
    }
    this.fileName = path;
    this.isImage = this.fileName.startsWith("data:image/") || this.fileName.endsWith(".png") || this.fileName.endsWith(".jpg") || this.fileName.endsWith(".bmp");
    this.isPdf= this.fileName.endsWith(".pdf");
    this.isVideo= this.fileName.endsWith(".mp4") || this.fileName.endsWith(".wav");  
    this.isOther= !(this.isImage || this.isPdf || this.isVideo);
    
  }



}
