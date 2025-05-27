import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SerialNumber {
  id: number;
  programName: string;
  serialNumberFrom: string;
  serialNumberTo: string;
  plan: string;
  indice: string;
  article: string;
  increment: number;
  createdAt: string;
  ofId?: number;
  orderNumber?: string;
  quantity?: number;
  date?: string;
  programme?: string;
}

export interface SearchSerialNumberRequest {
  article?: string;
  programId?: number | null;
  orderNumber?: string;
  createdAt?: string;
}

export interface Program {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SerialNumbersService {
  private apiUrl = environment.apiUrl + '/serial-numbers';

  constructor(private http: HttpClient) { }

  getAllSerialNumbers(): Observable<SerialNumber[]> {
    return this.http.get<SerialNumber[]>(this.apiUrl);
  }

  searchSerialNumbers(request: SearchSerialNumberRequest): Observable<SerialNumber[]> {
    return this.http.post<SerialNumber[]>(`${this.apiUrl}/search`, request);
  }

  getAllPrograms(): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}/programs`);
  }
}