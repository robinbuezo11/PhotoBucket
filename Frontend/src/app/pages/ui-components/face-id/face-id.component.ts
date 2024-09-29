import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Subject, Observable } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import {Router} from "@angular/router";

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
    if (this.user && this.user.token) {
      this.router.navigate(['/dashboard']);
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

      // Asegúrate de que el archivo sea una imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();

        reader.onload = () => {
          // Asigna la imagen cargada a la variable imagePreview
          this.imagePreview = reader.result;
        };

        // Carga la imagen seleccionada como una URL temporal
        reader.readAsDataURL(file);
      } else {
        console.error('El archivo seleccionado no es una imagen');
      }
    }
  }

  saveFaceId() {

  }
}
