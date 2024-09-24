import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, map, tap} from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AlbumsService {

  private apiURL = 'http://127.0.0.1:3001/albumes/'

  constructor(
    protected http: HttpClient,
    private router: Router
  ) { }

  listAlbums(): Observable<any> {
    return this.http.get(this.apiURL + 'listar');
  }

  createAlbum(album: any): Observable<any> {
    return this.http.post(this.apiURL + 'crear', album);
  }

  deleteAlbum(id: string): Observable<any> {
    return this.http.delete(this.apiURL + 'eliminar/' + id);
  }

  updateAlbum(album: any): Observable<any> {
    return this.http.put(this.apiURL + 'actualizar', album);
  }
}
