import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UsersService } from "../../../services/users.service";

@Component({
  selector: 'app-face-id',
  templateUrl: './face-id.component.html',
  styleUrls: ['./face-id.component.scss']
})
export class FaceIDComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  isFaceDetected: boolean = false;
  attemptCount: number = 0;

  constructor(
    private dialogRef: MatDialogRef<FaceIDComponent>,
    private router: Router,
    private snackBar: MatSnackBar,
    private usersService: UsersService,
  ) {}

  ngAfterViewInit() {
    this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.videoElement.nativeElement.srcObject = stream;
        this.videoElement.nativeElement.play();
        setTimeout(() => {
          this.captureAndLogin();
        }, 2000);
      }).catch(err => {
        console.error('Error al acceder a la cámara: ', err);
      });
    }
  }

  stopCamera() {
    if (this.videoElement && this.videoElement.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  captureAndLogin() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = this.videoElement.nativeElement.videoWidth;
    canvas.height = this.videoElement.nativeElement.videoHeight;

    context?.drawImage(this.videoElement.nativeElement, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];

    this.usersService.loginWithFaceId(imageBase64).subscribe({
      next: (response: any) => {
        if (response) {
          localStorage.setItem('user', JSON.stringify(response.usuario));
          this.router.navigate(['/dashboard']);
          this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', { duration: 2000 });
          this.dialogRef.close(true);
        } else {
          this.attemptCount++;
          this.snackBar.open('Usuario no reconocido', 'Intentar de nuevo', { duration: 2000 });
          this.handleLoginAttempts();
        }
      },
      error: (error: any) => {
        console.error('Error en el reconocimiento facial:', error);
        this.snackBar.open('Error al iniciar sesión', 'Cerrar', { duration: 2000 });
        this.attemptCount++;
        this.handleLoginAttempts();
      }
    });
  }

  handleLoginAttempts() {
    if (this.attemptCount < 3) {
      setTimeout(() => {
        this.captureAndLogin();
      }, 2000);
    } else {
      this.snackBar.open('No se pudo reconocer al usuario. Revisa los ajustes de tu cuenta y asegúrate de que el Face ID esté activo.', 'Cerrar', { duration: 5000 });
      this.dialogRef.close(false);
    }
  }

  closeDialog() {
    this.stopCamera();
    this.dialogRef.close(false);
  }
}
