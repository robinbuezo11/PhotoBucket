import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from "../../../services/users.service";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfileComponent implements OnInit {
  form: FormGroup;
  profileImage: string = '/assets/images/profile/user-1.jpg';
  userProfile: any = {};

  constructor(
    private router: Router,
    private usersService: UsersService,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup({
      uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]), // Solo campo de contraseña
    });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.userProfile = JSON.parse(sessionStorage.getItem('userData') || '{}');
  
    if (this.userProfile) {
      this.form.patchValue({
        uname: this.userProfile.usuario,
        email: this.userProfile.correo,
      });
      this.profileImage = this.userProfile.imagen || this.profileImage;
    } else {
      this.snackBar.open('No se encontraron datos del perfil', 'Cerrar', { duration: 5000 });
    }
  }

  submit() {
    if (this.form.valid) {
      const userData = {
        id: this.userProfile.id,
        usuario: this.form.value.uname,
        correo: this.form.value.email,
        confirma_password: this.form.value.password,
        imagen: this.profileImage
      };
  
      this.usersService.updateUser(userData).subscribe(
        (response: any) => {
          // Actualizar el sessionStorage con los nuevos datos del usuario
          sessionStorage.setItem('userData', JSON.stringify(response));
          
          // Recargar el perfil para reflejar los cambios
          this.loadUserProfile();
  
          this.snackBar.open('Perfil actualizado exitosamente!', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        (error: any) => {
          console.log(error);
          this.snackBar.open('Error al actualizar el perfil: ' + (error.error.message || 'Desconocido'), 'Cerrar', { duration: 5000 });
        }
      );
    } else {
      this.snackBar.open('Formulario inválido', 'Cerrar', { duration: 3000 });
    }
  } 

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLElement;
    fileInput.click();
  }

  resetImage() {
    this.profileImage = '/assets/images/profile/user-1.jpg';
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
