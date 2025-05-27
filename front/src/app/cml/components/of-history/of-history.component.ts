import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { ArchivedCuttingSheet, QualityService } from 'src/app/quality/service/quality.service';

@Component({
  selector: 'app-of-history',
  templateUrl: './of-history.component.html',
  styleUrls: ['./of-history.component.css']
})
export class OfHistoryComponent implements OnInit, OnDestroy {
  archivedSheets: ArchivedCuttingSheet[] = [];
  isLoading: boolean = false;
  messageModal: string | null = null;
  messageTitle: string = '';
  preparationTimes: { [key: number]: string } = {};
  completedSheets: Set<number> = new Set(); // Track completed sheets

  timerSubscription: Subscription | null = null;

  constructor(
    private cuttingSheetArchiveService: QualityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadArchivedSheets();
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  loadArchivedSheets() {
    this.isLoading = true;
    this.cuttingSheetArchiveService.getAllArchivedCuttingSheets({}).subscribe({
      next: (sheets: ArchivedCuttingSheet[]) => {
        this.archivedSheets = sheets;
        this.isLoading = false;
        sheets.forEach(sheet => {
          if (sheet.preparationTime) {
            // Sheet has a recorded preparation time (completed)
            this.preparationTimes[sheet.id] = this.formatDuration(sheet.preparationTime * 1000);
            this.completedSheets.add(sheet.id); // Mark as completed
          } else if (sheet.printedAt) {
            const startTime = new Date(sheet.printedAt);
            if (isNaN(startTime.getTime())) {
              console.error(`Invalid printedAt date for sheet ID ${sheet.id}: ${sheet.printedAt}`);
              this.preparationTimes[sheet.id] = '0h 0m 0s';
            } else {
              // Initialize timer for non-completed sheets with valid printedAt
              const elapsed = this.calculateWorkingTime(startTime, new Date());
              this.preparationTimes[sheet.id] = this.formatDuration(elapsed);
            }
          } else {
            console.warn(`No printedAt for sheet ID ${sheet.id}, setting to 0`);
            this.preparationTimes[sheet.id] = '0h 0m 0s';
          }
        });
        this.cdr.detectChanges(); // Force UI update
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors du chargement des fiches archivées: ${error.message}`);
        this.isLoading = false;
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }

  private startTimer() {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.archivedSheets.forEach(sheet => {
        // Only update timer for sheets that are not completed and have a valid printedAt
        if (!this.completedSheets.has(sheet.id) && sheet.printedAt) {
          const startTime = new Date(sheet.printedAt);
          if (!isNaN(startTime.getTime())) {
            const elapsed = this.calculateWorkingTime(startTime, new Date());
            this.preparationTimes[sheet.id] = this.formatDuration(elapsed);
          }
        }
      });
      this.cdr.detectChanges(); // Force UI update every second
    });
  }

  stopCounter(archiveId: number) {
    const sheet = this.archivedSheets.find(s => s.id === archiveId);
    if (!sheet || !sheet.printedAt) return;

    const startTime = new Date(sheet.printedAt);
    if (isNaN(startTime.getTime())) {
      this.showMessageModal('Erreur', `Invalid printedAt date for sheet ID ${sheet.id}`);
      return;
    }

    const endTime = new Date();
    const elapsed = this.calculateWorkingTime(startTime, endTime);
    const elapsedSeconds = Math.floor(elapsed / 1000);

    this.cuttingSheetArchiveService.updatePreparationTime(archiveId, elapsedSeconds).subscribe({
      next: () => {
        sheet.preparationTime = elapsedSeconds; // Update local sheet
        this.preparationTimes[archiveId] = this.formatDuration(elapsed);
        this.completedSheets.add(archiveId); // Mark as completed
        this.cdr.detectChanges(); // Force UI update
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de la mise à jour du temps de préparation: ${error.message}`);
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }

  isSheetCompleted(sheetId: number): boolean {
    return this.completedSheets.has(sheetId);
  }

  private calculateWorkingTime(start: Date, end: Date): number {
    // Calculate total elapsed time in milliseconds
    const elapsed = end.getTime() - start.getTime();
    return Math.max(0, elapsed); // Ensure non-negative
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