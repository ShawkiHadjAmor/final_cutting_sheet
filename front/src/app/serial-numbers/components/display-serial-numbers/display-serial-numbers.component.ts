import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, switchMap, takeUntil, startWith } from 'rxjs';
import { SerialNumber, SerialNumbersService, Program } from '../../service/serial-numbers.service';
import { HttpErrorResponse } from '@angular/common/http';

interface SearchParams {
  article?: string;
  programId?: number;
  orderNumber?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-display-serial-numbers',
  templateUrl: './display-serial-numbers.component.html',
  styleUrls: ['./display-serial-numbers.component.css']
})
export class DisplaySerialNumbersComponent implements OnInit, OnDestroy {
  serialNumbers: SerialNumber[] = [];
  programs: Program[] = [];
  filterForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private serialNumbersService: SerialNumbersService
  ) {
    this.filterForm = this.fb.group({
      article: [''],
      programId: [null],
      orderNumber: [''],
      createdAt: ['']
    });
  }

  ngOnInit(): void {
    this.loadAllPrograms();
    this.setupRealTimeSearch();
    this.loadAllSerialNumbers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllPrograms(): void {
    this.isLoading = true;
    this.serialNumbersService.getAllPrograms().subscribe({
      next: (data) => {
        this.programs = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Échec du chargement des programmes';
        console.error('Load programs error:', error);
        this.isLoading = false;
      }
    });
  }

  private loadAllSerialNumbers(): void {
    this.isLoading = true;
    this.serialNumbersService.getAllSerialNumbers().subscribe({
      next: (data) => {
        this.serialNumbers = data;
        this.errorMessage = '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Échec du chargement des numéros de série';
        console.error('Load serial numbers error:', error);
        this.isLoading = false;
      }
    });
  }

  private setupRealTimeSearch(): void {
    combineLatest([
      this.filterForm.get('article')!.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterForm.get('programId')!.valueChanges.pipe(startWith(null), debounceTime(300), distinctUntilChanged()),
      this.filterForm.get('orderNumber')!.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged()),
      this.filterForm.get('createdAt')!.valueChanges.pipe(startWith(''), debounceTime(300), distinctUntilChanged())
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([article, programId, orderNumber, createdAt]) => {
          this.isLoading = true;
          this.errorMessage = '';
          const searchParams: SearchParams = {};
          if (article?.trim()) searchParams.article = article.trim();
          if (programId !== null) searchParams.programId = programId;
          if (orderNumber?.trim()) searchParams.orderNumber = orderNumber.trim().toLowerCase();
          if (createdAt?.trim()) searchParams.createdAt = createdAt.trim();

          const queryString = Object.entries(searchParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&');
          console.log('Search API:', `/api/serial-numbers/search?${queryString}`, 'Params:', searchParams);

          return Object.keys(searchParams).length > 0
            ? this.serialNumbersService.searchSerialNumbers(searchParams)
            : this.serialNumbersService.getAllSerialNumbers();
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Search results:', data);
          this.serialNumbers = data;
          this.errorMessage = data.length === 0
            ? (this.filterForm.get('orderNumber')?.value?.trim()
                ? 'Numéro OF introuvable'
                : 'Aucun numéro de série trouvé')
            : '';
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Search error:', error);
          if (error.status === 400 && error.error?.includes('createdAt')) {
            this.errorMessage = 'Format de date invalide. Utilisez AAAA-MM-JJ.';
          } else if (error.status === 400 && error.error?.includes('orderNumber')) {
            this.errorMessage = 'Numéro OF introuvable.';
          } else {
            this.errorMessage = 'Échec de la recherche. Vérifiez vos entrées.';
          }
          this.serialNumbers = [];
          this.isLoading = false;
        }
      });
  }
}