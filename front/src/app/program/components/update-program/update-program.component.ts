import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProgramService } from '../../service/program.service';
import { ActivatedRoute, Router } from '@angular/router';

type SnFormat = 'prefix-indice-increment' | 'increment-indice-prefix' | 'zasypn-increment-indice' | 'indice-increment-zasypn' | 'indice-zasypn-increment' | 'increment-zasypn-indice';

@Component({
  selector: 'app-update-program',
  templateUrl: './update-program.component.html',
  styleUrls: ['./update-program.component.css']
})
export class UpdateProgramComponent implements OnInit {
  programmes: any[] = [];
  filteredProgrammes: any[] = [];
  searchQuery: string = '';
  selectedProgramme: any = null;
  programmeForm: FormGroup;
  selectedImage: File | undefined = undefined;
  extractionRulePreview: string = '';
  dynamicSerialNumber: string = 'ZASYP/N123ABC';
  snFormatLabel: string = 'ZASYP/N + INCREMENT + INDICE';
  showModal: boolean = false;
  modalMessage: { type: 'success' | 'error', text: string } | null = null;
  isDropdownOpen: boolean = false;
  updateHistory: any[] = [];
  isHistoryExpanded: boolean = false;
  private readonly baseUrl: string = 'http://localhost:8081';
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private programService: ProgramService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.programmeForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9\s\-]+$/)
      ]],
      image: [null],
      snFormat: ['zasypn-increment-indice' as SnFormat, Validators.required],
      zasypn: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]],
      indice: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]]
    });

    this.programmeForm.valueChanges.subscribe(() => this.updateExtractionRule());
    this.programmeForm.get('snFormat')?.valueChanges.subscribe((format: SnFormat) => this.updateSnFormat(format));
    this.programmeForm.get('zasypn')?.valueChanges.subscribe(() => this.updateDynamicSerialNumber());
    this.programmeForm.get('indice')?.valueChanges.subscribe(() => this.updateDynamicSerialNumber());
  }

  ngOnInit(): void {
    this.fetchProgrammes();
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { programme: any };
    if (state?.programme) {
      this.selectProgramme(state.programme);
    }
  }

  fetchProgrammes(): void {
    this.programService.getAllProgrammes().subscribe({
      next: (response) => {
        this.programmes = response.map(programme => ({
          ...programme,
          imageUrl: programme.imagePath ? `${this.baseUrl}${programme.imagePath}` : undefined
        }));
        this.filteredProgrammes = [...this.programmes];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.showModalMessage('error', error.message || 'Échec du chargement des programmes.');
      }
    });
  }

  searchProgrammes(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredProgrammes = this.programmes.filter(programme =>
      programme.name.toLowerCase().includes(query)
    );
    this.isDropdownOpen = true;
  }

  selectProgramme(programme: any): void {
    this.selectedProgramme = {
      ...programme,
      imageUrl: programme.imagePath ? `${this.baseUrl}${programme.imagePath}` : undefined
    };
    this.isDropdownOpen = false;
    this.searchQuery = programme.name || '';
    let snFormat: SnFormat = 'zasypn-increment-indice';
    let zasypn = '';
    let indice = '';

    if (programme.extractionRule) {
      try {
        const rule = JSON.parse(programme.extractionRule) as { snFormat: SnFormat, zasypn: string, indice: string };
        snFormat = rule.snFormat || 'zasypn-increment-indice';
        zasypn = rule.zasypn || '';
        indice = rule.indice || '';
      } catch (error) {
        console.error('Invalid extraction rule format:', error);
      }
    }

    this.programmeForm.patchValue({ 
      name: programme.name || '', 
      snFormat, 
      zasypn, 
      indice,
      image: null
    });
    this.clearFileInput();
    this.updateDynamicSerialNumber();
    this.updateSnFormat(snFormat);
    this.updateExtractionRule();

    this.updateHistory = [];
    if (programme.updateHistory) {
      try {
        this.updateHistory = (JSON.parse(programme.updateHistory) || []).map((entry: any) => ({
          ...entry,
          changes: entry.changes ? {
            ...entry.changes,
            extractionRule: entry.changes.extractionRule ? {
              oldValue: JSON.parse(entry.changes.extractionRule.oldValue),
              newValue: JSON.parse(entry.changes.extractionRule.newValue),
              changedFields: this.getChangedFields(
                JSON.parse(entry.changes.extractionRule.oldValue),
                JSON.parse(entry.changes.extractionRule.newValue)
              )
            } : undefined
          } : undefined
        }));
      } catch (error) {
        console.error('Invalid update history format:', error);
        this.updateHistory = [];
      }
    }
  }

  private getChangedFields(oldValue: any, newValue: any): string[] {
    const changedFields: string[] = [];
    if (oldValue.zasypn !== newValue.zasypn) {
      changedFields.push('zasypn');
    }
    if (oldValue.indice !== newValue.indice) {
      changedFields.push('indice');
    }
    if (oldValue.snFormat !== newValue.snFormat) {
      changedFields.push('snFormat');
    }
    return changedFields;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen && !this.searchQuery) {
      this.filteredProgrammes = [...this.programmes];
    }
  }

  toggleHistory(): void {
    this.isHistoryExpanded = !this.isHistoryExpanded;
  }

  resetForm(): void {
    this.selectedProgramme = null;
    this.programmeForm.reset({ 
      snFormat: 'zasypn-increment-indice' as SnFormat, 
      zasypn: '', 
      indice: '',
      image: null
    });
    this.clearFileInput();
    this.extractionRulePreview = '';
    this.searchQuery = '';
    this.filteredProgrammes = [...this.programmes];
    this.isDropdownOpen = false;
    this.updateHistory = [];
    this.isHistoryExpanded = false;
    this.updateDynamicSerialNumber();
    this.updateSnFormat('zasypn-increment-indice');
    this.closeModal();
  }

  onFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 16 * 1024 * 1024) {
        this.showModalMessage('error', 'L\'image ne doit pas dépasser 16 Mo.');
        this.clearFileInput();
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.showModalMessage('error', 'Seuls les formats JPEG et PNG sont acceptés.');
        this.clearFileInput();
        return;
      }
      this.selectedImage = file;
      this.programmeForm.patchValue({ image: file });
      console.log('New image selected:', file.name);
    } else {
      this.clearFileInput();
      console.log('No valid file selected');
    }
  }

  private clearFileInput(): void {
    this.selectedImage = undefined;
    this.programmeForm.patchValue({ image: null });
    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }
  }

  saveProgramme(): void {
    if (this.programmeForm.valid && this.selectedProgramme) {
      const name = this.programmeForm.get('name')?.value;
      const extractionRule = this.buildExtractionRule(true);
      const existingImagePath = this.selectedImage ? undefined : this.selectedProgramme.imagePath;
      console.log('Saving programme with selectedImage:', this.selectedImage?.name || 'none', 'existingImagePath:', existingImagePath);
      this.programService.updateProgramme(this.selectedProgramme.id, name, this.selectedImage, extractionRule, existingImagePath).subscribe({
        next: (response) => {
          this.showModalMessage('success', 'Programme mis à jour avec succès !');
          this.clearFileInput();
          setTimeout(() => {
            this.fetchProgrammes();
            this.selectProgramme(response);
            this.closeModal();
          }, 2000);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du programme:', error);
          this.showModalMessage('error', error.message || 'Échec de la mise à jour du programme.');
        }
      });
    } else {
      this.showModalMessage('error', 'Veuillez remplir correctement tous les champs requis.');
    }
  }

  buildExtractionRule(forStorage: boolean = false): string {
    const snFormat = this.programmeForm.get('snFormat')?.value as SnFormat;
    const zasypn = this.programmeForm.get('zasypn')?.value || '';
    const indice = this.programmeForm.get('indice')?.value || '';

    if (!zasypn || !indice) return '';

    if (forStorage) {
      return JSON.stringify({ snFormat, zasypn, indice });
    } else {
      return this.formatExtractionRule({ snFormat, zasypn, indice });
    }
  }

  formatExtractionRule(rule: { snFormat: SnFormat, zasypn: string, indice: string }): string {
    const formatDisplay: { [key in SnFormat]: string } = {
      'prefix-indice-increment': 'ZASYP/N+INDICE+INCREMENT',
      'increment-indice-prefix': 'INCREMENT+INDICE+ZASYP/N',
      'zasypn-increment-indice': 'ZASYP/N+INCREMENT+INDICE',
      'indice-increment-zasypn': 'INDICE+INCREMENT+ZASYP/N',
      'indice-zasypn-increment': 'INDICE+ZASYP/N+INCREMENT',
      'increment-zasypn-indice': 'INCREMENT+ZASYP/N+INDICE'
    };
    return `Extrait l'INCREMENT du numéro de série au format ${formatDisplay[rule.snFormat]} avec ZASYP/N="${rule.zasypn}" et INDICE="${rule.indice}".`;
  }

  updateExtractionRule(): void {
    this.extractionRulePreview = this.buildExtractionRule(false);
  }

  updateSnFormat(format: SnFormat): void {
    const formatLabels: { [key in SnFormat]: string } = {
      'prefix-indice-increment': 'ZASYP/N + INDICE + INCREMENT',
      'increment-indice-prefix': 'INCREMENT + INDICE + ZASYP/N',
      'zasypn-increment-indice': 'ZASYP/N + INCREMENT + INDICE',
      'indice-increment-zasypn': 'INDICE + INCREMENT + ZASYP/N',
      'indice-zasypn-increment': 'INDICE + ZASYP/N + INCREMENT',
      'increment-zasypn-indice': 'INCREMENT + ZASYP/N + INDICE'
    };
    this.snFormatLabel = formatLabels[format];
    this.updateDynamicSerialNumber();
  }

  updateDynamicSerialNumber(): void {
    const zasypn = this.programmeForm.get('zasypn')?.value || 'ZASYP/N';
    const indice = this.programmeForm.get('indice')?.value || 'ABC';
    const increment = '123';
    const format = this.programmeForm.get('snFormat')?.value as SnFormat;

    const formats: { [key in SnFormat]: string } = {
      'prefix-indice-increment': `${zasypn}${indice}${increment}`,
      'increment-indice-prefix': `${increment}${indice}${zasypn}`,
      'zasypn-increment-indice': `${zasypn}${increment}${indice}`,
      'indice-increment-zasypn': `${indice}${increment}${zasypn}`,
      'indice-zasypn-increment': `${indice}${zasypn}${increment}`,
      'increment-zasypn-indice': `${increment}${zasypn}${indice}`
    };
    this.dynamicSerialNumber = formats[format] || `${zasypn}${increment}${indice}`;
  }

  extractSN(sn: string, rule: string): string {
    if (!sn || !rule) return '';
    try {
      const { snFormat, zasypn, indice } = JSON.parse(rule) as { snFormat: SnFormat, zasypn: string, indice: string };
      if (snFormat === 'prefix-indice-increment') {
        if (!sn.startsWith(zasypn)) return '';
        const afterPrefix = sn.substring(zasypn.length);
        if (!afterPrefix.startsWith(indice)) return '';
        return afterPrefix.substring(indice.length);
      } else if (snFormat === 'increment-indice-prefix') {
        if (!sn.endsWith(zasypn)) return '';
        const beforePrefix = sn.substring(0, sn.length - zasypn.length);
        if (!beforePrefix.endsWith(indice)) return '';
        return beforePrefix.substring(0, beforePrefix.length - indice.length);
      } else if (snFormat === 'zasypn-increment-indice') {
        if (!sn.startsWith(zasypn)) return '';
        const afterPrefix = sn.substring(zasypn.length);
        if (!afterPrefix.endsWith(indice)) return '';
        return afterPrefix.substring(0, afterPrefix.length - indice.length);
      } else if (snFormat === 'indice-increment-zasypn') {
        if (!sn.startsWith(indice)) return '';
        const afterIndice = sn.substring(indice.length);
        if (!afterIndice.endsWith(zasypn)) return '';
        return afterIndice.substring(0, afterIndice.length - zasypn.length);
      } else if (snFormat === 'indice-zasypn-increment') {
        if (!sn.startsWith(indice)) return '';
        const afterIndice = sn.substring(indice.length);
        if (!afterIndice.startsWith(zasypn)) return '';
        return afterIndice.substring(zasypn.length);
      } else if (snFormat === 'increment-zasypn-indice') {
        if (!sn.endsWith(indice)) return '';
        const beforeIndice = sn.substring(0, sn.length - indice.length);
        if (!beforeIndice.startsWith(zasypn)) return '';
        return beforeIndice.substring(zasypn.length);
      }
      return '';
    } catch (error) {
      console.error('Error extracting SN:', error);
      return '';
    }
  }

  getExtractionExample(): string {
    const rule = this.buildExtractionRule(true);
    return this.extractSN(this.dynamicSerialNumber, rule) || 'Non défini';
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