import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StoreService, Store } from '../../service/store.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-store-preparation-time',
  templateUrl: './store-preparation-time.component.html',
  styleUrls: ['./store-preparation-time.component.css']
})
export class StorePreparationTimeComponent implements OnInit, OnDestroy {
  stores: Store[] = [];
  isLoading: boolean = false;
  messageModal: string | null = null;
  messageTitle: string = '';
  searchTerm: string = '';
  preparationTimes: { [key: number]: string } = {};
  completedSheets: Set<number> = new Set();

  private timerSubscription: Subscription | null = null;
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  constructor(
    private storeService: StoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStores();
    this.startTimer();
    this.setupSearch();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadStores() {
    this.isLoading = true;
    this.storeService.getAllStoresWithOrdos().subscribe({
      next: (stores: Store[]) => {
        this.stores = stores;
        this.isLoading = false;
        this.updatePreparationTimes(stores);
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors du chargement des articles: ${error.message}`);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private setupSearch() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.isLoading = true;
        return term.trim() ? 
               this.storeService.searchStoresByOrderNumber(term) : 
               this.storeService.getAllStoresWithOrdos();
      })
    ).subscribe({
      next: (stores: Store[]) => {
        this.stores = stores;
        this.isLoading = false;
        this.updatePreparationTimes(stores);
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de la recherche: ${error.message}`);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  search() {
    this.searchSubject.next(this.searchTerm);
  }

  private updatePreparationTimes(stores: Store[]) {
    this.preparationTimes = {};
    stores.forEach(store => {
      if (store.preparationTime) {
        this.preparationTimes[store.id] = this.formatDuration(store.preparationTime * 1000);
        this.completedSheets.add(store.id);
      } else if (store.createdAt) {
        const startTime = new Date(store.createdAt);
        if (isNaN(startTime.getTime())) {
          console.error(`Invalid createdAt date for store ID ${store.id}: ${store.createdAt}`);
          this.preparationTimes[store.id] = '0h 0m 0s';
        } else {
          const elapsed = this.calculateWorkingTime(startTime, new Date());
          this.preparationTimes[store.id] = this.formatDuration(elapsed);
        }
      } else {
        console.warn(`No createdAt for store ID ${store.id}, setting to 0`);
        this.preparationTimes[store.id] = '0h 0m 0s';
      }
    });
  }

  private startTimer() {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.stores.forEach(store => {
        if (!this.completedSheets.has(store.id) && store.createdAt) {
          const startTime = new Date(store.createdAt);
          if (!isNaN(startTime.getTime())) {
            const elapsed = this.calculateWorkingTime(startTime, new Date());
            this.preparationTimes[store.id] = this.formatDuration(elapsed);
          }
        }
      });
      this.cdr.detectChanges();
    });
  }

  stopCounter(storeId: number) {
    const store = this.stores.find(s => s.id === storeId);
    if (!store || !store.createdAt) return;

    const startTime = new Date(store.createdAt);
    if (isNaN(startTime.getTime())) {
      this.showMessageModal('Erreur', `Invalid createdAt date for store ID ${store.id}`);
      return;
    }

    const endTime = new Date();
    const elapsed = this.calculateWorkingTime(startTime, endTime);
    const elapsedSeconds = Math.floor(elapsed / 1000);

    this.storeService.updatePreparationTime(storeId, elapsedSeconds).subscribe({
      next: (updatedStore: Store) => {
        store.preparationTime = elapsedSeconds;
        this.preparationTimes[storeId] = this.formatDuration(elapsed);
        this.completedSheets.add(storeId);
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de la mise à jour du temps de préparation: ${error.message}`);
        this.cdr.detectChanges();
      }
    });
  }

  exportToExcel() {
    // Prepare the data
    const data = this.stores.map(store => ({
      Article: store.article,
      OF: store.ordo.orderNumber,
      Quantité: store.ordo.quantity,
      Programme: store.ordo.programme,
      Priorité: store.ordo.priority ? 'Urgent' : 'Non Urgent',
      'Créé le': store.createdAt,
      'Temps de préparation': this.preparationTimes[store.id] || 'En cours...',
      '': '' // Empty column for the second column of Temps de préparation
    }));

    // Create a worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    // Add the title
    XLSX.utils.sheet_add_aoa(ws, [['Temps de Préparation des OF']], { origin: 'A1' });

    // Style the title: bold, blue, large font, centered
    ws['A1'] = {
      v: 'Temps de Préparation des OF',
      s: {
        font: {
          bold: true,
          size: 16,
          color: { rgb: '0000FF' }
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      }
    };

    // Merge cells for the title (spanning 8 columns: A1:H1)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title: A1:H1
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }  // Temps de préparation header: G3:H3
    ];

    // Add column headers starting at A3 (leaving A2 blank for spacing)
    XLSX.utils.sheet_add_aoa(ws, [[
      'Article',
      'OF',
      'Quantité',
      'Programme',
      'Priorité',
      'Créé le',
      'Temps de préparation',
      ''
    ]], { origin: 'A3' });

    // Add data starting at A4
    XLSX.utils.sheet_add_json(ws, data, { origin: 'A4', skipHeader: true });

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 20 }, // Article
      { wch: 15 }, // OF
      { wch: 10 }, // Quantité
      { wch: 20 }, // Programme
      { wch: 15 }, // Priorité
      { wch: 20 }, // Créé le
      { wch: 20 }, // Temps de préparation (first column)
      { wch: 10 }  // Temps de préparation (second column, empty)
    ];

    // Create workbook and append sheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PreparationTimes');

    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `preparation_times_${date}.xlsx`);
  }

  isSheetCompleted(storeId: number): boolean {
    return this.completedSheets.has(storeId);
  }

  private calculateWorkingTime(start: Date, end: Date): number {
    const elapsed = end.getTime() - start.getTime();
    return Math.max(0, elapsed);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  showMessageModal(title: string, message: string) {
    this.messageTitle = title;
    this.messageModal = message;
  }

  closeMessageModal() {
    this.messageModal = null;
    this.messageTitle = '';
  }
}