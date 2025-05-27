import { Component, OnInit } from '@angular/core';
import { ArticleIncrementService, ArticleIncrement } from '../../service/article-increment.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Program, ProgramService } from 'src/app/program/service/program.service';

@Component({
  selector: 'app-list-article-increment',
  templateUrl: './list-article-increment.component.html',
  styleUrls: ['./list-article-increment.component.css']
})
export class ListArticleIncrementComponent implements OnInit {
  articleIncrements: ArticleIncrement[] = [];
  programs: Program[] = [];
  searchForm: FormGroup;
  updateForm: FormGroup;
  showModal: boolean = false;
  showUpdateModal: boolean = false;
  modalMessage: { type: 'success' | 'error', text: string } | null = null;
  selectedIncrement: ArticleIncrement | null = null;

  constructor(
    private articleIncrementService: ArticleIncrementService,
    private programService: ProgramService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      programId: [null],
      article: ['']
    });
    this.updateForm = this.fb.group({
      programId: [null, Validators.required],
      article: ['', [Validators.required, Validators.minLength(1)]],
      lastIncrement: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.fetchPrograms();
    this.searchArticleIncrements();
  }

  fetchPrograms(): void {
    this.programService.getAllProgrammes().subscribe({
      next: (programs) => {
        this.programs = programs;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.showModalMessage('error', error.message || 'Échec du chargement des programmes.');
      }
    });
  }

  searchArticleIncrements(): void {
    const { programId, article } = this.searchForm.value;
    this.articleIncrementService.searchArticleIncrements(programId, article).subscribe({
      next: (increments) => {
        this.articleIncrements = increments;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche des article increments:', error);
        this.showModalMessage('error', error.message || 'Échec de la recherche des article increments.');
      }
    });
  }

  openUpdateModal(increment: ArticleIncrement): void {
    this.selectedIncrement = increment;
    this.updateForm.patchValue({
      programId: increment.programId,
      article: increment.article,
      lastIncrement: increment.lastIncrement
    });
    this.showUpdateModal = true;
  }

  submitUpdate(): void {
    if (this.updateForm.invalid || !this.selectedIncrement?.id) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const updatedIncrement: ArticleIncrement = {
      id: this.selectedIncrement.id,
      programId: this.updateForm.value.programId,
      article: this.updateForm.value.article.trim(),
      lastIncrement: this.updateForm.value.lastIncrement
    };

    this.articleIncrementService.updateArticleIncrement(this.selectedIncrement.id, updatedIncrement).subscribe({
      next: () => {
        this.showModalMessage('success', 'Article increment mis à jour avec succès !');
        this.closeUpdateModal();
        this.searchArticleIncrements();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'article increment:', error);
        this.showModalMessage('error', error.message || 'Échec de la mise à jour de l\'article increment.');
      }
    });
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedIncrement = null;
    this.updateForm.reset();
  }

  deleteArticleIncrement(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article increment ?')) {
      this.articleIncrementService.deleteArticleIncrement(id).subscribe({
        next: () => {
          this.showModalMessage('success', 'Article increment supprimé avec succès !');
          this.searchArticleIncrements();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de l\'article increment:', error);
          this.showModalMessage('error', error.message || 'Échec de la suppression de l\'article increment.');
        }
      });
    }
  }

  getProgramName(programId: number): string {
    const program = this.programs.find(p => p.id === programId);
    return program ? program.name : 'Inconnu';
  }

  showModalMessage(type: 'success' | 'error', text: string): void {
    this.modalMessage = { type, text };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = null;
  }
}