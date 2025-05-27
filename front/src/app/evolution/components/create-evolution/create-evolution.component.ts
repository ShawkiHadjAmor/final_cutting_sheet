import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EvolutionService, Program } from '../../service/evolution.service';
import { AuthService } from '../../../authentification/service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-evolution',
  templateUrl: './create-evolution.component.html',
  styleUrls: ['./create-evolution.component.css']
})
export class CreateEvolutionComponent implements OnInit {
  evolutionForm: FormGroup;
  programs: Program[] = [];
  articles: string[] = [];
  zasypn: string = '';
  showModal: boolean = false;
  modalMessage: { type: 'success' | 'error'; text: string } | null = null;
  isLoading: boolean = false;
evolutionFormiligence: any;

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
      this.showModalMessage('error', 'Vous devez être connecté avec le rôle QUALITY pour accéder à cette page.');
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }
    this.loadPrograms();
  }

  loadPrograms(): void {
    this.evolutionService.getPrograms().subscribe({
      next: (programs: Program[]) => {
        this.programs = programs;
      },
      error: (err) => {
        this.showModalMessage('error', 'Échec du chargement des programmes.');
      }
    });
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
    if (this.evolutionForm.invalid) {
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

    this.evolutionService.createEvolution(payload).subscribe({
      next: () => {
        this.showModalMessage('success', 'Évolution créée avec succès !');
        this.isLoading = false;
        setTimeout(() => {
          this.resetForm();
        }, 2000);
      },
      error: (err: any) => {
        let errorMessage = 'Échec de la création de l\'évolution.';
        if (err.status === 401) {
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter pour continuer.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.showModalMessage('error', errorMessage);
        this.isLoading = false;
      }
    });
  }
  resetForm(): void {
    this.evolutionForm.reset();
    this.zasypn = '';
    this.articles = [];
    this.closeModal();
  }

  showModalMessage(type: 'success' | 'error', text: string): void {
    this.modalMessage = { type, text };
    this.showModal = true;
    setTimeout(() => this.closeModal(), 3000);
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = null;
  }
}