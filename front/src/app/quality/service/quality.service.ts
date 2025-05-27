import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/authentification/service/auth.service';

export interface ArchivedCuttingSheet {
  id: number;
  article: string;
  ordo: {
    id: number;
    orderNumber: string;
    quantity: number;
    article: string;
    date: string;
    programme: string;
    createdAt: string;
  };
  serialNumber: string | null;
  printedAt: string;
  printedByUsername: string;
  reprintEvents: {
    reason: string;
    reprintedAt: string;
    reprintedByUsername: string | null;
  }[];
  preparationTime: number | null; // Time in seconds
}

@Injectable({
  providedIn: 'root'
})
export class QualityService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllArchivedCuttingSheets(filters: {
    article?: string;
    ofValue?: string;
    program?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<ArchivedCuttingSheet[]> {
    let params = new HttpParams();
    if (filters.article) params = params.set('article', filters.article);
    if (filters.ofValue) params = params.set('ofValue', filters.ofValue);
    if (filters.program) params = params.set('program', filters.program);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<ArchivedCuttingSheet[]>(`${this.apiUrl}/cuttingSheetArchive`, {
      headers: this.authService.getHeaders(),
      params
    }).pipe(
      map(archives => {
        console.log('Raw archived cutting sheets from API:', archives);
        return archives;
      }),
      catchError(this.handleError)
    );
  }

  reprintCuttingSheet(archiveId: number, reprintReason: string): Observable<void> {
    const payload = { reprintReason };
    return this.http.post<void>(`${this.apiUrl}/cuttingSheetArchive/reprint/${archiveId}`, payload, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updatePreparationTime(archiveId: number, preparationTime: number): Observable<void> {
    const payload = { preparationTime };
    return this.http.put<void>(`${this.apiUrl}/cuttingSheetArchive/${archiveId}/preparation-time`, payload, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.status === 400) {
      errorMessage = `Bad request: ${error.error?.message || 'Invalid data provided'}`;
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = 'Session expired or unauthorized';
    } else if (error.status === 404) {
      errorMessage = `Resource not found: ${error.error?.message || 'Not found'}`;
    } else if (error.status === 409) {
      errorMessage = `Conflict: ${error.error?.message || 'Data already exists'}`;
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please contact the administrator.';
    }
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}