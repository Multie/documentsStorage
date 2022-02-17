import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'page';

  constructor(public data:DataService,public router:Router) {

  }

  navigation:Array<{label:string,path:string,icon:string}> = [
    {label:"Start",path:"/start",icon:"text_snippet"},
    {label:"Files",path:"/files",icon:"summarize"},
  ];

  navigate(path:string) {
    this.router.navigateByUrl(path);
    this.data.sidenav = false;
  }
}
