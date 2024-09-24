import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UsersService } from 'src/app/services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-dialog-component',
  templateUrl: './dialog-component.component.html',
  styleUrls: ['./dialog-component.component.scss']
})
export class DialogComponentComponent {
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DialogComponentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string, id: string },
    private fb: FormBuilder,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  deleteAccount(): void {
    if (this.form.valid) {
      const password = this.form.get('password')?.value;
      const id = this.data.id;
      this.usersService.delete({id, password}).subscribe(
        response => {
          console.log('Account deleted successfully', response);
          this.dialogRef.close(true);
          this.snackBar.open('Cuenta eliminada con éxito', 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top'
          });
          setTimeout(() => {
            this.router.navigate(['/authentication/login']);
          }, 3000); 
        },
        error => {
          console.error('Error deleting account', error);
          this.snackBar.open(error.error.message || 'Error al eliminar la cuenta', 'Cerrar', {
            duration: 3000,
            verticalPosition: 'top'
          });
        }
      );
    }
  }
}


