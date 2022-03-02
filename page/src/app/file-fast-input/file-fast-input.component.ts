import { ENTER, COMMA, F } from '@angular/cdk/keycodes';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { dataFile, DataService } from '../data.service';
import { concat, forkJoin, merge, mergeAll, Observable, of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAcceptComponent } from '../delete-accept/delete-accept.component';


@Component({
  selector: 'app-file-fast-input',
  templateUrl: './file-fast-input.component.html',
  styleUrls: ['./file-fast-input.component.scss']
})
export class FileFastInputComponent implements OnInit {

  edit: boolean;

  files: Array<TmpFile>;
  deletedFiles: Array<TmpFile>;
  file: dataFile;
  @ViewChild("fileInput") fileInput: any;
  @ViewChild("cameraInput") cameraInput: any;
  @ViewChild("orcInput") orcInput: any;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  addNextEnable: boolean;
  selectedFile: number;
  constructor(public data: DataService, private router: Router, private route: ActivatedRoute, public dialog: MatDialog) {
    this.fileInput = {};
    this.cameraInput = {};
    this.file = new dataFile();
    this.deletedFiles = [];
    this.files = [];
    this.selectedFile = 0;
    this.edit = false;
    this.addNextEnable = false;
  }

  ngOnInit(): void {
    this.edit = false;
    this.route.url.subscribe(url => {
      if (url.length > 1) {
        var fileId: string = url[url.length - 1].path.toString();
        if (fileId != "newfile") {
          this.file.id = parseInt(fileId);
          this.data.getFileInfo(this.file.id).subscribe((file: dataFile) => {
            this.setFile(file);
          })
        }
      }
    });
  }

  setFile(file: dataFile) {
    this.file = file;
    if (!this.file.keywords) {
      this.file.keywords = [];
    }
    if (!this.file.category) {
      this.file.category = [];
    }
    if (!this.file.ocr) {
      this.file.ocr = [];
    }
    if (!this.file.files) {
      this.file.files = [];
    }
    this.file.files.forEach(filePath => {
      var tmpFile = new TmpFile();
      tmpFile.path = filePath;
      tmpFile.loadFile(this.data, this.file);
      this.files.push(tmpFile);
    });
  }

  setDate(event: any) {
    console.log("Set", event.target.value)
    this.file.date = new Date(event.target.value);
  }
  getDateText(): string {
    this.file.date = new Date(this.file.date);

    var date: string = `${this.file.date.getDate()}.${this.file.date.getMonth() + 1}.${this.file.date.getFullYear()}`;
    //console.log("get", this.file.date,date,JSON.stringify(this.file.date));
    return date;


    // = new Date(event.target.value);
  }
  getDate(): Date {
    var date = new Date();
    if (this.file.date) {
      var fileDate = new Date(this.file.date);
      date.setFullYear(fileDate.getFullYear())
      date.setMonth(fileDate.getMonth())
      date.setDate(fileDate.getDate())
      //console.log("get", date, fileDate);
    }
    return date;
  }

  back() {
    this.router.navigateByUrl("/files");
  }

  removeChip(list: Array<any>, element: any) {
    if (!list) {
      list = [];
    }
    var index = list.indexOf(element);
    if (index >= 0) {
      list.splice(index, 1);
      this.files.forEach((file: TmpFile) => {
        file.tsv.forEach(tsv => {
          tsv.select = list.includes(tsv.text)
        });
      });
    }

  }
  addChip(list: Array<any>, event: MatChipInputEvent) {
    if (!list) {
      list = [];
    }
    var text = (event.value || '').trim();
    if (text) {
      //var split = value.split(" ");
      //list = list.concat(split);
      var values = text.split(" ");
      console.log(values);
      values.forEach(value => {
        if (!list.includes(value) && value.length > 1) {
          list.push(value);
        }
      });
    }


    this.files.forEach((file: TmpFile) => {
      file.tsv.forEach(tsv => {
        tsv.select = list.includes(tsv.text)
      });
    });

    event.chipInput!.clear();
  }

  openFileUpload() {
    this.fileInput.nativeElement.click();;
  }
  openCameraUpload() {
    this.cameraInput.nativeElement.click();;
  }

  uploadFile() {
    var element = this.fileInput.nativeElement;
    if (element) {
      for (var a = 0; a < element.files.length; a++) {
        var exist = this.files.some((value) => {
          return !!value.file && (value.file.name == element.files[a].name);
        })
        if (!exist) {
          var tmpFile = new TmpFile();
          tmpFile.file = element.files[a];
          tmpFile.loadFile(this.data, this.file);
          this.files.push(tmpFile);
        }
      }
    }
    var element = this.cameraInput.nativeElement;
    if (element) {
      for (var a = 0; a < element.files.length; a++) {
        var exist = this.files.some((value) => {
          return !!value.file && (value.file.name == element.files[a].name);
        })
        if (!exist) {
          var tmpFile = new TmpFile();
          tmpFile.file = element.files[a];
          tmpFile.loadFile(this.data, this.file);
          this.files.push(tmpFile);
        }
      }
    }
  }
  fileLeft() {
    this.selectedFile--;
    if (this.selectedFile < 0) {
      this.selectedFile = 0;
    }
  }
  fileRight() {
    this.selectedFile++;
    if (this.selectedFile > this.files.length - 1) {
      this.selectedFile = this.files.length - 1;
    }
  }
  /**
   * Save send file to db
   */
  save() {
    //console.debug("save",this.file);
    this.data.setFileInfo(this.file).subscribe((resultFile) => {
      var nextAction = () => {
        if (this.addNextEnable) {
          //console.log(this.addNextEnable);
          var oldfile: dataFile = JSON.parse(JSON.stringify(resultFile));
          var newFile: dataFile = new dataFile();
          newFile.name = "";
          newFile.type = oldfile.type;
          newFile.keywords = oldfile.keywords;
          newFile.date = oldfile.date;
          this.file = newFile;
          this.files = [];
          this.deletedFiles = [];

        }
        else {
          this.router.navigateByUrl("files/" + resultFile.id);
        }
      }

      if (this.files.length == 0 && this.deletedFiles.length == 0) {
        nextAction();
      }
      else {
        var subs: Array<Observable<dataFile>> = [];
        this.files.forEach(tmpfile => {
          if (tmpfile.file && tmpfile.path.length == 0) {
            subs.push(this.data.uploadFile(resultFile, tmpfile.file));
          }
        });
        this.deletedFiles.forEach(deletedFile => {
          if (deletedFile.path && deletedFile.path.length > 0) {
            subs.push(this.data.deleteFile(resultFile, deletedFile.path));
          }
        });

        forkJoin(subs).subscribe((results) => {
          nextAction();
        });
      }
    });
  }
  movefile(file: TmpFile, dir: number) {
    var index = this.files.findIndex((tmpfile) => {
      return file.src == tmpfile.src;
    })
    if (index == -1) {
      return;
    }
    var nextindex = index + dir;
    //console.debug(file,index,nextindex,this.files.length)
    if (nextindex >= 0 && nextindex < this.files.length) {

      var deletedfiles = this.files.splice(index, 1);
      this.files.splice(nextindex, 0, deletedfiles[0]);
    }
  }
  deletefile(file: TmpFile) {
    var index = this.files.findIndex((tmpfile) => {
      return file.src == tmpfile.src;
    })
    if (index >= 0) {
      var deletedfiles = this.files.splice(index, 1);
      this.deletedFiles.push(deletedfiles[0]);
    }
  }
  orcFileSearch: number = 0
  ocrFile(file: TmpFile, event: any) {
    //this.data.imageToText();
    console.log(event);

    var fileType = "";
    if (file.path) {
      if (file.path.endsWith("png")) {
        fileType = "png";
      }
      else if (file.path.endsWith("jpg")) {
        fileType = "jpg";
      }
    }
    else if (file.src) {
      if (file.src.startsWith("data:image/jpeg")) {
        fileType = "jpg";
      }
      else if (file.src.startsWith("data:image/png")) {
        fileType = "png";
      }
    }
    else {
      fileType = "";
    }

    var image: HTMLImageElement = document.createElement("img");
    image.style.display = "none";
    console.log(file);
    if (file.src && fileType.length > 0) {
      image.src = file.src;
      this.orcFileSearch = 0.1;
      this.data.imageToText(image, "deu+eng", " abcdefghijklmnopqrstuvwxyzäöüABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789.,-+/*()").subscribe((data: any) => {
        if (data.progress && data.status == "recognizing text") {
          this.orcFileSearch = data.progress;
        }
        if (data.tsv) {
          this.orcFileSearch = 0;
          console.log((data.tsv));
          file.tsv = data.tsv;
        }
      });
    }
  }
  startEdit() {
    this.edit = true;
  }
  cancelEdit() {
    this.edit = false;
    this.ngOnInit();
  }
  removeFile() {
    console.debug(this.file);
    this.data.removeFileInfo(this.file).subscribe((value) => {
      this.router.navigateByUrl("/files");
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DeleteAcceptComponent, {
      width: '50%',
      data: { text: `Delete file "${this.file.name}" ?` },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.removeFile();
      }
    });
  }

  selectTsv(tsv: any, event: any) {
    if (event.type == "click") {
      if (!tsv.select) {
        tsv.select = true;
        this.orcInput.nativeElement.value += " " + tsv.text;
      }
      else {
        tsv.select = false;
        this.orcInput.nativeElement.value = this.orcInput.nativeElement.value.replace(tsv.text, "").replace("  ", " ");
      }
    }
    else {
      if (event.buttons == 1 && !tsv.select) {
        tsv.select = true;
        this.orcInput.nativeElement.value += " " + tsv.text;
      }
      else if (event.buttons == 2 && tsv.select) {
        tsv.select = false;
        this.orcInput.nativeElement.value = this.orcInput.nativeElement.value.replace(tsv.text, "").replace("  ", " ");
      }
    }
  }

}

class TmpFile {
  file?: File | any;
  src: any;
  path: string;
  reader: FileReader;
  tsv: Array<any>;
  constructor() {
    this.file = null;
    this.src = "";
    this.path = "";
    this.tsv = [];
    this.reader = new FileReader();
    this.reader.onload = (e) => {
      this.onLoad(e);
    }
  }

  loadFile(data: DataService, file: dataFile) {
    console.log(this.file, this.path.length);
    if (this.file && this.path.length == 0) {
      this.reader.readAsDataURL(this.file);
    }
    else if (!this.file && this.path.length > 0) {
      console.log("load from remote", this.path);
      data.getFile(file, this.path).subscribe((data: any) => {

        this.reader.readAsDataURL(data);
      });

    }
  }

  onLoad(e: any) {
    this.src = this.reader.result;
  }


}