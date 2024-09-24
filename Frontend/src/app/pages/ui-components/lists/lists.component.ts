import { Component } from '@angular/core';

export interface  Upload  {
  /* Represents the data that we send to Firebase for upload */
  $key: string;
  url: string;
  file: File;
  status: number;
  like: number;
  dislike: number;
  creationDate: string;
  name: string;
  //comment: string;
}




@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
})
export class AppListsComponent {

  selectedFiles: FileList = {} as FileList;
  currentUpload: Upload | undefined;


  constructor(
    
  ) {}

  manageFiles(event: any) {
    this.selectedFiles = event.target.files;
  }

  uploadFiles(){

  }

 
}
