import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StartComponent } from './start/start.component';
import { FileComponent } from './file/file.component';
import { FilesComponent } from './files/files.component';
import { SearchComponent } from './search/search.component';
import { TimelineComponent } from './timeline/timeline.component';
import { FileEditComponent } from './file-edit/file-edit.component';
import { HttpClientModule } from '@angular/common/http';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import {MatPaginatorModule} from '@angular/material/paginator'; 
import {MatChipsModule} from '@angular/material/chips'; 
import {MatTabsModule} from '@angular/material/tabs'; 
// Pdf Viewer
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    FileComponent,
    FilesComponent,
    SearchComponent,
    TimelineComponent,
    FileEditComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    // Material Modules
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatSelectModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTabsModule,
    BrowserAnimationsModule,
    // Pdf Viewer
    PdfViewerModule,

    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }