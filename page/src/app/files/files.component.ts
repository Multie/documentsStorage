import { Component, OnInit } from '@angular/core';
import { dataFile, DataService } from '../data.service';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { filterFileInfo } from '../search/search.component';
@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {

  currentPage: number;

  files: Array<dataFile>;
  length = 100;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 100, 500, 1000];

  // MatPaginator Output
  pageEvent: PageEvent;

  filter:filterFileInfo;

  constructor(public data: DataService, private router: Router, private route: ActivatedRoute) {
    this.files = [];
    this.pageEvent = new PageEvent();
    //this.getFiles();
    this.currentPage = 0;
    this.filter = new filterFileInfo();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {

      if (params.page) {
        this.currentPage = params.page;
      }
      this.getFiles(this.filter);

    });
  }

  getFiles(filter:filterFileInfo) {
    this.data.getFileInfos(filter).subscribe((files) => {
      this.files = files;
      this.length = files.length;
    });
  }

  changePage(event: any) {
    console.log(event);
    this.pageSize = event.pageSize
    this.router.navigate(
      [],
      {
        queryParams: { page: event.pageIndex },
        queryParamsHandling: 'merge'
      });
  }

  addFile() {
    this.data.getNewId().subscribe((id)=> {
     
     // this.router.navigateByUrl("/new-file");
     // this.router.navigateByUrl("/files/"+id);
    });
    this.router.navigateByUrl("/newfile");
  }
  editFile(file: dataFile) {
    this.router.navigateByUrl("/files/" + file.id);
  }
  createFullImageUrl(path: string): string {
    return this.data.createFullImageUrl(path);
  }

  applyfilter(event:any) {
    console.log(event);
    this.data.getFileInfos(event).subscribe((files) => {
      this.files = files;
      this.length = files.length;
    });
  }
}
