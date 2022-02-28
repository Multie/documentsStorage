import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileEditComponent } from './file-edit/file-edit.component';
import { FileFastInputComponent } from './file-fast-input/file-fast-input.component';
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
    path: 'newfile',
    component: FileFastInputComponent
  },
  {
    path: 'files/:file',
    component: FileFastInputComponent
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
