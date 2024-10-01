import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ImagesService} from "../../../services/images.service";
import {AlbumsService} from "../../../services/albums.service";
import {Router} from "@angular/router";
import {MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ImageComponent} from "../../extra/image/image.component";

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
})
export class AppListsComponent implements OnInit{

  selectedFiles: FileList = {} as FileList;
  imagePreview : any = null;
  form: FormGroup;
  selectedValue: string = '';
  user: any;
  albums: any;

  albumes = [
    {value: 'album1', viewValue: 'Album 1'},
    {value: 'album2', viewValue: 'Album 2'},
    {value: 'album3', viewValue: 'Album 3'},
  ];

  constructor(
    private imagesService: ImagesService,
    private albumsService: AlbumsService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup(
      {
        imagename: new FormControl('', [Validators.required]),
        imagedescription: new FormControl('', [Validators.required]),
        album: new FormControl('', [Validators.required]),
        image: new FormControl(null, [Validators.required]),
      }
    );
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
        this.form.patchValue({ image: reader.result });
        this.form.get('image')?.updateValueAndValidity();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFiles(){

  }

  submit() {
    if (this.form.valid) {
      const formData = {
        nombre: this.form.value.imagename,
        album: this.form.value.album,
        descripcion: this.form.value.imagedescription,
        imagen: this.form.value.image,
      };
      this.imagesService.createImage(formData).subscribe(
        (response) => {
          this.snackBar.open('Imagen guardada correctamente', 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top',
            horizontalPosition: 'center',
          });
          this.form.reset();
          this.selectedFiles = {} as FileList;
          this.imagePreview = null;
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
