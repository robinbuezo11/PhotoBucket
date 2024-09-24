import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, map, tap} from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ImagesService {

  private apiURL = 'http://127.0.0.1:3001/imagenes/'

  constructor(
    protected http: HttpClient,
    private router: Router
  ) { }

  listImages(): Observable<any> {
    return this.http.get(this.apiURL + 'listar');
  }

  createImage(image: any): Observable<any> {
    return this.http.post(this.apiURL + 'crear', image);
  }

  deleteImage(id: string): Observable<any> {
    return this.http.delete(this.apiURL + 'eliminar/' + id);
  }

  updateImage(image: any): Observable<any> {
    return this.http.put(this.apiURL + 'actualizar', image);
  }
}
