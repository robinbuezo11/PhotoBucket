import {Component, EventEmitter, Inject, Output} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlbumsService } from 'src/app/services/albums.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-album',
  templateUrl: './new-album.component.html',
  styleUrls: ['./new-album.component.scss']
})
export class NewAlbumComponent {
  @Output() albumSaved = new EventEmitter<any>();

  form: FormGroup;
  user: any;

  constructor(
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<NewAlbumComponent>,
    private fb: FormBuilder,
    private albumsService: AlbumsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      albumName: ['', Validators.required]
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
      nombreAlbum: this.form.value.albumName,
      usuario: this.user.id
    };

    this.albumsService.createAlbum(albumData).subscribe(
      (response) => {
        console.log('Álbum creado con éxito:', response);
        this.snackBar.open('Álbum creado con éxito!', 'Cerrar', { duration: 3000 });
        this.albumSaved.emit(response);
        this.dialogRef.close();
      },
      (error) => {
        console.error('Error al crear el álbum:', error);
        this.snackBar.open('Error al crear el álbum: ' + (error.error.message || 'Error desconocido'), 'Cerrar', { duration: 3000 });
      }
    );
  }
}
