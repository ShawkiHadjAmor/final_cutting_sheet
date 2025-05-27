import { Component, OnInit } from '@angular/core';
import { EvolutionService, Evolution } from '../../service/evolution.service';
import { AuthService } from 'src/app/authentification/service/auth.service';

@Component({
  selector: 'app-list-evolutions',
  templateUrl: './list-evolutions.component.html',
  styleUrls: ['./list-evolutions.component.css']
})
export class ListEvolutionsComponent implements OnInit {
  evolutions: Evolution[] = [];
  filteredEvolutions: Evolution[] = [];
  searchId: string = '';
  searchArticle: string = '';
  searchProgramme: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;
  showDetails: boolean = false;
  modalMessage: { type: 'success' | 'error'; text: string } | null = null;
  selectedEvolution: Evolution | null = null;

  constructor(
    private evolutionService: EvolutionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Vous devez être connecté pour voir les évolutions.';
      this.authService.logout();
      return;
    }
    this.loadEvolutions();
  }

  loadEvolutions(): void {
    this.isLoading = true;
    this.evolutionService.getActiveEvolutions().subscribe({
      next: (data: Evolution[]) => {
        console.log('Received evolutions:', data);
        this.evolutions = data;
        this.filteredEvolutions = data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
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
  }

  closeEvolution(): void {
    if (!this.authService.hasRole('ENGINEER')) {
      this.showModalMessage('error', 'Seuls les ingénieurs peuvent clôturer une évolution.');
      return;
    }
    if (this.selectedEvolution) {
      this.isLoading = true;
      this.evolutionService.closeEvolution(this.selectedEvolution.id).subscribe({
        next: () => {
          this.showModalMessage('success', 'Évolution clôturée avec succès !');
          this.isLoading = false;
          this.loadEvolutions();
          this.closeDetails();
        },
        error: (err: Error) => {
          this.showModalMessage('error', err.message || 'Échec de la clôture de l\'évolution.');
          this.isLoading = false;
        }
      });
    }
  }

  resolveEvolution(): void {
    if (!this.authService.hasRole('QUALITY')) {
      this.showModalMessage('error', 'Seuls les utilisateurs QUALITY peuvent résoudre une évolution.');
      return;
    }
    if (this.selectedEvolution) {
      this.isLoading = true;
      this.evolutionService.resolveEvolution(this.selectedEvolution.id).subscribe({
        next: () => {
          this.showModalMessage('success', 'Évolution résolue avec succès !');
          this.isLoading = false;
          this.loadEvolutions();
          this.closeDetails();
        },
        error: (err: Error) => {
          this.showModalMessage('error', err.message || 'Échec de la résolution de l\'évolution.');
          this.isLoading = false;
        }
      });
    }
  }

  showModalMessage(type: 'success' | 'error', text: string): void {
    this.modalMessage = { type, text };
    setTimeout(() => this.modalMessage = null, 3000);
  }

  closeDetails(): void {
    this.showDetails = false;
    this.selectedEvolution = null;
  }

  getBlockedValue(evolution: Evolution): string {
    if (evolution.futureIncrement) {
      return `SN bloqué: ${evolution.futureIncrement}`;
    } else if (evolution.orderNumber) {
      return `OF bloqué: ${evolution.orderNumber}`;
    }
    return 'N/A';
  }
}