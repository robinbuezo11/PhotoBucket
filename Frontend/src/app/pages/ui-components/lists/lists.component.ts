import { Component } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";

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
  imagePreview : any = null;
  form: FormGroup;
  selectedValue: string = '';

  albumes = [
    {value: 'album1', viewValue: 'Album 1'},
    {value: 'album2', viewValue: 'Album 2'},
    {value: 'album3', viewValue: 'Album 3'},
  ];

  constructor(

  ) {
    this.form = new FormGroup(
      {
        imagename: new FormControl('', [Validators.required]),
        imagedescription: new FormControl('', [Validators.required]),
        album: new FormControl('', [Validators.required]),
      }
    );
  }

  manageFiles(event: any) {
    this.selectedFiles = event.target.files;
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      const file = this.selectedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFiles(){

  }

  submit(){
    console.log(this.form.get('album')?.value)
  }
}
