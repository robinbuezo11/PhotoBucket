import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import {Observable, map, tap, BehaviorSubject} from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ImagesService {

  showPostOverlay = new BehaviorSubject(false);
  private apiURL = 'http://192.168.0.20:5000/imagenes/'

  constructor(
    protected http: HttpClient,
    private router: Router
  ) { }

  showPostOverlayFn() {
    console.log("Entro al service")
    this.showPostOverlay.next(!this.showPostOverlay.value);
  }

  listImages(): Observable<any> {
    return this.http.get(this.apiURL + 'listar');
  }

  getImagesByUser(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL + usuarioId);
  }

  getImageById(imageId: number): Observable<any> {
    return this.http.get<any>(this.apiURL + 'image/' + imageId);
  }

  createImage(image: any): Observable<any> {
    console.log("Image: ", image)
    return this.http.post(this.apiURL + 'subir', image);
  }

  showTextAnalysis(image: any): Observable<any> {
    return this.http.post<any>(this.apiURL + 'analyzeImage', image);
  }

  translateText(text: string, targetLanguage: string): Observable<any> {
    return this.http.post<any>(this.apiURL + 'translateText', { text, targetLanguage });
  }

  deleteImage(id: string): Observable<any> {
    return this.http.delete(this.apiURL + 'eliminar/' + id);
  }

  updateImage(image: any): Observable<any> {
    return this.http.put(this.apiURL + 'actualizar', image);
  }
}
