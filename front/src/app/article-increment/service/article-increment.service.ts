import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/authentification/service/auth.service';
import { environment } from 'src/environments/environment';

export interface ArticleIncrement {
  id?: number;
  programId: number;
  article: string;
  lastIncrement: number;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleIncrementService {
  private apiUrl = `${environment.apiUrl}/article-increments`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllArticleIncrements(): Observable<ArticleIncrement[]> {
    return this.http.get<ArticleIncrement[]>(this.apiUrl, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getArticleIncrementById(id: number): Observable<ArticleIncrement> {
    return this.http.get<ArticleIncrement>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createArticleIncrement(articleIncrement: ArticleIncrement): Observable<ArticleIncrement> {
    console.log('Calling createArticleIncrement with payload:', articleIncrement); // Debug log
    return this.http.post<ArticleIncrement>(this.apiUrl, articleIncrement, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  updateArticleIncrement(id: number, articleIncrement: ArticleIncrement): Observable<ArticleIncrement> {
    return this.http.put<ArticleIncrement>(`${this.apiUrl}/${id}`, articleIncrement, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteArticleIncrement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  searchArticleIncrements(programId?: number, article?: string): Observable<ArticleIncrement[]> {
    let url = `${this.apiUrl}/search`;
    const params: { [key: string]: string } = {};
    if (programId) params['programId'] = programId.toString();
    if (article) params['article'] = article;
    return this.http.get<ArticleIncrement[]>(url, { headers: this.authService.getHeaders(), params }).pipe(
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
    console.error('API error:', errorMessage); // Debug log
    return throwError(() => new Error(errorMessage));
  }
}