import { Component, OnInit, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ArticleIncrementService } from '../../service/article-increment.service';
import { Program, ProgramService } from 'src/app/program/service/program.service';
import { CuttingSheetEndpointsService } from 'src/app/cutting-sheet/services/endpoints-services/cutting-sheet-endpoints.service';
import { Subscription } from 'rxjs';

declare var $: any; // Declare jQuery

@Component({
  selector: 'app-create-article-increment',
  templateUrl: './create-article-increment.component.html',
  styleUrls: ['./create-article-increment.component.css']
})
export class CreateArticleIncrementComponent implements OnInit, AfterViewInit, OnDestroy {
  articleIncrementForm: FormGroup;
  programs: Program[] = [];
  showModal: boolean = false;
  showConfirmModal: boolean = false;
  showLoading: boolean = false;
  modalMessage: { type: 'success' | 'error', text: string } | null = null;
  private select2Subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private articleIncrementService: ArticleIncrementService,
    private cuttingSheetService: CuttingSheetEndpointsService,
    private programService: ProgramService,
    private elementRef: ElementRef
  ) {
    this.articleIncrementForm = this.fb.group({
      programId: [null, Validators.required],
      article: ['', Validators.required],
      lastIncrement: [0, [
        Validators.required,
        Validators.min(0),
        Validators.max(999999)
      ]]
    });
  }

  ngOnInit(): void {
    this.fetchPrograms();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const programSelect = $(this.elementRef.nativeElement).find('#programId');
      this.initializeSelect2ForElement(programSelect, 'programId', 'Sélectionnez un programme');

      const articleSelect = $(this.elementRef.nativeElement).find('#article');
      this.initializeSelect2ForElement(articleSelect, 'article', 'Sélectionnez un article');

      // Add change event listener to program Select2
      programSelect.on('change', () => {
        const programId = programSelect.val();
        this.articleIncrementForm.get('programId')?.setValue(programId);
        this.onProgramChange();
      });
    }, 100);
  }

  ngOnDestroy(): void {
    this.select2Subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeSelect2ForElement(selectElement: any, formControlName: string, placeholder: string): void {
    selectElement.select2({
      placeholder: placeholder,
      allowClear: true,
      width: '100%',
      minimumResultsForSearch: 0
    });

    // Apply styles to the selection box
    const select2Container = selectElement.next('.select2-container');
    const selectionSingle = select2Container.find('.select2-selection--single');
    selectionSingle.css({
      'border': '2px solid #e2e8f0',
      'border-radius': '0.25rem',
      'background-color': '#f7fafc',
      'height': '2rem',
      'padding': '0.375rem',
      'font-size': '0.875rem'
    });

    const selectionRendered = selectionSingle.find('.select2-selection__rendered');
    selectionRendered.css({
      'line-height': '1.25rem',
      'color': '#1a202c'
    });

    const selectionArrow = selectionSingle.find('.select2-selection__arrow');
    selectionArrow.css({
      'height': '2rem',
      'right': '0.5rem'
    });

    const arrowB = selectionArrow.find('b');
    arrowB.css({
      'border-color': '#4299e1 transparent transparent transparent'
    });

    // Apply focus styles and style dropdown
    selectElement.on('select2:open', () => {
      selectionSingle.css({
        'border-color': '#4299e1',
        'box-shadow': '0 0 0 2px rgba(66, 153, 225, 0.2)'
      });

      const searchField = $('.select2-search__field');
      searchField.css({
        'border': '2px solid #4299e1',
        'border-radius': '0.25rem',
        'padding': '0.375rem',
        'font-size': '0.875rem'
      });

      const resultsOptions = $('.select2-results__option');
      resultsOptions.css({
        'font-size': '0.875rem',
        'padding': '0.375rem 0.5rem'
      });
    });

    selectElement.on('select2:close', () => {
      selectionSingle.css({
        'border-color': '#e2e8f0',
        'box-shadow': 'none'
      });
      const formControl = this.articleIncrementForm.get(formControlName);
      if (formControl) {
        formControl.markAsTouched();
        this.updateSelect2ErrorStyles(selectElement, formControlName);
      }
    });

    // Sync with form control
    selectElement.on('change', () => {
      const value = selectElement.val();
      const formControl = this.articleIncrementForm.get(formControlName);
      if (formControl) {
        formControl.setValue(value || null);
        this.updateSelect2ErrorStyles(selectElement, formControlName);
      }
    });

    // Subscribe to status changes
    const formControl = this.articleIncrementForm.get(formControlName);
    if (formControl) {
      const subscription = formControl.statusChanges.subscribe(() => {
        this.updateSelect2ErrorStyles(selectElement, formControlName);
      });
      this.select2Subscriptions.push(subscription);
    }

    // Initial update of error styles
    this.updateSelect2ErrorStyles(selectElement, formControlName);
  }

  private updateSelect2ErrorStyles(selectElement: any, formControlName: string): void {
    const formControl = this.articleIncrementForm.get(formControlName);
    const select2Container = selectElement.next('.select2-container');
    const selectionSingle = select2Container.find('.select2-selection--single');
    if (formControl && formControl.invalid && formControl.touched) {
      selectionSingle.css('border-color', '#e53e3e');
    } else {
      selectionSingle.css('border-color', '#e2e8f0');
    }
  }

  fetchPrograms(): void {
    this.programService.getAllProgrammes().subscribe({
      next: (programs) => {
        this.programs = programs;
        console.log('Programs loaded:', programs);
        const programSelect = $(this.elementRef.nativeElement).find('#programId');
        programSelect.empty();
        programSelect.append('<option value="" disabled selected>Sélectionnez un programme</option>');
        programs.forEach(program => {
          programSelect.append(`<option value="${program.id}">${program.name}</option>`);
        });
        programSelect.trigger('change');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.showModalMessage('error', error.message || 'Échec du chargement des programmes.');
      }
    });
  }

  onProgramChange(): void {
    const programId = this.articleIncrementForm.get('programId')?.value;
    console.log('onProgramChange triggered, programId:', programId);
    this.articleIncrementForm.get('article')?.reset();
    if (programId && !isNaN(Number(programId))) {
      this.fetchEligibleArticles(Number(programId));
    } else {
      console.log('Invalid programId, clearing articles');
      this.updateSelect2Options([]);
    }
  }

  fetchEligibleArticles(programId: number): void {
    console.log('Fetching eligible articles for programId:', programId);
    this.cuttingSheetService.getEligibleArticlesForProgram(programId).subscribe({
      next: (articles) => {
        console.log('Eligible articles received:', articles);
        this.updateSelect2Options(articles);
      },
      error: (error) => {
        console.error('Error fetching eligible articles:', error);
        this.updateSelect2Options([]);
        this.showModalMessage('error', 'Échec du chargement des articles éligibles.');
      }
    });
  }

  updateSelect2Options(articles: string[]): void {
    const articleSelect = $(this.elementRef.nativeElement).find('#article');
    articleSelect.empty();
    articleSelect.append('<option value="" disabled selected>Sélectionnez un article</option>');
    articles.forEach(article => {
      articleSelect.append(`<option value="${article}">${article}</option>`);
    });
    articleSelect.val('');
    articleSelect.trigger('change');
  }

  onSubmit(): void {
    console.log('Form submitted, form valid:', this.articleIncrementForm.valid);
    console.log('Form values:', this.articleIncrementForm.value);
    if (this.articleIncrementForm.valid) {
      this.showConfirmModal = true;
    } else {
      this.articleIncrementForm.markAllAsTouched();
      this.showModalMessage('error', 'Veuillez remplir tous les champs obligatoires correctement.');
    }
  }

  confirmSave(): void {
    console.log('confirmSave called, showLoading set to true');
    this.showConfirmModal = false;
    this.showLoading = true;
    const articleIncrement = this.articleIncrementForm.value;
    console.log('Creating article increment:', articleIncrement);

    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));

    this.articleIncrementService.createArticleIncrement(articleIncrement).subscribe({
      next: () => {
        minLoadingTime.then(() => {
          console.log('API success, showLoading set to false');
          this.showLoading = false;
          this.showModalMessage('success', 'Article increment créé avec succès !');
          setTimeout(() => this.resetForm(), 2000);
        });
      },
      error: (error) => {
        minLoadingTime.then(() => {
          console.error('Error creating article increment:', error);
          console.log('API error, showLoading set to false');
          this.showLoading = false;
          this.showModalMessage('error', error.message || 'Échec de la création de l\'article increment.');
        });
      }
    });
  }

  resetForm(): void {
    this.articleIncrementForm.reset({
      programId: null,
      article: '',
      lastIncrement: 0
    });
    this.updateSelect2Options([]);
    this.closeModal();
  }

  cancelSave(): void {
    console.log('cancelSave called');
    this.showConfirmModal = false;
  }

  showModalMessage(type: 'success' | 'error', text: string): void {
    console.log('Showing modal:', type, text);
    this.modalMessage = { type, text };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = null;
  }
}