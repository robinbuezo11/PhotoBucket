import {Component, EventEmitter, Inject, Output} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlbumsService } from 'src/app/services/albums.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-album',
  templateUrl: './edit-album.component.html',
  styleUrls: ['./edit-album.component.scss'] // <- Pequeño error aquí, debería ser style**s**Url
})
export class EditAlbumComponent {
  @Output() albumSaved = new EventEmitter<any>();

  form: FormGroup;
  user: any;

  constructor(
    private dialogRef: MatDialogRef<EditAlbumComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private albumsService: AlbumsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      albumName: [this.data.album ? this.data.album.nombreAlbum : '', Validators.required]
    });
  }

  ngOnInit() {
    this.user = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (this.user && this.user.token) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    const albumData = {
      album: this.data.album,
      nombre: this.form.value.albumName,
      usuario: this.user.id
    };
    this.dialogRef.close(albumData);
  }
}
