import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from "../../../services/users.service";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class AppSideRegisterComponent {
  form: FormGroup;
  profileImage: string = '/assets/images/profile/user-1.jpg';

  constructor(
    private router: Router,
    private usersService: UsersService,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup(
      {
        uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required]),
        confirmPassword: new FormControl('', [Validators.required]),
      },
      { validators: this.passwordMatchValidator }
    );
  }

  get f() {
    return this.form.controls;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  submit() {
    if (this.form.valid && this.profileImage) {
      const userData = {
        usuario: this.form.value.uname,
        correo: this.form.value.email,
        password: this.form.value.password,
        imagen: this.profileImage
      };

      this.usersService.registerUser(userData).subscribe(
        (response: any) => {
          localStorage.setItem('token', response.token);
          this.snackBar.open('Registro exitoso!', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/authentication/login']);
        },
        (error: any) => {
          console.log(error);
          this.snackBar.open('Error en el registro: ' + (error.error.message || 'Desconocido'), 'Cerrar', { duration: 5000 });
        }
      );
    } else {
      this.snackBar.open('Formulario inválido o imagen faltante', 'Cerrar', { duration: 3000 });
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
}
