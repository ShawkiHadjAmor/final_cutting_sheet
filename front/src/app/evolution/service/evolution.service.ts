import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../authentification/service/auth.service';
import { environment } from '../../../environments/environment';

export interface Evolution {
  id: number;
  programId: number | null;
  programName: string | null;
  article: string | null;
  reason: string;
  futureIncrement: string | null;
  orderNumber: string | null;
  ordoComment: string | null;
  createdBy: string;
  createdAt: string;
  closedBy: string | null;
  closedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  active: boolean;
}

export interface Program {
  id: number;
  name: string;
  indice: string | null;
  zasypn: string | null;
  extractionRule?: string; 
}

export interface ArticleIncrement {
  id: number;
  programId: number;
  article: string;
  lastIncrement: number;
}

@Injectable({
  providedIn: 'root'
})
export class EvolutionService {
  private apiUrl = `${environment.apiUrl}/evolutions`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createEvolution(evolution: Partial<Evolution>): Observable<Evolution> {
    const headers = this.authService.getHeaders().set('X-No-Logout-On-401', 'true');
    return this.http.post<Evolution>(`${this.apiUrl}`, evolution, { headers })
      .pipe(catchError(this.handleError));
  }

  updateEvolutionByOrdo(id: number, payload: { futureIncrement: string | null; ordoComment: string | null }): Observable<Evolution> {
    return this.http.put<Evolution>(`${this.apiUrl}/${id}/ordo`, payload, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateEvolutionByQuality(id: number, payload: { programId: number; article: string; reason: string }): Observable<Evolution> {
    return this.http.put<Evolution>(`${this.apiUrl}/${id}/quality`, payload, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  closeEvolution(id: number): Observable<Evolution> {
    return this.http.put<Evolution>(`${this.apiUrl}/${id}/close`, {}, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  resolveEvolution(id: number): Observable<Evolution> {
    return this.http.put<Evolution>(`${this.apiUrl}/${id}/resolve`, {}, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getActiveEvolutions(): Observable<Evolution[]> {
    return this.http.get<Evolution[]>(`${this.apiUrl}/active`, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getEvolutionById(id: number): Observable<Evolution> {
    return this.http.get<Evolution>(`${this.apiUrl}/${id}`, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getPrograms(query?: string): Observable<Program[]> {
    const url = query ? `${this.apiUrl}/search-programs?query=${encodeURIComponent(query)}` : `${this.apiUrl}/search-programs`;
    return this.http.get<Program[]>(url, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getProgramDetails(id: number): Observable<Program> {
    return this.http.get<any>(`${this.apiUrl}/program/${id}`, { headers: this.authService.getHeaders() })
      .pipe(
        map(response => {
          let zasypn: string | null = null;
          let indice: string | null = null;
          if (response.extractionRule) {
            try {
              const extractionRule = JSON.parse(response.extractionRule);
              zasypn = extractionRule.zasypn || null;
              indice = extractionRule.indice || null;
            } catch (e) {
              console.error('Failed to parse extractionRule:', e);
            }
          }
          return {
            id: response.id,
            name: response.name,
            indice: indice,
            zasypn: zasypn,
            extractionRule: response.extractionRule
          } as Program;
        }),
        catchError(this.handleError)
      );
  }

  getArticleIncrementsByProgram(programId: number): Observable<ArticleIncrement[]> {
    return this.http.get<ArticleIncrement[]>(`${this.apiUrl}/program/${programId}/article-increments`, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getArticleIncrementWithEvolution(programId: number, article: string): Observable<{ programId: number; article: string; lastIncrement: number; evolution?: { id: number; futureIncrement: string; orderNumber: string | null; reason: string; ordoComment: string | null } }> {
    return this.http.get<{ programId: number; article: string; lastIncrement: number; evolution?: { id: number; futureIncrement: string; orderNumber: string | null; reason: string; ordoComment: string | null } }>(
      `${this.apiUrl}/program/${programId}/article/${article}/increment`,
      { headers: this.authService.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  getArticlesByProgram(programId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/program/${programId}/articles`, { headers: this.authService.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur côté client: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Erreur serveur: Code ${error.status}, Message: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}