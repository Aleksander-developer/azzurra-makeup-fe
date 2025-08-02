// src/app/services/auth.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, delay, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn.asObservable();

  private readonly MOCK_EMAIL = 'azzurraangius95@gmail.com';
  private readonly MOCK_PASSWORD = 'AzzuBestMakeupArtist';

  private isBrowser: boolean;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Determina se il codice è in esecuzione in un browser.
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Controlla lo stato del login SOLO se sei nel browser.
    // Tutta la logica che usa 'localStorage' deve stare DENTRO questo blocco.
    if (this.isBrowser) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this._isLoggedIn.next(true);
      }
    }
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return of(null).pipe(
      delay(1000), // Simula un ritardo di rete
      map(() => {
        if (email === this.MOCK_EMAIL && password === this.MOCK_PASSWORD) {
          const mockToken = 'mock_jwt_token_12345';
          
          // Imposta il token solo se siamo nel browser
          if (this.isBrowser) {
            localStorage.setItem('auth_token', mockToken);
          }
          
          this._isLoggedIn.next(true);
          console.log('Login successful!');
          return { token: mockToken };
        } else {
          console.error('Login failed: Invalid credentials');
          throw { code: 'auth/invalid-credential', message: 'Credenziali non valide.' };
        }
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    // Rimuovi il token solo se siamo nel browser
    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
    }
    this._isLoggedIn.next(false);
    this.router.navigate(['/login']);
    console.log('Logout successful!');
  }

  checkLoginStatus(): boolean {
    // Questo metodo non usa API del browser, quindi è sicuro.
    return this._isLoggedIn.getValue();
  }
}