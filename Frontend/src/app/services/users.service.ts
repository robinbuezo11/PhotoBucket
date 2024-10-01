import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import {Observable, BehaviorSubject, tap, switchMap, forkJoin, catchError, throwError} from 'rxjs';
import { Router } from '@angular/router';
import { AlbumsService} from "./albums.service";

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiURL = 'http://192.168.1.135:5000/usuarios/';

  // BehaviorSubject para manejar el estado del usuario
  private userDataSubject = new BehaviorSubject<any>(JSON.parse(sessionStorage.getItem('userData') || '{}'));
  userData$ = this.userDataSubject.asObservable();

  constructor(
    protected http: HttpClient,
    private router: Router,
    private albumsService: AlbumsService
  ) {
  }

  registerUser(user: any): Observable<any> {
    return this.http.post(this.apiURL + 'registrar', user).pipe(
      switchMap((response: any) => {
        const albumData = {
          nombreAlbum: 'Perfil',
          usuario: response.id
        };
        return this.albumsService.createAlbum(albumData);
      }),
      tap(response => console.log('Album created successfully', response)),
      catchError(error => {
        console.error('Error creating album', error);
        return throwError(error);
      })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post(this.apiURL + 'login', credentials).pipe(
      tap((response: any) => {
        sessionStorage.setItem('userData', JSON.stringify(response));
        this.userDataSubject.next(response);
      })
    );
  }

  delete(credentials: any): Observable<any> {
    return this.albumsService.getAlbumsByUser(credentials.id).pipe(
      switchMap((albums: any[]) => {
        if (albums.length === 0) {
          return this.http.request('DELETE', this.apiURL + 'eliminar/', {
            body: credentials,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const deleteAlbumRequests = albums.map((album: any) =>
            this.albumsService.deleteAlbum(album)
          );
          return forkJoin(deleteAlbumRequests).pipe(
            switchMap(() => {
              return this.http.request('DELETE', this.apiURL + 'eliminar/', {
                body: credentials,
                headers: { 'Content-Type': 'application/json' }
              });
            })
          );
        }
      })
    );
  }

  updateUser(user: any): Observable<any> {
    return this.http.put(this.apiURL + 'actualizar', user).pipe(
      tap((response: any) => {
        sessionStorage.setItem('userData', JSON.stringify(response));
        this.userDataSubject.next(response);
      })
    );
  }

  saveFaceId(credentials: any): Observable<any> {
    return this.http.post(this.apiURL + 'faceId', credentials).pipe(
      tap((response: any) => {
        sessionStorage.setItem('userData', JSON.stringify(response));
        this.userDataSubject.next(response);
      })
    );
  }

  loginWithFaceId(imageBase64: string): Observable<any> {
    return this.http.post(this.apiURL + 'loginCamera', { picture: imageBase64 }).pipe(
      tap((response: any) => {
        if (response.usuario) {
          sessionStorage.setItem('userData', JSON.stringify(response));
          this.userDataSubject.next(response);
        }
      })
    );
  }
}

