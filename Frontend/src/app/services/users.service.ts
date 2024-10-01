import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiURL = 'http://192.168.0.20:5000/usuarios/';

  // BehaviorSubject para manejar el estado del usuario
  private userDataSubject = new BehaviorSubject<any>(JSON.parse(sessionStorage.getItem('userData') || '{}'));
  userData$ = this.userDataSubject.asObservable();

  constructor(
    protected http: HttpClient,
    private router: Router
  ) { }

  registerUser(user: any): Observable<any> {
    return this.http.post(this.apiURL + 'registrar', user);
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
    return this.http.request('DELETE', this.apiURL + 'eliminar/', {
      body: credentials,
      headers: { 'Content-Type': 'application/json' }
    });
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

