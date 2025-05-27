import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/api/auth/login')) {
      console.log('Skipping Authorization header for login request:', req.url);
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('HTTP error on login:', error);
          return throwError(() => error);
        })
      );
    }

    try {
      const isFormData = req.body instanceof FormData;
      const headers = this.authService.getHeaders(isFormData);
      const authReq = req.clone({ headers });
      console.log('Interceptor headers:', {
        Authorization: headers.get('Authorization') || 'None',
        ContentType: req.headers.get('Content-Type') || 'Not set (FormData will auto-set)',
        isFormData
      });

      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('HTTP error:', error);
          const noLogout = authReq.headers.get('X-No-Logout-On-401') === 'true';
          if (error.status === 401 && !req.url.includes('/api/auth/login') && !noLogout) {
            console.warn('Unauthorized (401), logging out and redirecting to login');
            this.authService.logout();
          } else if (error.status === 403) {
            console.warn('Forbidden (403), component will handle');
            // Optionally redirect to a "forbidden" page
            // this.authService.logout();
          }
          return throwError(() => error);
        })
      );
    } catch (error: any) {
      console.error('Interceptor error:', error);
      return throwError(() => new HttpErrorResponse({
        error: error.message,
        status: 401,
        statusText: 'Unauthorized'
      }));
    }
  }
}