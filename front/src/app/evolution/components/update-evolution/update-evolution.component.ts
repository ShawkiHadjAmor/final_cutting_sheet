import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EvolutionService, Evolution, Program } from '../../service/evolution.service';
import { AuthService } from '../../../authentification/service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-evolution',
  templateUrl: './update-evolution.component.html',
  styleUrls: ['./update-evolution.component.css']
})
export class UpdateEvolutionComponent implements OnInit {
  evolutionForm: FormGroup;
  evolutions: Evolution[] = [];
  filteredEvolutions: Evolution[] = [];
  selectedEvolution: Evolution | null = null;
  programs: Program[] = [];
  articles: string[] = [];
  zasypn: string = '';
  showDetails: boolean = false;
  modalMessage: { type: 'success' | 'error'; text: string } | null = null;
  searchId: string = '';
  searchArticle: string = '';
  searchProgramme: string = '';
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private evolutionService: EvolutionService,
    private authService: AuthService,
    private router: Router
  ) {
    this.evolutionForm = this.fb.group({
      programId: ['', Validators.required],
      article: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || !this.authService.hasRole('QUALITY')) {
      this.showModalMessage('error', 'Vous devez être connecté avec le rôle QUALITY pour mettre à jour une évolution.');
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.loadEvolutions();
    this.loadPrograms();
  }

  loadEvolutions(): void {
    this.isLoading = true;
    this.evolutionService.getActiveEvolutions().subscribe({
      next: (data: Evolution[]) => {
        this.evolutions = data;
        this.filteredEvolutions = data;
        this.errorMessage = null;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.showModalMessage('error', 'Erreur lors du chargement des évolutions : ' + err.message);
        this.isLoading = false;
      }
    });
  }

  loadPrograms(): void {
    this.evolutionService.getPrograms().subscribe({
      next: (programs: Program[]) => {
        this.programs = programs;
      },
      error: (err: Error) => {
        console.error('Erreur lors du chargement des programmes:', err);
        this.showModalMessage('error', 'Échec du chargement des programmes.');
      }
    });
  }

  applyFilters(): void {
    const idQuery = this.searchId.toLowerCase().trim();
    const articleQuery = this.searchArticle.toLowerCase().trim();
    const programmeQuery = this.searchProgramme.toLowerCase().trim();

    this.filteredEvolutions = this.evolutions.filter(evolution => {
      const matchesId = !idQuery || evolution.id.toString().toLowerCase().includes(idQuery);
      const matchesArticle = !articleQuery || (evolution.article?.toLowerCase().includes(articleQuery));
      const matchesProgramme = !programmeQuery || (evolution.programName?.toLowerCase().includes(programmeQuery));
      return matchesId && matchesArticle && matchesProgramme;
    });
  }

  openDetails(evolution: Evolution): void {
    this.selectedEvolution = evolution;
    this.showDetails = true;
    this.evolutionForm.patchValue({
      programId: evolution.programId,
      article: evolution.article,
      reason: evolution.reason
    });
    this.onProgramChange();
  }

  onProgramChange(): void {
    const programId = this.evolutionForm.get('programId')?.value;
    if (programId) {
      this.evolutionService.getProgramDetails(programId).subscribe({
        next: (program: Program) => {
          this.zasypn = program.zasypn || '';
        },
        error: () => {
          this.zasypn = '';
        }
      });
      this.evolutionService.getArticlesByProgram(programId).subscribe({
        next: (articles: string[]) => {
          this.articles = articles;
        },
        error: () => {
          this.articles = [];
        }
      });
    } else {
      this.zasypn = '';
      this.articles = [];
    }
  }

  saveEvolution(): void {
    if (this.evolutionForm.invalid || !this.selectedEvolution) {
      this.evolutionForm.markAllAsTouched();
      this.showModalMessage('error', 'Veuillez remplir tous les champs requis.');
      return;
    }

    this.isLoading = true;
    const payload = {
      programId: this.evolutionForm.get('programId')?.value,
      article: this.evolutionForm.get('article')?.value,
      reason: this.evolutionForm.get('reason')?.value
    };

    this.evolutionService.updateEvolutionByQuality(this.selectedEvolution.id, payload).subscribe({
      next: () => {
        this.showModalMessage('success', 'Évolution mise à jour avec succès !');
        this.isLoading = false;
        setTimeout(() => {
          this.closeDetails();
          this.loadEvolutions();
        }, 2000);
      },
      error: (err: Error) => {
        this.showModalMessage('error', err.message || 'Échec de la mise à jour de l\'évolution.');
        this.isLoading = false;
      }
    });
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedEvolution = null;
    this.evolutionForm.reset();
    this.zasypn = '';
    this.articles = [];
  }

  showModalMessage(type: 'success' | 'error', text: string): void {
    this.modalMessage = { type, text };
    setTimeout(() => this.modalMessage = null, 3000);
  }

  getBlockedValue(evolution: Evolution): string {
    if (evolution.futureIncrement) {
      return `SN bloqué: ${evolution.futureIncrement}`;
    } else if (evolution.orderNumber) {
      return `OF bloqué: ${evolution.orderNumber}`;
    }
    return 'Pas encore';
  }
}