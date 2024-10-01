import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, map, tap} from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AlbumsService {

  private apiURL = 'http://192.168.0.20:5000/albumes/'

  constructor(
    protected http: HttpClient,
    private router: Router
  ) { }

  listAlbums(): Observable<any> {
    return this.http.get(this.apiURL + 'listar');
  }

  getAlbumsByUser(userId: string): Observable<any> {
    return this.http.get(this.apiURL + userId);
  }

  createAlbum(album: any): Observable<any> {
    console.log('album', album);
    return this.http.post(this.apiURL + 'crear', album);
  }

  deleteAlbum(album: any): Observable<any> {
    return this.http.post(this.apiURL + 'eliminar', album);
  }

  updateAlbum(album: any): Observable<any> {
    return this.http.put(this.apiURL + 'actualizar', album);
  }
}
