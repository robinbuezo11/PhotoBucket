import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { getFirestore, onSnapshot } from '@firebase/firestore';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  getIdToken,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  toggleSignup = new BehaviorSubject<boolean>(false);
  errorMessage = new BehaviorSubject<string>('');
  auth = new BehaviorSubject(false);
  currentUserData = new BehaviorSubject<any>(null);
  currentUserId = new BehaviorSubject<string>('');

  constructor(
    private _Auth: Auth,
    private _Router: Router,
    private _Firestore: Firestore
  ) {
    const auth = window.localStorage.getItem('auth');
    auth ? this.auth.next(true) : this.auth.next(false);
    this._Auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUserId.next(user.uid);
        const db = getFirestore();
        const docRef = doc(db, 'users', user.uid);

        onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            this.currentUserData.next(doc.data());
          }
        });

        // Obtener y almacenar el token del usuario
        user.getIdToken().then((token) => {
          window.localStorage.setItem('token', token);
        });
      }
    });
  }

  toggleSignupMethod() {
    this.toggleSignup.next(!this.toggleSignup.value);
  }

  async signup(
    email: string,
    fullName: string,
    username: string,
    password: string
  ) {
    await createUserWithEmailAndPassword(this._Auth, email, password)
      .then((res) => {
        setDoc(doc(this._Firestore, 'users', res.user.uid), {
          username: '@' + username,
          email: email,
          uid: res.user.uid,
          fullName: fullName,
          profileImg: '',
          following: [],
          followers: [],
          recentSearch: [],
        });

        // Obtener y almacenar el token
        res.user.getIdToken().then((token) => {
          window.localStorage.setItem('token', token);
        });

        this.errorMessage.next('');
        this.auth.next(true);
        window.localStorage.setItem('auth', 'true');
        this._Router.navigate(['/home']);
      })
      .catch((err) => {
        this.errorMessage.next('Email already exists , please try again');
        setTimeout(() => {
          this.errorMessage.next('');
        }, 2000);
      });
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this._Auth, email, password)
      .then((res) => {
        // Obtener y almacenar el token
        res.user.getIdToken().then((token) => {
          window.localStorage.setItem('token', token);
        });

        this.errorMessage.next('');
        this.auth.next(true);
        window.localStorage.setItem('auth', 'true');
        this._Router.navigate(['/dashboard']);
      })
      .catch((err) => {
        this.errorMessage.next('Invalid Email or Password , please try again');
        setTimeout(() => {
          this.errorMessage.next('');
        }, 2000);
      });
  }

  async logout() {
    await signOut(this._Auth).then(() => {
      this.auth.next(false);
      window.localStorage.removeItem('auth');
      window.localStorage.removeItem('token');
      this._Router.navigate(['/']);
    });
  }

  // Método para obtener el token actual
  getToken(): string | null {
    return window.localStorage.getItem('token');
  }
}
