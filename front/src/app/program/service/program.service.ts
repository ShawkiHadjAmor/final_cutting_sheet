import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/authentification/service/auth.service';
import { environment } from 'src/environments/environment';

export interface Program {
  id: number;
  name: string;
  imagePath?: string;
  extractionRule?: string;
  updateHistory?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgramService {
  private apiUrl = environment.apiUrl;
  private baseUrl = environment.baseUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllProgrammes(): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}/programs`, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getProgrammeById(id: number): Observable<Program> {
    return this.http.get<Program>(`${this.apiUrl}/programs/${id}`, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createProgramme(name: string, image: File | undefined, extractionRule: string | null): Observable<Program> {
    const formData = new FormData();
    formData.append('name', name || '');
    if (image instanceof File && image.size > 0 && ['image/jpeg', 'image/png'].includes(image.type)) {
      formData.append('image', image, image.name);
      console.log('Appending image to FormData for create:', image.name);
    } else {
      console.log('No valid image provided for createProgramme');
    }
    if (extractionRule) {
      formData.append('extractionRule', extractionRule);
    }
    const formDataEntries: { [key: string]: any } = {};
    formData.forEach((value, key) => {
      formDataEntries[key] = value instanceof File ? value.name : value;
    });
    console.log('Creating programme with FormData:', formDataEntries);
    return this.http.post<Program>(`${this.apiUrl}/programs`, formData, {
      headers: this.authService.getHeaders(true)
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Create programme error:', error);
        let errorMessage = 'Une erreur est survenue lors de la création du programme.';
        if (error.status === 415) {
          errorMessage = 'Format de données non supporté. Vérifiez les données envoyées.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  updateProgramme(id: number, name: string, image: File | undefined, extractionRule: string | null, existingImagePath: string | undefined): Observable<Program> {
    const formData = new FormData();
    formData.append('name', name || '');
    if (image instanceof File && image.size > 0 && ['image/jpeg', 'image/png'].includes(image.type)) {
      formData.append('image', image, image.name);
      console.log('Appending new image to FormData for update:', image.name);
      const formDataEntries: { [key: string]: any } = {};
      formData.forEach((value, key) => {
        formDataEntries[key] = value instanceof File ? value.name : value;
      });
      console.log('Updating programme with FormData:', formDataEntries);
      return this.http.put<Program>(`${this.apiUrl}/programs/${id}`, formData, {
        headers: this.authService.getHeaders(true)
      }).pipe(
        catchError(this.handleError)
      );
    } else if (existingImagePath) {
      console.log('No new image provided, fetching existing image from:', existingImagePath);
      const headers = this.authService.getHeaders(false);
      const fetchHeaders = new Headers();
      headers.keys().forEach(key => {
        const value = headers.get(key);
        if (value) {
          fetchHeaders.append(key, value);
        }
      });
      return from(fetch(`${this.baseUrl}${existingImagePath}`, {
        headers: fetchHeaders
      })).pipe(
        switchMap(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          return response.blob();
        }),
        switchMap(blob => {
          const fileName = existingImagePath.split('/').pop() || 'image.png';
          const file = new File([blob], fileName, { type: blob.type });
          formData.append('image', file, fileName);
          console.log('Appending existing image to FormData for update:', fileName);
          if (extractionRule) {
            formData.append('extractionRule', extractionRule);
          }
          const formDataEntries: { [key: string]: any } = {};
          formData.forEach((value, key) => {
            formDataEntries[key] = value instanceof File ? value.name : value;
          });
          console.log('Updating programme with FormData:', formDataEntries);
          return this.http.put<Program>(`${this.apiUrl}/programs/${id}`, formData, {
            headers: this.authService.getHeaders(true)
          });
        }),
        catchError((error: HttpErrorResponse | Error) => {
          console.error('Error fetching existing image:', error);
          let errorMessage = 'Une erreur est survenue lors de la récupération de l\'image existante.';
          if (error instanceof HttpErrorResponse && error.error?.message) {
            errorMessage = error.error.message;
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          return throwError(() => new Error(errorMessage));
        })
      );
    } else {
      console.log('No image or existingImagePath provided for updateProgramme');
      if (extractionRule) {
        formData.append('extractionRule', extractionRule);
      }
      const formDataEntries: { [key: string]: any } = {};
      formData.forEach((value, key) => {
        formDataEntries[key] = value instanceof File ? value.name : value;
      });
      console.log('Updating programme with FormData:', formDataEntries);
      return this.http.put<Program>(`${this.apiUrl}/programs/${id}`, formData, {
        headers: this.authService.getHeaders(true)
      }).pipe(
        catchError(this.handleError)
      );
    }
  }

  deleteProgramme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/programs/${id}`, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  searchProgrammesByName(name: string): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}/programs/search?name=${encodeURIComponent(name)}`, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Code: ${error.status}, Message: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}