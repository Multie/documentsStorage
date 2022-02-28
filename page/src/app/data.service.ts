import { Injectable } from '@angular/core';
import { catchError, Observable, ObservableInput, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { createWorker } from 'tesseract.js';

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

  imageToText(image: HTMLImageElement, language: string = "deu+eng"): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      await this.tesseractWorker.load();
      await this.tesseractWorker.loadLanguage(language);
      await this.tesseractWorker.initialize(language);
     
    
    
     
      /* if (typeof(image)==typeof("")){
         var str:string = image as string;
         if (!str.match(/data:image\/([a-zA-Z]*);base64,([^"]*))/g)) {
           reject("String does not match data:image\/([a-zA-Z]*);base64,([^\"]*)");
         }
       }*/
      
      //await this.tesseractWorker.setParameters({
      //tessjs_create_osd: '1',
      //});
      console.debug("recognize")
      var { data: { text } } = await this.tesseractWorker.recognize(image);
      resolve(text);
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
      console.debug("setFileInfo",file.date);
      var date = new Date(0);
      date.setDate(file.date.getDate());
      date.setMonth(file.date.getMonth());
      date.setFullYear(file.date.getFullYear());
      file.date = date;
      console.debug("setFileInfoNew",file.date)
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
    return this.http.get(url,{responseType:'blob'});
  }
  uploadFile(file: dataFile, filedata: File): Observable<dataFile> {
    return new Observable<dataFile>((observer) => {
    
      var url = this.serverUrl + "api/files/" + file.id + "/file";
      console.log("upload to:",url)
      var formData = new FormData();
      formData.append("file", filedata);
      this.http.post(url, formData).pipe(catchError((err:any,caught:ObservableInput<any>):ObservableInput<any> => {
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

  createFullImageUrl(path:string):string {
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
  date:Date;
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
