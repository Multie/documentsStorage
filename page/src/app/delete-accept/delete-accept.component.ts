import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DeleteAcceptData {
  text:string;
  result:boolean;
}


@Component({
  selector: 'app-delete-accept',
  templateUrl: './delete-accept.component.html',
  styleUrls: ['./delete-accept.component.scss']
})
export class DeleteAcceptComponent implements OnInit {


  constructor(public dialogRef: MatDialogRef<DeleteAcceptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteAcceptData,
  ) {
   }

  ngOnInit(): void {
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
