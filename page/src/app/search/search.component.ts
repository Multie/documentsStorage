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

  constructor() { 
    this.open = false;
    this.filter = new EventEmitter<any>();

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

  applyFilter() {
    this.filter.emit();
  }
}
