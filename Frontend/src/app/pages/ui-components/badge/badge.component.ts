import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {DialogComponentComponent} from "../../extra/dialog-component/dialog-component.component";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html'
})
export class AppBadgeComponent implements OnInit {

  albumForm: FormGroup;
  deleteAlbumForm: FormGroup;
  updateAlbumForm: FormGroup;

  albumes = [
    {value: 'album1', viewValue: 'Album 1'},
    {value: 'album2', viewValue: 'Album 2'},
    {value: 'album3', viewValue: 'Album 3'},
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DialogComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string, id: string, srcImage: string }
  ) {
    this.albumForm = this.fb.group({
      albumName: ['', Validators.required]
    });

    this.deleteAlbumForm = this.fb.group({
      albumName: ['', Validators.required]
    })

    this.updateAlbumForm = this.fb.group({
      albumName: ['', Validators.required]
    })

  }

  ngOnInit() {
    console.log('Badge Component initialized');
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.albumForm.valid) {
      const albumName = this.albumForm.value.albumName;
      // Logic to create album
      console.log('Album Created:', albumName);
      this.dialogRef.close();
    }
  }

  onSubmitDelete(): void {
    if (this.deleteAlbumForm.valid) {
      const albumName = this.deleteAlbumForm.value.albumName;
      // Logic to delete album
      console.log('Album Deleted:', albumName);
      this.dialogRef.close();
    }
  }

  onSubmitUpdate(): void {
    if (this.updateAlbumForm.valid) {
      const albumName = this.updateAlbumForm.value.albumName;
      // Logic to update album
      console.log('Album Updated:', albumName);
      this.dialogRef.close();
    }
  }

}
