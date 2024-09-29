import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Subject, Observable } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import {Router} from "@angular/router";
import { UsersService} from "../../../services/users.service";
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-face-id',
  templateUrl: './face-id.component.html',
  styleUrls: ['./face-id.component.scss']
})
export class FaceIdComponent {
  form: FormGroup

  isSwitchOn: boolean = false;
  mostrarWebcam = true;
  recimagen: string | null = null;

  permitirCambioCamara = true;
  multiplesCamarasDisponibles = false;
  dispositivoId: string = '';
  user: any;

  imagePreview: string | ArrayBuffer | null = null;

  public opcionesVideo: MediaTrackConstraints = {
    width: { ideal: 1024 },
    height: { ideal: 576 }
  };

  errors: WebcamInitError[] = [];
  imagenWebcam: WebcamImage | null = null;
  trigger: Subject<void> = new Subject<void>();
  siguienteWebcam: Subject<boolean|string> = new Subject<boolean|string>();

  constructor(
    private router: Router,
    private usersService: UsersService,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup({
      password: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.user = JSON.parse(sessionStorage.getItem('userData') || '{}');
    console.log(this.user);

    if (this.user) {
      this.isSwitchOn = this.user.recactivo === 1;

      if (this.isSwitchOn) {
        this.mostrarWebcam = false;
        this.recimagen = this.user.recimagen;
      }
    }
  }

  onToggleChange(event: MatSlideToggleChange): void {
    this.isSwitchOn = event.checked;
    if (!this.isSwitchOn) {
      this.mostrarWebcam = false;
      this.recimagen = null;
    }
  }

  public triggerCaptura(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.mostrarWebcam = !this.mostrarWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
    this.snackBar.open('Error al inicializar la webcam: ' + error.message, 'Cerrar', { duration: 5000 });
  }

  public showNextWebcam(directionOrDeviceId: boolean|string): void {
    this.siguienteWebcam.next(directionOrDeviceId);
  }

  public handleImage(imagenWebcam: WebcamImage): void {
    console.info('Imagen de la webcam recibida: ', imagenWebcam);
    this.recimagen  = imagenWebcam.imageAsDataUrl;
    this.mostrarWebcam = false;
  }

  public cameraSwitched(dispositivoId: string): void {
    console.log('Dispositivo actual: ' + dispositivoId);
    this.dispositivoId = dispositivoId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean|string> {
    return this.siguienteWebcam.asObservable();
  }

  get f() {
    return this.form.controls;
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result;
          this.mostrarWebcam = false;
        };
        reader.readAsDataURL(file);
      } else {
        this.snackBar.open('El archivo seleccionado no es una imagen', 'Cerrar', { duration: 5000 });
      }
    }
  }


  saveFaceId() {
    if (this.recimagen) {
      const { password } = this.form.value;

      let faceIdData = {
        id : this.user.id,
        recimagen: this.recimagen,
        recactivo: true,
        confirma_password: password
      };

      this.usersService.saveFaceId(faceIdData).subscribe(
        (response) => {
          console.log(response);
          if (response) {
            this.snackBar.open('Reconocimiento facial guardado con éxito', 'Cerrar', { duration: 5000 });
          }
        },
        (error) => {
          this.snackBar.open('Error al guardar el reconocimiento facial: ' + error.message, 'Cerrar', { duration: 5000 });
        }
      );
    } else {
      this.snackBar.open('Debe capturar o subir una imagen', 'Cerrar', { duration: 5000 });
    }
  }
}
