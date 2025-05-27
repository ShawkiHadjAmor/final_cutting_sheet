import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/authentification/service/auth.service';

interface Ordo {
  id: number;
  orderNumber: string;
  quantity: number;
  article: string;
  date: string;
  programme: string;
  priority: boolean;
  createdAt: string;
}

interface ProgramSearchResult {
  id: number;
  name: string;
  indice: string | null;
  zasypn: string | null;
  hasEvolution: boolean;
}

interface IncrementSearchResult {
  programId: number;
  article: string;
  lastIncrement: number;
  hasEvolution: boolean;
  evolution?: { id: number; oldValue: string; newValue: string; reason: string };
}

@Injectable({
  providedIn: 'root'
})
export class OrdoService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createOrdo(payload: { rows: { orderNumber: string; quantity: number; article: string; date: string; programme: string; rowIndex: string }[]; articles: { article: string; priority: boolean }[]; skipDuplicates?: boolean }): Observable<Ordo[]> {
    console.log('Sending Ordo payload:', payload);
    return this.http.post<Ordo[]>(`${this.apiUrl}/ofs`, payload, {
      headers: this.authService.getHeaders()
    });
  }

  getOrdoById(id: number): Observable<Ordo> {
    return this.http.get<Ordo>(`${this.apiUrl}/ofs/${id}`, {
      headers: this.authService.getHeaders()
    });
  }

  checkDuplicates(rows: { orderNumber: string; article: string; rowIndex: string; programme: string }[]): Observable<{
    duplicates: { orderNumber: string; article: string; rowIndex: string }[];
    blockedByEvolutions: {
      orderNumber: string;
      article: string;
      rowIndex: string;
      programme: string;
      evolutions: {
        field: string;
        reason: string;
        evolutionId: string;
        oldValue: string;
        newValue: string;
        article?: string;
      }[];
    }[];
    allDuplicates: boolean;
    allBlockedByEvolutions: boolean;
  }> {
    return this.http.post<{
      duplicates: { orderNumber: string; article: string; rowIndex: string }[];
      blockedByEvolutions: {
        orderNumber: string;
        article: string;
        rowIndex: string;
        programme: string;
        evolutions: {
          field: string;
          reason: string;
          evolutionId: string;
          oldValue: string;
          newValue: string;
          article?: string;
        }[];
      }[];
      allDuplicates: boolean;
      allBlockedByEvolutions: boolean;
    }>(`${this.apiUrl}/ofs/check-duplicates`, rows, {
      headers: this.authService.getHeaders()
    });
  }

  searchPrograms(query: string): Observable<ProgramSearchResult[]> {
    return this.http.get<ProgramSearchResult[]>(`${this.apiUrl}/evolutions/search-programs`, {
      params: { query },
      headers: this.authService.getHeaders()
    });
  }

  getArticleIncrementWithEvolution(programId: number, article: string): Observable<IncrementSearchResult> {
    return this.http.get<IncrementSearchResult>(`${this.apiUrl}/evolutions/program/${programId}/article/${article}/increment`, {
      headers: this.authService.getHeaders()
    });
  }
}