import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/authentification/service/auth.service';

export interface Store {
  id: number;
  article: string;
  hasCuttingSheet: boolean;
  createdAt: string;
  preparationTime?: number;
  ordo: {
    id: number;
    orderNumber: string;
    quantity: number;
    article: string;
    date: string;
    programme: string;
    priority: boolean;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createStore(store: { ordoId: number; article: string; hasCuttingSheet: boolean }): Observable<Store> {
    const payload = {
      ordoId: store.ordoId.toString(),
      article: store.article,
      hasCuttingSheet: store.hasCuttingSheet.toString()
    };
    console.log('Sending Store payload:', payload);
    return this.http.post<Store>(`${this.apiUrl}/preparedCuttingSheets`, payload, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getStoresByOrdoId(ordoId: number): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/preparedCuttingSheets/ordo/${ordoId}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/preparedCuttingSheets`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllStoresWithOrdos(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/preparedCuttingSheets/with-ordos`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updatePreparationTime(id: number, preparationTime: number): Observable<Store> {
    const payload = { preparationTime };
    return this.http.put<Store>(`${this.apiUrl}/preparedCuttingSheets/${id}/preparation-time`, payload, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  searchStoresByOrderNumber(orderNumber: string): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/preparedCuttingSheets/search`, {
      headers: this.authService.getHeaders(),
      params: { orderNumber }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.status === 400) {
      errorMessage = `Bad request: ${error.error?.message || 'Invalid data'}`;
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