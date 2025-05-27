import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProgramService } from '../../service/program.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/authentification/service/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

type SnFormat = 'prefix-indice-increment' | 'increment-indice-prefix' | 'zasypn-increment-indice' | 'indice-increment-zasypn' | 'indice-zasypn-increment' | 'increment-zasypn-indice';

@Component({
  selector: 'app-view-all-programs',
  templateUrl: './view-all-programs.component.html',
  styleUrls: ['./view-all-programs.component.css']
})
export class ViewAllProgramsComponent implements OnInit, OnDestroy {
  programmes: any[] = [];
  showDeleteModal: boolean = false;
  programmeToDelete: any = null;
  showMessageModal: boolean = false;
  modalMessage: { type: 'success' | 'error', text: string } | null = null;
  private readonly baseUrl: string = 'http://localhost:8081'; // Base URL for image paths

  constructor(
    private programService: ProgramService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private sanitizer: DomSanitizer, // Inject DomSanitizer
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchProgrammes();
  }

  fetchProgrammes(): void {
    this.programService.getAllProgrammes().subscribe({
      next: (response) => {
        this.programmes = response.map(programme => ({
          ...programme,
          imageUrl: undefined, // Initially set to undefined, will be loaded dynamically
          extractionRuleDisplay: this.formatExtractionRule(programme.extractionRule)
        }));
        this.loadImagesForProgrammes();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.showModalMessage('error', error.message || 'Échec du chargement des programmes.');
      }
    });
  }

  private loadImagesForProgrammes(): void {
    this.programmes.forEach(programme => {
      if (programme.imagePath) {
        const imageUrl = `${this.baseUrl}${programme.imagePath}`;
        this.http
          .get(imageUrl, {
            headers: this.authService.getHeaders(),
            responseType: 'blob'
          })
          .subscribe({
            next: (blob) => {
              const objectUrl = URL.createObjectURL(blob);
              // Sanitize the blob URL to bypass Angular's security
              programme.imageUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl) as string;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error(`Failed to load image for programme ${programme.id}:`, error);
              programme.imageUrl = undefined;
              this.cdr.detectChanges();
            }
          });
      } else {
        programme.imageUrl = undefined;
      }
    });
  }

  formatExtractionRule(rule: string | null | undefined): string {
    if (!rule) return 'Non définie';
    try {
      const { snFormat, zasypn, indice } = JSON.parse(rule) as { snFormat: SnFormat, zasypn: string, indice: string };
      const formatDisplay: { [key in SnFormat]: string } = {
        'prefix-indice-increment': 'ZASYP/N+INDICE+INCREMENT',
        'increment-indice-prefix': 'INCREMENT+INDICE+ZASYP/N',
        'zasypn-increment-indice': 'ZASYP/N+INCREMENT+INDICE',
        'indice-increment-zasypn': 'INDICE+INCREMENT+ZASYP/N',
        'indice-zasypn-increment': 'INDICE+ZASYP/N+INCREMENT',
        'increment-zasypn-indice': 'INCREMENT+ZASYP/N+INDICE'
      };
      return `Extrait l'INCREMENT du numéro de série au format ${formatDisplay[snFormat]} avec ZASYP/N="${zasypn}" et INDICE="${indice}".`;
    } catch (error) {
      console.error('Invalid extraction rule format:', error);
      return 'Règle non valide';
    }
  }

  confirmDelete(programme: any): void {
    this.programmeToDelete = programme;
    this.showDeleteModal = true;
  }

  deleteProgramme(): void {
    if (this.programmeToDelete) {
      this.programService.deleteProgramme(this.programmeToDelete.id).subscribe({
        next: () => {
          this.showModalMessage('success', 'Programme supprimé avec succès !');
          this.fetchProgrammes();
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du programme:', error);
          this.showModalMessage('error', error.message || 'Échec de la suppression du programme.');
          this.closeDeleteModal();
        }
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.programmeToDelete = null;
  }

  showModalMessage(type: 'success' | 'error', text: string): void {
    this.modalMessage = { type, text };
    this.showMessageModal = true;
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
    this.modalMessage = null;
  }



  onImageError(programme: any): void {
    programme.imageUrl = undefined;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Clean up object URLs
    this.programmes.forEach(programme => {
      if (programme.imageUrl && typeof programme.imageUrl === 'string' && programme.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(programme.imageUrl.replace('unsafe:', ''));
      }
    });
  }
}