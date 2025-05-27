import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EvolutionService, Evolution } from '../../service/evolution.service';
import { AuthService } from 'src/app/authentification/service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ordo-update-evolution',
  templateUrl: './ordo-update-evolution.component.html',
  styleUrls: ['./ordo-update-evolution.component.css']
})
export class OrdoUpdateEvolutionComponent implements OnInit {
  evolutionForm: FormGroup;
  evolutions: Evolution[] = [];
  filteredEvolutions: Evolution[] = [];
  selectedEvolution: Evolution | null = null;
  showDetails: boolean = false;
  modalMessage: { type: 'success' | 'error'; text: string } | null = null;
  searchId: string = '';
  searchArticle: string = '';
  searchProgramme: string = '';
  errorMessage: string | null = null;
  isLoading: boolean = false;
  hasLastIncrement: boolean = false;

  constructor(
    private fb: FormBuilder,
    private evolutionService: EvolutionService,
    private authService: AuthService,
    private router: Router
  ) {
    this.evolutionForm = this.fb.group({
      futureIncrement: ['', [Validators.minLength(1), Validators.maxLength(50)]],
      ordoComment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated() || !this.authService.hasRole('ORDO')) {
      this.showModalMessage('error', 'Vous devez être connecté avec le rôle ORDO pour accéder à cette page.');
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }
    this.loadEvolutions();
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
      futureIncrement: evolution.futureIncrement || evolution.orderNumber || '',
      ordoComment: evolution.ordoComment || ''
    });
    this.checkLastIncrement(evolution);
  }

  checkLastIncrement(evolution: Evolution): void {
    if (evolution.programId && evolution.article) {
      this.evolutionService.getArticleIncrementWithEvolution(evolution.programId, evolution.article).subscribe({
        next: (data) => {
          this.hasLastIncrement = data.lastIncrement !== null && data.lastIncrement !== undefined;
        },
        error: () => {
          this.hasLastIncrement = false;
        }
      });
    }
  }

  saveEvolution(): void {
    if (this.evolutionForm.invalid || !this.selectedEvolution) {
      this.evolutionForm.markAllAsTouched();
      this.showModalMessage('error', 'Veuillez remplir les champs requis.');
      return;
    }

    this.isLoading = true;
    const payload = {
      futureIncrement: this.evolutionForm.get('futureIncrement')?.value || null,
      ordoComment: this.evolutionForm.get('ordoComment')?.value || null
    };
    this.evolutionService.updateEvolutionByOrdo(this.selectedEvolution.id, payload).subscribe({
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