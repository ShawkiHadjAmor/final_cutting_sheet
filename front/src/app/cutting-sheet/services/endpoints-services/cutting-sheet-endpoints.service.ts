import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/authentification/service/auth.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CuttingSheetEndpointsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** Retrieves all cutting sheets */
  getAllCuttingSheets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cuttingSheets`, { headers: this.authService.getHeaders() });
  }

  /** Retrieves a cutting sheet by ID */
  getCuttingSheetById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cuttingSheets/${id}`, { headers: this.authService.getHeaders() });
  }

  /** Retrieves cutting sheets by exact article match */
  getCuttingSheetByArticle(article: string): Observable<any[]> {
    console.log(`Fetching cutting sheet for article: "${article}"`);
    return this.http.get<any[]>(`${this.apiUrl}/cuttingSheets/search/byArticle?article=${encodeURIComponent(article)}`, { headers: this.authService.getHeaders() });
  }

  /** Searches cutting sheets where article contains the given string */
  searchByArticleContain(article: string): Observable<any[]> {
    console.log(`Searching cutting sheets containing article: "${article}"`);
    return this.http.get<any[]>(`${this.apiUrl}/cuttingSheets/search/contain?article=${encodeURIComponent(article)}`, { headers: this.authService.getHeaders() });
  }

  /** Searches cutting sheets by programme and/or type */
  searchCuttingSheetsByProgramme(programme: string, type?: string): Observable<any[]> {
    let params = new HttpParams();
    if (programme) {
      params = params.set('program', programme); // Match backend parameter name "program"
    }
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<any[]>(`${this.apiUrl}/cuttingSheets/search`, { headers: this.authService.getHeaders(), params });
  }

  /** Creates a new cutting sheet */
  createCuttingSheet(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cuttingSheets`, payload, { headers: this.authService.getHeaders() });
  }

  /** Updates an existing cutting sheet */
  updateCuttingSheet(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/cuttingSheets/${id}`, payload, { headers: this.authService.getHeaders() });
  }

  /** Deletes a cutting sheet by ID */
  deleteCuttingSheet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cuttingSheets/${id}`, { headers: this.authService.getHeaders() });
  }

  /** Retrieves all custom operations */
  getAllCustomOperations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/custom-operations`, { headers: this.authService.getHeaders() });
  }

  /** Retrieves a custom operation by ID */
  getCustomOperationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/custom-operations/${id}`, { headers: this.authService.getHeaders() });
  }

  /** Searches custom operations by name (contains) */
  searchCustomOperationsByName(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/custom-operations/search?name=${encodeURIComponent(name)}`, { headers: this.authService.getHeaders() });
  }

  /** Creates a new custom operation */
  createCustomOperation(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/custom-operations`, payload, { headers: this.authService.getHeaders() });
  }

  /** Updates an existing custom operation */
  updateCustomOperation(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/custom-operations/${id}`, payload, { headers: this.authService.getHeaders() });
  }

  /** Deletes a custom operation by ID */
  deleteCustomOperation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/custom-operations/${id}`, { headers: this.authService.getHeaders() });
  }
/** Retrieves cutting sheets by exact article and program match */
getCuttingSheetByArticleAndProgram(article: string, program: string): Observable<any[]> {
  console.log(`Fetching cutting sheet for article: "${article}" and program: "${program}"`);
const params = new HttpParams()
    .set('article', article.trim()) // Avoid encoding twice, trim for safety
    .set('program', program.trim()); 
  return this.http.get<any[]>(`${this.apiUrl}/ofs/cuttingSheets/search/byArticleAndProgram`, {
    headers: this.authService.getHeaders(),
    params
  });
}
  /** Retrieves eligible articles for a given program ID */
  getEligibleArticlesForProgram(programId: number): Observable<string[]> {
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa   ");
    return this.http.get<string[]>(`${this.apiUrl}/cuttingSheets/eligibleArticles?programId=${programId}`, {
      headers: this.authService.getHeaders()
    });
  }
}