import { Component, EventEmitter, OnInit, Output,Input } from '@angular/core';
import { dataFile } from '../data.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  search:string="";
  startDate:Date;
  endDate:Date;
  keywords:string;
  category:string;
  fileCount:number;

  open:boolean;

  @Output() filter:EventEmitter<any>;
  filterObject:filterFileInfo;
  constructor() { 
    this.open = false;
    this.filter = new EventEmitter<any>();
    this.filterObject = new filterFileInfo();
    this.search = "";
    this.startDate = new Date(0);
    this.endDate = new Date(Date.now());
    this.keywords = "";
    this.category  = "";
    this.fileCount = Infinity;
  }

  ngOnInit(): void {

  }

  toggleMoreFilter() {
    this.open = !this.open;
  }

  keyDown(event:any) {

  }

  applyFilter() {
    this.filter.emit(this.filterObject);
  }
}
export class filterFileInfo {
  name:string;
  description:string;
  startDate:Date;
  endDate:Date;
  keywords:string;
  category:string;
  count:number;
  offset:number;
  id:number;
  constructor() {
    this.name="";
    this.description = "";
    this.startDate = new Date(0);
    this.endDate = new Date(Date.now());
    this.keywords = "";
    this.category = "";
    this.count = 100;
    this.offset = 0;
    this.id = -1;
  }
}