import { COMMA, ENTER, F } from '@angular/cdk/keycodes';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, ObservableInput, of } from 'rxjs';
import { dataFile, DataService } from '../data.service';

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  file: dataFile;
  selectedTabIndex = 0;
  @ViewChild("fileInput") fileInput: any;

  showDetails: boolean;
  editDetails: boolean;

  constructor(public data: DataService, private router: Router, private route: ActivatedRoute) {
    this.showDetails = true;
    this.editDetails = false;
    this.file = new dataFile();
  }

  ngOnInit(): void {
    this.selectedTabIndex = 0;
    this.route.url.subscribe(url => {
      if (url.length > 1) {
        var fileId: string = url[url.length - 1].path.toString();
        if (fileId != "new-file") {
          this.file.id = parseInt(fileId);
          if (this.file.id < 0) {
            this.showDetails = true;
            this.editDetails = true;
          }
          else {
            this.getFile(this.file.id);
          }
        }
      }
    })
  }

  getFile(fileId: number) {
    this.data.getFileInfo(fileId).subscribe((file: dataFile) => {
      if (!file.keywords) {
        file.keywords = [];
      }
      if (!file.category) {
        file.category = [];
      }
      if (!file.ocr) {
        file.ocr = [];
      }
      if (!file.files) {
        file.files = [];
      }
      if (!file.date) {
        file.date = new Date();
      }
      this.updateFile(file)
      this.selectedTabIndex = 0;
    });
  }

  updateFile(newfile: dataFile) {
    var sel = this.selectedTabIndex;
    this.file = newfile;
    if (this.file.files.length == 0) {
      this.showDetails = true;
    }
    this.selectedTabIndex = sel;
  }

  back() {
    this.router.navigateByUrl("/files");
  }

  isImage(path: string): boolean {
    return path.endsWith(".png") || path.endsWith(".jpg")
  }
  isPdf(path: string) {
    return path.endsWith(".pdf")
  }
  isVideo(path: string) {
    return path.endsWith(".mp4")
  }
  isOther(path: string) {
    return !this.isImage(path) && !this.isPdf(path) && !this.isVideo(path);
  }

  uploadFile() {
    if (this.fileInput) {
      for (var a = 0; a < this.fileInput.nativeElement.files.length; a++) {
        console.debug(this.fileInput.nativeElement.files[a])
        this.data.uploadFile(this.file, this.fileInput.nativeElement.files[a]).pipe(catchError((err: any, caught: ObservableInput<any>): ObservableInput<any> => {
          this.fileInput.nativeElement.value = "";
          return of([]);
        })).subscribe((value) => {
          if (!Array.isArray(value)) {
            this.selectedTabIndex = this.file.files.length - 1;
            this.fileInput.nativeElement.value = "";
            this.file = value;
          }
        })
      }
    }
  }

  removeFile(path: string) {
    this.data.deleteFile(this.file, path).subscribe(file => {
      this.updateFile(file);
    });
  }

  createFullImageUrl(path: string): string {
    return this.data.createFullImageUrl(path);
  }

  removeChip(list: Array<any>, element: any) {
    if (!list) {
      list = [];
    }
    var index = list.indexOf(element);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }
  addChip(list: Array<any>, event: MatChipInputEvent) {
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


  save() {

    this.data.setFileInfo(this.file).subscribe((result) => {
      this.editDetails = false;
      this.router.navigateByUrl("/files/" + result.id);
      this.updateFile(result);
    });
  }
  close() {
    this.editDetails = false;
    this.getFile(this.file.id);
  }
}


