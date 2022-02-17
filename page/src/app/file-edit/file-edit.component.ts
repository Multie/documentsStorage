import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { dataFile, DataService } from '../data.service';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

@Component({
  selector: 'app-file-edit',
  templateUrl: './file-edit.component.html',
  styleUrls: ['./file-edit.component.scss']
})
export class FileEditComponent implements OnInit {
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  file:dataFile;
  @ViewChild("fileInput") fileInput: any;
  
  constructor(public data:DataService,private router: Router,private route:ActivatedRoute) { 
    this.file = new dataFile();
  }

  ngOnInit(): void {
    this.route.url.subscribe(url=> {
      if (url.length > 1) {
        var fileId:string = url[url.length-1].path.toString();
        if (fileId != "new-file") {
          this.file.id = parseInt(fileId);
          this.data.getFileInfo(this.file.id).subscribe((file:dataFile)=> {
            this.file = file;
            if (! this.file.keywords) {
              this.file.keywords = [];
            }
            if (! this.file.category) {
              this.file.category = [];
            }
            if (! this.file.ocr) {
              this.file.ocr = [];
            }
            if (! this.file.files) {
              this.file.files = [];
            }
          });
        }
      }
    })
  }

  removeChip(list:Array<any>,element:any) {
    if (!list) {
      list = [];
    }
    var index = list.indexOf(element);
    if (index >= 0) {
      list.splice(index,1);
    }
  }
  addChip(list:Array<any>,event: MatChipInputEvent) {
    if (!list) {
      list = [];
    }
    var value = (event.value || '').trim();
    if (value) { 
      //var split = value.split(" ");
      //list = list.concat(split);

      if (!list.includes(value)) {
        list.push(value);
      }
    }

    event.chipInput!.clear();
  }

  isImage(fileName:string) {
    return fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".bmp");  
  }
  isPdf(fileName:string) {
    return fileName.endsWith(".pdf") || fileName.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".odt");  
  }
  isVideo(fileName:string) {
    return fileName.endsWith(".mp4") ||  fileName.endsWith(".wav");  
  }
  createFullImageUrl(path:string):string {
    return this.data.createFullImageUrl(path);
  }
  

  uploadFile() {
    console.log("Uplad")
    if (this.fileInput) {
      for (var a=0; a < this.fileInput.nativeElement.files.length;a++) {
        this.data.uploadFile(this.file,this.fileInput.nativeElement.files[a]).subscribe((value)=> {
         
          this.file = value;
        });
      }
    }
  }

  removeFile(file:string) {
    this.data.deleteFile(this.file,file).subscribe(file=> {
      this.file = file;
    });
  }

  save() {
    this.data.setFileInfo(this.file).subscribe((result)=> {
      //this.file = result;
      this.router.navigateByUrl("/files/" + result.id);
    });
  }

  back() {
    this.router.navigateByUrl("/files");
  }
  addFile() {
    this.data.setFileInfo(this.file).subscribe((result)=> {
      this.data.getNewId().subscribe((id)=> {
         this.router.navigateByUrl("/files/" + id);
       });
    });
    
    
    
  }

}
