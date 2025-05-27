import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/authentification/service/auth.service';

export interface Cml {
  id: number;
  article: string | null;
  createdAt: string;
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

export interface Program {
  id: number;
  name: string;
  extractionRule: string;
}

export interface SerialNumber {
  serialNumberTo: string;
  numeroDeSerie: string;
}

export interface SerialNumberResponse {
  serialNumberFrom: string;
  serialNumberTo: string;
  program: string;
  article: string;
  of: number;
}

export interface OfResponse {
  id: number;
  orderNumber: string;
  quantity: number;
  article: string;
  date: string;
  programme: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CmlService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createCml(cml: { ordoId: number; article: string }): Observable<Cml> {
    const payload = {
      ordoId: cml.ordoId.toString(),
      article: cml.article
    };
    console.log('Sending Cml payload:', payload);
    return this.http.post<Cml>(`${this.apiUrl}/launchedCuttingSheets`, payload, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getCmlsByOrdoId(ordoId: number): Observable<Cml[]> {
    return this.http.get<Cml[]>(`${this.apiUrl}/launchedCuttingSheets/ordo/${ordoId}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllCmls(): Observable<Cml[]> {
    return this.http.get<Cml[]>(`${this.apiUrl}/launchedCuttingSheets`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getAllCmlsWithOrdos(): Observable<Cml[]> {
    return this.http.get<Cml[]>(`${this.apiUrl}/launchedCuttingSheets/with-ordos`, {
      headers: this.authService.getHeaders()
    }).pipe(
      map(cmls => {
        console.log('Raw CMLs from API (/launchedCuttingSheets/with-ordos):', JSON.stringify(cmls, null, 2));
        return cmls;
      }),
      catchError(this.handleError)
    );
  }

  getCuttingSheetByArticle(article: string | null): Observable<any> {
    if (!article || article.trim() === '') {
      console.error(`Invalid article provided: "${article}"`);
      return throwError(() => new Error('Article is required and must be a non-empty string'));
    }
    console.log(`Fetching cutting sheet for article: "${article}"`);
    return this.http.get<any[]>(`${this.apiUrl}/cuttingSheets/search/byArticle?article=${encodeURIComponent(article.trim().toLowerCase())}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      map(sheets => {
        if (sheets && sheets.length > 0) {
          return sheets[0];
        }
        throw new Error(`No cutting sheet found for article: ${article}`);
      }),
      catchError(this.handleError)
    );
  }

  deleteCml(cmlId: number): Observable<void> {
    console.log(`Deleting CML with ID: ${cmlId}`);
    return this.http.delete<void>(`${this.apiUrl}/launchedCuttingSheets/${cmlId}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getProgramById(programId: number): Observable<Program> {
    return this.http.get<Program>(`${this.apiUrl}/programs/${programId}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getProgramByName(name: string): Observable<Program> {
    return this.http.get<Program[]>(`${this.apiUrl}/programs/search?name=${encodeURIComponent(name)}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      map(programs => {
        if (programs && programs.length > 0) {
          return programs[0];
        }
        throw new Error(`Programme not found for name: ${name}`);
      }),
      catchError(error => {
        console.error(`Error searching for programme ${name}:`, error);
        return this.getProgramById(1).pipe(
          map(program => {
            console.warn(`Programme ${name} not found, using default program ID=1`);
            return program;
          })
        );
      })
    );
  }

  getOfById(ofId: number): Observable<OfResponse> {
    return this.http.get<OfResponse>(`${this.apiUrl}/ofs/${ofId}`, {
      headers: this.authService.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getSerialNumber(payload: { programmeId: number; article: string; of?: string }): Observable<SerialNumber> {
    if (!payload.of) {
      return throwError(() => new Error('OF ID is required to fetch a serial number'));
    }
    const normalizedOfId = Number(payload.of);
    if (isNaN(normalizedOfId)) {
      return throwError(() => new Error('OF ID must be a valid number'));
    }
    const normalizedPayload = {
      programId: payload.programmeId,
      article: payload.article ? payload.article.trim().toLowerCase() : '',
      ofId: normalizedOfId
    };
    console.log('Fetching serial number with payload:', normalizedPayload);
    return this.http.post<SerialNumberResponse[]>(`${this.apiUrl}/serial-numbers/search`, normalizedPayload, {
      headers: this.authService.getHeaders()
    }).pipe(
      map(responses => {
        if (responses && responses.length > 0) {
          const response = responses[0];
          return {
            numeroDeSerie: response.serialNumberFrom,
            serialNumberTo: response.serialNumberTo
          };
        }
        throw new Error('Serial number not found');
      }),
      catchError(error => {
        if (error.message === 'Serial number not found') {
          return throwError(() => error);
        }
        return throwError(() => new Error(`Error fetching serial number: ${error.error?.message || error.message}`));
      })
    );
  }

  createSerialNumber(serialNumber: { programmeId: number; article: string; of?: string; reference?: string; quantite?: string }): Observable<SerialNumber> {
    const normalizedOfId = serialNumber.of ? Number(serialNumber.of) : undefined;
    const normalizedArticle = serialNumber.article ? serialNumber.article.trim().toLowerCase() : '';
    const quantite = serialNumber.quantite ? serialNumber.quantite : undefined;

    if (!normalizedOfId) {
      return throwError(() => new Error('OF ID is required to create a serial number'));
    }
    if (!normalizedArticle) {
      return throwError(() => new Error('Article is required to create a serial number'));
    }
    if (!serialNumber.programmeId) {
      return throwError(() => new Error('Program ID is required to create a serial number'));
    }

    return this.getProgramById(serialNumber.programmeId).pipe(
      switchMap(program => {
        return this.getOfById(normalizedOfId).pipe(
          switchMap(of => {
            const normalizedSerialNumber = {
              programId: serialNumber.programmeId,
              article: normalizedArticle,
              ofId: normalizedOfId,
              quantite: quantite ? Number(quantite) : of.quantity,
              reference: serialNumber.reference ? serialNumber.reference.trim() : undefined
            };
            console.log('Creating serial number with payload:', normalizedSerialNumber);
            return this.http.post<SerialNumberResponse>(`${this.apiUrl}/serial-numbers`, normalizedSerialNumber, {
              headers: this.authService.getHeaders()
            }).pipe(
              map(response => {
                console.log('Serial number created successfully:', response);
                return {
                  numeroDeSerie: response.serialNumberFrom,
                  serialNumberTo: response.serialNumberTo
                };
              }),
              catchError(this.handleSerialNumberCreationError)
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error in createSerialNumber pipeline:', error);
        return throwError(() => new Error(`Failed to create serial number: ${error.message}`));
      })
    );
  }

  private handleSerialNumberCreationError(error: HttpErrorResponse): Observable<never> {
    console.error('Failed to create serial number:', error);
    if (error.status === 409) {
      return throwError(() => new Error('A serial number already exists for this program, article, and OF combination'));
    } else if (error.status === 500) {
      return throwError(() => new Error('Server error creating serial number. Please contact the administrator.'));
    }
    return throwError(() => new Error(`Failed to create serial number: ${error.error?.message || error.message}`));
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