import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import {ImagesService } from  '../../../services/images.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlbumsService} from "../../../services/albums.service";
import {Router} from "@angular/router";
import {MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrl: './image.component.scss',
  animations: [
    trigger('fade', [
      state('void', style({ opacity: 0 })),
      transition(':enter, :leave', [animate(200)]),
    ]),
  ],
})
export class ImageComponent implements OnInit{
  @Output() imageSaved = new EventEmitter<any>();

  form: FormGroup;
  imageSrc: string | ArrayBuffer | null = null;
  user: any;
  albums: any;

  constructor(
    private imagesService: ImagesService,
    private albumsService: AlbumsService,
    private fb: FormBuilder,
    private router: Router,
    public dialogRef: MatDialogRef<ImageComponent>,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      album: ['', Validators.required],
      description: ['', Validators.required],
      image: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.user = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (this.user && this.user.token) {
      this.router.navigate(['/dashboard']);
    };

    this.albumsService.getAlbumsByUser(this.user.id).subscribe(
      (response) => {
        console.log('Álbumes del usuario:', response);
        this.albums = response;
      },
      (error) => {
        console.error('Error al obtener los álbumes del usuario:', error);
      }
    );
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageSrc = reader.result;
        this.form.patchValue({ image: reader.result });
        this.form.get('image')?.updateValueAndValidity();
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = {
        nombre: this.form.value.name,
        album: this.form.value.album,
        descripcion: this.form.value.description,
        imagen: this.form.value.image,
      };

      this.imagesService.createImage(formData).subscribe(
        (response) => {
          this.dialogRef.close();
          this.snackBar.open('Imagen guardada correctamente', 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });

          this.imageSaved.emit(response); // Emitir la nueva imagen
        },
        (error) => {
          this.snackBar.open('Error al guardar la imagen: ' + (error.error?.message || 'Error desconocido'), 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
          console.error('Error al guardar la imagen:', error);
        }
      );
    } else {
      this.snackBar.open('Por favor, completa todos los campos requeridos.', 'Cerrar', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
      });
    }
  }
}
