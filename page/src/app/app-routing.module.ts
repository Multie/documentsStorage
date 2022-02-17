import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileEditComponent } from './file-edit/file-edit.component';
import { FileComponent } from './file/file.component';
import { FilesComponent } from './files/files.component';
import { StartComponent } from './start/start.component';

const routes: Routes = [
  {
    path: 'start',
    component: StartComponent
  },
  {
    path: 'files',
    component: FilesComponent
  },
  {
    path: 'new-file',
    component: FileEditComponent
  },
  {
    path: 'files/:file',
    component: FileComponent
  },
  {
    path: '',
    redirectTo: '/start',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/start'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
