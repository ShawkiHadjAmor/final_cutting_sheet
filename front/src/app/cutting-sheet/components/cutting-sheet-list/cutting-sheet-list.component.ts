import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject, Subscription, Observable, forkJoin } from 'rxjs';
import { CuttingSheetEndpointsService } from '../../services/endpoints-services/cutting-sheet-endpoints.service';
import { CuttingSheetTemplateService } from '../../services/template-services/cutting-sheet-template.service';
import { ProgramService } from 'src/app/program/service/program.service';
import { CuttingSheetDTO, ProgramDTO } from '../../modals/cuttinsheet/cutting-sheet.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/authentification/service/auth.service';

@Component({
  selector: 'app-cutting-sheet-list',
  templateUrl: './cutting-sheet-list.component.html',
  styleUrls: ['./cutting-sheet-list.component.css']
})
export class CuttingSheetListComponent implements OnInit, OnDestroy {
  groupedCuttingSheets: { [key: string]: CuttingSheetDTO[] } = {};
  programmeSearchTerm: string = '';
  articleSearchTerms: { [key: string]: string } = {};
  selectedType: string = '';
  message: { type: 'success' | 'error' | 'confirm'; text: string; sheetId?: number } | null = null;
  isLoading: boolean = false;
  programmes: ProgramDTO[] = [];
  imageUrls: { [key: number]: string } = {}; // Store image URLs for each sheet

  private readonly baseUrl: string = 'http://localhost:8081'; // Base URL for the backend
  private programmeSearchSubject = new Subject<string>();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private cuttingSheetService: CuttingSheetEndpointsService,
    private templateService: CuttingSheetTemplateService,
    private programService: ProgramService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchProgrammes();
    this.subscriptions.add(
      this.programmeSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          this.isLoading = true;
          this.programmeSearchTerm = term;
          return this.cuttingSheetService.searchCuttingSheetsByProgramme(this.programmeSearchTerm, this.selectedType);
        })
      ).subscribe({
        next: (results) => {
          this.groupedCuttingSheets = this.groupCuttingSheets(results);
          this.loadImagesForSheets(results);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Erreur lors de la recherche des fiches de coupe:', error);
          this.message = { type: 'error', text: 'Échec de la recherche des fiches de coupe.' };
          this.groupedCuttingSheets = {};
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      })
    );

    this.fetchCuttingSheets();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Clean up object URLs
    Object.values(this.imageUrls).forEach(url => {
      if (url !== 'none') {
        URL.revokeObjectURL(url);
      }
    });
  }

  fetchProgrammes(): void {
    this.programService.getAllProgrammes().subscribe({
      next: (response) => {
        this.programmes = response || [];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des programmes:', error);
        this.message = { type: 'error', text: 'Échec du chargement des programmes.' };
      }
    });
  }

  onProgrammeSearchChange(term: string): void {
    this.programmeSearchSubject.next(term);
  }

  onTypeChange(type: string): void {
    this.selectedType = type;
    this.fetchCuttingSheets();
  }

  private fetchCuttingSheets(): void {
    this.isLoading = true;
    this.cuttingSheetService.searchCuttingSheetsByProgramme(this.programmeSearchTerm, this.selectedType).subscribe({
      next: (results) => {
        this.groupedCuttingSheets = this.groupCuttingSheets(results);
        this.loadImagesForSheets(results);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des fiches de coupe:', error);
        this.message = { type: 'error', text: 'Échec du chargement des fiches de coupe.' };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private groupCuttingSheets(cuttingSheets: CuttingSheetDTO[]): { [key: string]: CuttingSheetDTO[] } {
    const grouped: { [key: string]: CuttingSheetDTO[] } = {};
    cuttingSheets.forEach(sheet => {
      const programName = sheet.program?.name || 'Sans programme';
      if (!grouped[programName]) {
        grouped[programName] = [];
      }
      grouped[programName].push(sheet);
    });
    return grouped;
  }

  getFilteredSheets(programName: string): CuttingSheetDTO[] {
    const searchTerm = this.articleSearchTerms[programName] || '';
    const lowerTerm = searchTerm.toLowerCase();
    return this.groupedCuttingSheets[programName]?.filter(sheet =>
      sheet.article?.toLowerCase().includes(lowerTerm)
    ) || [];
  }

  getImageUrl(sheet: CuttingSheetDTO): string {
    if (sheet?.id && this.imageUrls[sheet.id]) {
      return `url(${this.imageUrls[sheet.id]})`;
    }
    return 'none';
  }

  private loadImagesForSheets(sheets: CuttingSheetDTO[]): void {
    sheets.forEach(sheet => {
      if (sheet?.program?.imagePath) {
        const imageUrl = `${this.baseUrl}${sheet.program.imagePath}`;
        this.http
          .get(imageUrl, {
            headers: this.authService.getHeaders(),
            responseType: 'blob'
          })
          .subscribe({
            next: (blob) => {
              const objectUrl = URL.createObjectURL(blob);
              this.imageUrls[sheet.id!] = objectUrl;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error(`Failed to load image for sheet ${sheet.id}:`, error);
              this.imageUrls[sheet.id!] = 'none';
              this.cdr.detectChanges();
            }
          });
      } else {
        this.imageUrls[sheet.id!] = 'none';
      }
    });
  }

  viewTemplate(sheet: CuttingSheetDTO): void {
    this.isLoading = true;
    try {
      const operations = sheet.operationsJson ? JSON.parse(sheet.operationsJson) : [];
      const customOperationIds = sheet.customOperationIds || [];

      if (!Array.isArray(customOperationIds) || customOperationIds.length === 0) {
        console.log('No custom operations found for cutting sheet:', sheet.id);
        const templateData = { ...sheet, operations, customOperations: [] };
        this.renderTemplate(templateData);
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      console.log('Fetching custom operations for IDs:', customOperationIds);
      const customOperationRequests: Observable<any>[] = customOperationIds.map((id: number) =>
        this.cuttingSheetService.getCustomOperationById(id)
      );

      forkJoin(customOperationRequests).subscribe({
        next: (customOperations: any[]) => {
          console.log('Fetched custom operations:', customOperations);
          const enrichedCustomOperations = customOperations.map(op => {
            let parsedTableData = [];
            try {
              parsedTableData = op.tabledata ? JSON.parse(op.tabledata) : [];
            } catch (e) {
              console.error(`Error parsing tabledata for custom operation ID ${op.id}:`, e);
            }
            return {
              ...op,
              tabledata: parsedTableData
            };
          });
          const templateData = { ...sheet, operations, customOperations: enrichedCustomOperations };
          this.renderTemplate(templateData);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Erreur lors de la récupération des opérations personnalisées:', error);
          this.message = { type: 'error', text: 'Échec de la récupération des opérations personnalisées.' };
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du modèle:', error);
      this.message = { type: 'error', text: 'Échec de la génération du modèle.' };
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private renderTemplate(templateData: any): void {
    try {
      const templateHtml = this.templateService.generateTemplate(templateData);
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(templateHtml);
        newWindow.document.close();
      } else {
        console.error('Échec de l\'ouverture de la nouvelle fenêtre. Veuillez autoriser les pop-ups.');
        this.message = { type: 'error', text: 'Échec de l\'ouverture de la fenêtre. Veuillez autoriser les pop-ups.' };
      }
    } catch (error) {
      console.error('Erreur lors du rendu du modèle:', error);
      this.message = { type: 'error', text: 'Échec du rendu du modèle.' };
    }
  }

  confirmDelete(sheet: CuttingSheetDTO): void {
    this.message = {
      type: 'confirm',
      text: `Voulez-vous vraiment supprimer la fiche de coupe pour l'article "${sheet.article}" ?`,
      sheetId: sheet.id
    };
    this.cdr.detectChanges();
  }

  deleteCuttingSheet(): void {
    if (!this.message?.sheetId) return;
    this.isLoading = true;
    this.cuttingSheetService.deleteCuttingSheet(this.message.sheetId).subscribe({
      next: () => {
        this.message = { type: 'success', text: 'Fiche de coupe supprimée avec succès !' };
        this.fetchCuttingSheets();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression de la fiche de coupe:', error);
        this.message = { type: 'error', text: 'Échec de la suppression de la fiche de coupe.' };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeMessage(): void {
    this.message = null;
    this.cdr.detectChanges();
  }

  getObjectKeys(obj: { [key: string]: CuttingSheetDTO[] }): string[] {
    return Object.keys(obj);
  }
}