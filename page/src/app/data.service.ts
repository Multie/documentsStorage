import { Injectable } from '@angular/core';
import { catchError, Observable, ObservableInput, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { createWorker,PSM,OEM } from 'tesseract.js';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  sidenav: boolean;
  tesseractWorker: any;
  serverUrl: string;
  constructor(private http: HttpClient) {
    this.initImageToText();
    this.sidenav = false;
    if (document.baseURI.includes("127.0.0.1") || document.baseURI.includes("localhost")) {
      this.serverUrl = "http://localhost:3000/";
    }
    else {
      this.serverUrl = document.baseURI;
    }
  }


  initImageToText() {
    this.tesseractWorker = createWorker({
      logger: m => console.log(m),
    });
  };

  imageToText(image: HTMLImageElement, language: string = "deu+eng",whitelist:string=" abcdefghijklmnopqrstuvwxyzäöüABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789+-,._!\"§$%&/()=?*<>"): Observable<string> {
    return new Observable<string>((observer) => {
      this.tesseractWorker = createWorker({
        logger: (m) => {
          console.log(m)
          observer.next(m);
        },
      });
      this.tesseractWorker.load().then(() => {
        this.tesseractWorker.loadLanguage(language).then(() => {

          this.tesseractWorker.initialize(language).then(() => {
            this.tesseractWorker.setParameters({
              tessedit_ocr_engine_mode:OEM.TESSERACT_LSTM_COMBINED,
              //tessedit_pageseg_mode:PSM.AUTO,
              tessjs_create_unlv: "1",
              //tessjs_create_box:"1",
              tessedit_char_whitelist:whitelist
            }).then(() => {
              console.debug("recognize")
              this.tesseractWorker.recognize(image).then((obj: any) => {
                console.debug("recognized")
                console.log(obj.data.box);
                if (obj.data.tsv) {
                  var tsv: { level: number; page_num: number; block_num: number; par_num: number; line_num: number; word_num: number; left: number; top: number; width: number; heigth: number; conf: number; text: string; }[] = [];
                  var lines = obj.data.tsv.split("\n");
                  lines.forEach((line:string) => {
                    var columes = line.split("\t");
                    if (columes.length == 12) {
                      if (parseInt(columes[10]) > 0) {
                      var ctsv = {
                        level:parseInt(columes[0]),
                        page_num:parseInt(columes[1]),
                        block_num:parseInt(columes[2]),
                        par_num:parseInt(columes[3]),
                        line_num:parseInt(columes[4]),
                        word_num:parseInt(columes[5]),
                        left:parseInt(columes[6]),
                        top:parseInt(columes[7]),
                        width:parseInt(columes[8]),
                        heigth:parseInt(columes[9]),
                        conf:parseInt(columes[10]),
                        text:columes[11],
                      }
                      tsv.push(ctsv);
                    }
                    }
                  });
                  obj.data.tsv = tsv;
                }


                observer.next(obj.data);
                observer.complete();

              });

            });

          });
        });
      });



      /* if (typeof(image)==typeof("")){
         var str:string = image as string;
         if (!str.match(/data:image\/([a-zA-Z]*);base64,([^"]*))/g)) {
           reject("String does not match data:image\/([a-zA-Z]*);base64,([^\"]*)");
         }
       }*/

      //await this.tesseractWorker.setParameters({
      //tessjs_create_osd: '1',
      //});
 
    });
  }

  getFileInfos(filter: any = null): Observable<Array<dataFile>> {
    return new Observable<Array<dataFile>>(observer => {
      var url = this.serverUrl + "api/files";
      var params = "";
      /*if (start >= 0) {
        params += "&start=" + start;
      }
      if (count > 0) {
        params += "&count=" + count;
      }*/
      if (filter) {
        var keys = Object.keys(filter);
        keys.forEach(key => {
          params += "&" + key + "=" + filter[key];
        });
      }
      if (params.length > 0) {
        url += "?" + params.substring(1);
      }

      this.http.get(url).subscribe((data) => {
        if (!Array.isArray(data)) {
          return;
        }
        var array: Array<dataFile> = data.map((val) => {
          var file: any = new dataFile();
          var keys = Object.keys(file);
          keys.forEach((key: string) => {
            file[key] = val[key];
          });
          return file as dataFile;
        });
        observer.next(array);
      });
    });
  }

  getNewId(): Observable<number> {
    return new Observable<number>((observer) => {
      var url = this.serverUrl + "api/newId";
      this.http.get(url).subscribe((data: any) => {
        observer.next(data as number);
      });
    });
  }
  getFileCount(): Observable<number> {
    return new Observable<number>((observer) => {
      var url = this.serverUrl + "api/fileCount";
      this.http.get(url).subscribe((data: any) => {
        observer.next(data as number);
      });
    });
  }

  getFileInfo(id: number): Observable<dataFile> {
    return new Observable<dataFile>((observer) => {
      if (id < 0) {
        observer.next(new dataFile());
        observer.complete();
      }
      var url = this.serverUrl + "api/files/" + id;
      this.http.get(url).subscribe((data: any) => {
        var file: any = new dataFile();
        var keys = Object.keys(file);
        keys.forEach((key: string) => {
          file[key] = data[key];
        });
        // console.log(file);
        observer.next(file);
      });
    });
  }

  setFileInfo(file: dataFile) {
    return new Observable<dataFile>((observer) => {
      var url = this.serverUrl + "api/files";
      console.debug("setFileInfo", file.date);
      var date = new Date(0);
      date.setDate(file.date.getDate());
      date.setMonth(file.date.getMonth());
      date.setFullYear(file.date.getFullYear());
      file.date = date;
      console.debug("setFileInfoNew", file.date)
      this.http.post(url, file).subscribe((data: any) => {
        var file: any = new dataFile();
        var keys = Object.keys(file);
        keys.forEach((key: string) => {
          file[key] = data[key];
        });
        observer.next(file);
        observer.complete();
      });
    });
  }
  removeFileInfo(file: dataFile) {
    var url = this.serverUrl + "api/files/" + file.id;
    return this.http.delete(url);
  }

  getFile(file: dataFile, fileInfo: string) {
    var url = this.serverUrl + "api/files/" + file.id + "/" + fileInfo;
    console.debug(url);
    return this.http.get(url, { responseType: 'blob' });
  }
  uploadFile(file: dataFile, filedata: File): Observable<dataFile> {
    return new Observable<dataFile>((observer) => {

      var url = this.serverUrl + "api/files/" + file.id + "/file";
      console.log("upload to:", url)
      var formData = new FormData();
      formData.append("file", filedata);
      this.http.post(url, formData).pipe(catchError((err: any, caught: ObservableInput<any>): ObservableInput<any> => {
        observer.error(err);
        return of([]);
      })).subscribe((data: any) => {
        var file: any = new dataFile();
        var keys = Object.keys(file);
        keys.forEach((key: string) => {
          file[key] = data[key];
        });
        observer.next(file);
        observer.complete();
      });
    });
  }
  deleteFile(file: dataFile, fileInfo: string) {
    return new Observable<dataFile>((observer) => {
      var url = this.serverUrl + "api/files/" + file.id + "/" + fileInfo;
      console.log(url);
      return this.http.delete(url).subscribe((data: any) => {
        var file: any = new dataFile();
        var keys = Object.keys(file);
        keys.forEach((key: string) => {
          file[key] = data[key];
        });
        observer.next(file);
      });
    });
  }

  createFullImageUrl(path: string): string {
    return this.serverUrl + "files/" + path;
  }

}


export class dataFile {
  id: number;
  name: string;
  type: string;
  description: string;
  ocr: Array<string>;
  keywords: Array<string>;
  category: Array<string>;
  files: Array<string>;
  date: Date;
  constructor() {
    this.name = "";
    this.type = "";
    this.description = "";
    this.ocr = new Array<string>();
    this.keywords = new Array<string>();
    this.category = new Array<string>();
    this.files = new Array<string>();
    this.id = -1;
    this.date = new Date();
  }
  private uuidv4() {
    return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
