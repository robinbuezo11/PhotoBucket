import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class AppSideLoginComponent {
  form: FormGroup;
  error: string = '';

  constructor(
    private router: Router,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
  ) {
    this.form = new FormGroup({
      usuario: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit() {
    const user = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (user && user.token) {
      this.router.navigate(['/dashboard']);
    }
  }

  get f() {
    return this.form.controls;
  }

  login() {
    if (this.form.invalid) {
      this.snackBar.open('Please fill in the required fields', 'Close', {
        duration: 2000,
      });
      return;
    }

    const { usuario, password } = this.form.value;

    this.usersService.login({ usuario, password }).subscribe(
      (response: any) => {
        localStorage.setItem('user', JSON.stringify(response.user));
        this.router.navigate(['/dashboard']);
        this.snackBar.open('Inicio de sesión exitoso', 'Cerrar',
          { duration: 2000 }
        );
      },
      (error: any) => {
        console.log(error);
        this.snackBar.open('Error en el inicio de sesión: ' + (error.error.message || 'Desconocido'), 'Cerrar', { duration: 5000 });
      }
    );
  }
}
