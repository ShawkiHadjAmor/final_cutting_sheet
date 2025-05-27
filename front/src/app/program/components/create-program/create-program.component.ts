import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProgramService } from '../../service/program.service';

// Define the possible snFormat values
type SnFormat = 'prefix-indice-increment' | 'increment-indice-prefix' | 'zasypn-increment-indice' | 'indice-increment-zasypn' | 'indice-zasypn-increment' | 'increment-zasypn-indice';

@Component({
  selector: 'app-create-program',
  templateUrl: './create-program.component.html',
  styleUrls: ['./create-program.component.css']
})
export class CreateProgramComponent implements OnInit {
  programmeForm: FormGroup;
  selectedImage: File | undefined = undefined;
  extractionRulePreview: string = '';
  dynamicSerialNumber: string = 'ZASYP/N123ABC';
  snFormatLabel: string = 'ZASYP/N + INCREMENT + INDICE';
  showModal: boolean = false;
  modalMessage: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private programService: ProgramService
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
      zasypn: ['45', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]],
      indice: ['A', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]]
    });

    this.programmeForm.valueChanges.subscribe(() => this.updateExtractionRule());
    this.programmeForm.get('snFormat')?.valueChanges.subscribe((format: SnFormat) => this.updateSnFormat(format));
    this.programmeForm.get('zasypn')?.valueChanges.subscribe(() => this.updateDynamicSerialNumber());
    this.programmeForm.get('indice')?.valueChanges.subscribe(() => this.updateDynamicSerialNumber());
  }

  ngOnInit(): void {
    this.updateDynamicSerialNumber();
    this.updateSnFormat('zasypn-increment-indice');
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showModalMessage('error', 'L\'image ne doit pas dépasser 5 Mo.');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.showModalMessage('error', 'Seuls les formats JPEG et PNG sont acceptés.');
        return;
      }
      this.selectedImage = file;
      this.programmeForm.patchValue({ image: file });
    }
  }

  resetForm(): void {
    this.programmeForm.reset({
      name: '',
      snFormat: 'zasypn-increment-indice',
      zasypn: '45',
      indice: 'A'
    });
    this.selectedImage = undefined;
    this.extractionRulePreview = '';
    this.updateDynamicSerialNumber();
    this.updateSnFormat('zasypn-increment-indice');
    this.closeModal();
  }

  saveProgramme(): void {
    if (this.programmeForm.valid) {
      const name = this.programmeForm.get('name')?.value;
      const image = this.selectedImage;
      const extractionRule = this.buildExtractionRule(true);
      console.log('Submitting programme:', { name, image: image?.name, extractionRule, formValue: this.programmeForm.value });
      this.programService.createProgramme(name, image, extractionRule).subscribe({
        next: () => {
          this.showModalMessage('success', 'Programme créé avec succès !');
          setTimeout(() => this.resetForm(), 2000);
        },
        error: (error) => {
          console.error('Erreur lors de la création du programme:', error);
          let message = error.message || 'Échec de la création du programme.';
          if (error.message.includes('Format de données non supporté')) {
            message = 'Erreur: Les données envoyées ne sont pas dans le format attendu. Vérifiez les champs.';
          }
          this.showModalMessage('error', message);
        }
      });
    } else {
      console.log('Form invalid:', this.programmeForm.errors, this.programmeForm.value);
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
      const formatDisplay: { [key in SnFormat]: string } = {
        'prefix-indice-increment': 'ZASYP/N+INDICE+INCREMENT',
        'increment-indice-prefix': 'INCREMENT+INDICE+ZASYP/N',
        'zasypn-increment-indice': 'ZASYP/N+INCREMENT+INDICE',
        'indice-increment-zasypn': 'INDICE+INCREMENT+ZASYP/N',
        'indice-zasypn-increment': 'INDICE+ZASYP/N+INCREMENT',
        'increment-zasypn-indice': 'INCREMENT+ZASYP/N+INDICE'
      };
      return `Extrait l'INCREMENT du numéro de série au format ${formatDisplay[snFormat]} avec ZASYP/N="${zasypn}" et INDICE="${indice}".`;
    }
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
    const format = this.programmeForm.get('snFormat')?.value as SnFormat;

    const formats: { [key in SnFormat]: string } = {
      'prefix-indice-increment': `${zasypn}${indice}100`,
      'increment-indice-prefix': `100${indice}${zasypn}`,
      'zasypn-increment-indice': `${zasypn}100${indice}`,
      'indice-increment-zasypn': `${indice}100${zasypn}`,
      'indice-zasypn-increment': `${indice}${zasypn}100`,
      'increment-zasypn-indice': `100${zasypn}${indice}`
    };
    this.dynamicSerialNumber = formats[format] || `${zasypn}100${indice}`;
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