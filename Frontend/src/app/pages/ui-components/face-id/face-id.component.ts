import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Subject, Observable } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';

@Component({
  selector: 'app-face-id',
  templateUrl: './face-id.component.html',
  styleUrls: ['./face-id.component.scss']
})
export class FaceIdComponent {
  form: FormGroup ;
  isSwitchOn: boolean = false; // Variable para almacenar el estado del switch

  mostrarWebcam = true;
  permitirCambioCamara = true;
  multiplesCamarasDisponibles = false;
  dispositivoId: string = '';

  public opcionesVideo: MediaTrackConstraints = {
    width: { ideal: 1024 },
    height: { ideal: 576 }
  };

  errors: WebcamInitError[] = [];
  imagenWebcam: WebcamImage | null = null;
  trigger: Subject<void> = new Subject<void>();
  siguienteWebcam: Subject<boolean|string> = new Subject<boolean|string>();

  constructor() { 
    this.form = new FormGroup({
      password: new FormControl('', [Validators.required]),
    });
  }

  onToggleChange(event: MatSlideToggleChange): void {
    this.isSwitchOn = event.checked; // Actualiza el estado basado en el evento del switch
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
    this.imagenWebcam = imagenWebcam;
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

  saveFaceId() {

  }
}
