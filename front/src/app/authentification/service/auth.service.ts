import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  public tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      console.log('Initializing with stored token:', storedToken);
      this.tokenSubject.next(storedToken);
    } else {
      console.warn('No stored token found in localStorage');
    }
  }

  login(email: string, password: string): Observable<any> {
    const payload = { email, password };
    console.log('Login payload:', payload);
    return this.http.post<any>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap(response => {
        console.log('Login response:', response);
        if (response && response.token) {
          localStorage.setItem('jwtToken', response.token);
          localStorage.setItem('user', JSON.stringify({
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            role: response.role || 'USER'
          }));
          this.tokenSubject.next(response.token);
          console.log('Token stored:', response.token);
        } else {
          console.warn('Login response missing token:', response);
          throw new Error('No token received from server');
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        let errorMessage = 'Login failed: ';
        if (error.status === 400) {
          errorMessage += error.error?.message || 'Invalid email or password';
        } else if (error.status === 401) {
          errorMessage += 'Unauthorized: Invalid credentials';
        } else if (error.status === 0) {
          errorMessage += 'Unable to reach server. Check network or API URL';
        } else {
          errorMessage += error.error?.message || error.message || 'Unknown error';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    console.log('User logged out, token cleared');
    this.router.navigate(['/authentification/login']);
  }

  isAuthenticated(): boolean {
    const token = this.tokenSubject.value;
    if (!token) {
      console.log('isAuthenticated: No token available');
      return false;
    }
    // Optionally, add token expiration check here if JWT contains expiry
    const isAuth = !!token;
    console.log('isAuthenticated check:', isAuth);
    return isAuth;
  }

  getHeaders(isFormData: boolean = false): HttpHeaders {
    const token = this.tokenSubject.value;
    if (!token) {
      console.log('No token available, returning empty headers');
      return new HttpHeaders();
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' })
    });
    console.log('Generated headers:', { Authorization: headers.get('Authorization'), ContentType: headers.get('Content-Type'), isFormData });
    return headers;
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this.getUserRole();
    if (!userRole) {
      console.log('No user role found');
      return false;
    }
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userRole);
  }

  getUserRole(): string | null {
    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser.role || null;
    }
    return null;
  }
}