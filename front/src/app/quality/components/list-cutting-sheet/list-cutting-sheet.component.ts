import { Component, OnInit } from '@angular/core';
import { QualityService, ArchivedCuttingSheet } from '../../service/quality.service';
import { CuttingSheetTemplateService } from 'src/app/cutting-sheet/services/template-services/cutting-sheet-template.service';
import { CuttingSheetEndpointsService } from 'src/app/cutting-sheet/services/endpoints-services/cutting-sheet-endpoints.service';
import { ProgramService, Program } from 'src/app/program/service/program.service';
import * as JsBarcode from 'jsbarcode';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface CuttingSheet {
  id: number;
  article: string;
  operationsJson: string;
  customOperations: any[];
  customOperationIds: number[];
  hasSerialNumber: boolean;
  revisionHistory: string;
  indice: string;
  programId: number;
}

interface CustomOperation {
  id: number;
  tabledata: string;
}

@Component({
  selector: 'app-list-cutting-sheet',
  templateUrl: './list-cutting-sheet.component.html',
  styleUrls: ['./list-cutting-sheet.component.css']
})
export class ListCuttingSheetComponent implements OnInit {
  archivedSheets: ArchivedCuttingSheet[] = [];
  filteredSheets: ArchivedCuttingSheet[] = [];
  isLoading: boolean = false;
  messageModal: string | null = null;
  messageTitle: string = '';
  filterForm: FormGroup;
  reprintForm: FormGroup;
  showReprintModal: boolean = false;
  showReprintHistoryModal: boolean = false;
  selectedArchiveId: number | null = null;
  selectedSheet: ArchivedCuttingSheet | null = null;
  programs: string[] = [];

  constructor(
    private qualityService: QualityService,
    private templateService: CuttingSheetTemplateService,
    private cuttingSheetService: CuttingSheetEndpointsService,
    private programService: ProgramService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      article: [''],
      ofValue: [''],
      program: ['']
    });

    this.reprintForm = this.fb.group({
      reprintReason: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadArchivedSheets();
    this.loadPrograms();
    this.setupRealTimeSearch();
  }

  loadArchivedSheets() {
    this.isLoading = true;
    this.qualityService.getAllArchivedCuttingSheets({}).subscribe({
      next: (sheets) => {
        this.archivedSheets = sheets;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors du chargement des fiches archivées: ${error.message}`);
        this.isLoading = false;
      }
    });
  }

  loadPrograms() {
    this.programService.getAllProgrammes().subscribe(
      (programs: Program[]) => {
        this.programs = programs.map(p => p.name);
      },
      (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors du chargement des programmes: ${error.message}`);
      }
    );
  }

  setupRealTimeSearch() {
    this.filterForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    this.qualityService.getAllArchivedCuttingSheets({
      article: filters.article,
      ofValue: filters.ofValue,
      program: filters.program
    }).subscribe({
      next: (sheets) => {
        this.filteredSheets = sheets;
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de l'application des filtres: ${error.message}`);
      }
    });
  }

  openReprintModal(archiveId: number) {
    this.selectedArchiveId = archiveId;
    this.showReprintModal = true;
    this.reprintForm.reset();
  }

  closeReprintModal() {
    this.showReprintModal = false;
    this.selectedArchiveId = null;
  }

  openReprintHistoryModal(sheet: ArchivedCuttingSheet) {
    this.selectedSheet = sheet;
    this.showReprintHistoryModal = true;
  }

  closeReprintHistoryModal() {
    this.showReprintHistoryModal = false;
    this.selectedSheet = null;
  }

  submitReprint() {
    if (this.reprintForm.invalid || !this.selectedArchiveId) return;

    const reprintReason = this.reprintForm.get('reprintReason')?.value;
    this.qualityService.reprintCuttingSheet(this.selectedArchiveId, reprintReason).subscribe({
      next: () => {
        this.printCuttingSheet(this.selectedArchiveId!);
        this.closeReprintModal();
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de la réimpression: ${error.message}`);
      }
    });
  }

  printCuttingSheet(archiveId: number) {
    const sheet = this.archivedSheets.find(s => s.id === archiveId);
    if (!sheet) {
      this.showMessageModal('Erreur', 'Fiche archivée non trouvée');
      return;
    }

    this.cuttingSheetService.getCuttingSheetByArticle(sheet.article).subscribe({
      next: (cuttingSheets: any[]) => {
        if (cuttingSheets.length === 0) {
          this.showMessageModal('Erreur', 'Aucune fiche de coupe trouvée pour cet article');
          return;
        }
        const cuttingSheet: CuttingSheet = cuttingSheets[0] as CuttingSheet;
        const operations = cuttingSheet.operationsJson ? JSON.parse(cuttingSheet.operationsJson) : [];
        let customOperations = cuttingSheet.customOperations || [];
        if (!Array.isArray(customOperations)) customOperations = [];

        if (customOperations.length === 0 && cuttingSheet.customOperationIds?.length > 0) {
          const customOperationRequests = cuttingSheet.customOperationIds.map((id: number) =>
            this.cuttingSheetService.getCustomOperationById(id)
          );
          Promise.all(customOperationRequests.map((req: { toPromise: () => any }) => req.toPromise())).then((ops: CustomOperation[]) => {
            customOperations = ops.map((op: CustomOperation) => ({
              ...op,
              tabledata: op.tabledata ? JSON.parse(op.tabledata) : []
            }));
            this.processTemplateData(cuttingSheet, operations, customOperations, sheet);
          }).catch(error => {
            this.processTemplateData(cuttingSheet, operations, customOperations, sheet);
          });
        } else {
          customOperations = customOperations.map((op: any) => ({
            ...op,
            tabledata: op.tabledata ? JSON.parse(op.tabledata) : []
          }));
          this.processTemplateData(cuttingSheet, operations, customOperations, sheet);
        }
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de la récupération de la fiche de coupe: ${error.message}`);
      }
    });
  }

  private processTemplateData(cuttingSheet: CuttingSheet, operations: any[], customOperations: any[], sheet: ArchivedCuttingSheet) {
    const templateData: {
      article: string;
      programme: { name: string };
      operations: any[];
      hasSN: string;
      snDe: string;
      snA: string;
      barcodeDe: string | null;
      barcodeA: string | null;
      revisionHistory: string;
      extractedSn: string;
      customOperations: any[];
      indice: string;
      of: string;
      quantite: string;
    } = {
      article: sheet.article,
      programme: { name: '' },
      operations,
      hasSN: cuttingSheet.hasSerialNumber ? 'yes' : 'no',
      snDe: sheet.serialNumber || '',
      snA: '',
      barcodeDe: sheet.serialNumber ? this.generateBarcode(sheet.serialNumber) : null,
      barcodeA: null,
      revisionHistory: cuttingSheet.revisionHistory || '{}',
      extractedSn: '',
      customOperations,
      indice: cuttingSheet.indice || 'A',
      of: sheet.ordo.orderNumber,
      quantite: String(sheet.ordo.quantity)
    };

    this.programService.getProgrammeById(cuttingSheet.programId || 1).subscribe({
      next: (program: Program) => {
        templateData.programme.name = program.name;
        if (cuttingSheet.hasSerialNumber && sheet.serialNumber && program.extractionRule) {
          templateData.extractedSn = this.extractSN(sheet.serialNumber, program.extractionRule);
        }
        this.generateAndPrintCuttingSheet(sheet, templateData);
      },
      error: (error: Error) => {
        this.showMessageModal('Erreur', `Erreur lors de la récupération du programme: ${error.message}`);
      }
    });
  }

  private generateAndPrintCuttingSheet(sheet: ArchivedCuttingSheet, templateData: any) {
    const htmlContent = this.templateService.generateTemplate(templateData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      this.loadArchivedSheets();
    } else {
      this.showMessageModal('Erreur', 'Impossible d\'ouvrir la fenêtre d\'impression');
    }
  }

  private extractSN(sn: string, rule: string): string {
    if (!sn || !rule) return '';
    try {
      const { snFormat, zasypn, indice } = JSON.parse(rule);
      switch (snFormat) {
        case 'prefix-indice-increment':
          if (sn.startsWith(zasypn)) {
            const afterPrefix = sn.substring(zasypn.length);
            if (afterPrefix.startsWith(indice)) {
              return afterPrefix.substring(indice.length);
            }
          }
          break;
        case 'increment-indice-prefix':
          if (sn.endsWith(zasypn)) {
            const beforePrefix = sn.substring(0, sn.length - zasypn.length);
            if (beforePrefix.endsWith(indice)) {
              return beforePrefix.substring(0, beforePrefix.length - indice.length);
            }
          }
          break;
        case 'zasypn-increment-indice':
          if (sn.startsWith(zasypn) && sn.endsWith(indice)) {
            return sn.substring(zasypn.length, sn.length - indice.length);
          }
          break;
        case 'indice-increment-zasypn':
          if (sn.startsWith(indice) && sn.endsWith(zasypn)) {
            return sn.substring(indice.length, sn.length - zasypn.length);
          }
          break;
        case 'indice-zasypn-increment':
          if (sn.startsWith(indice) && sn.substring(indice.length).startsWith(zasypn)) {
            return sn.substring(indice.length + zasypn.length);
          }
          break;
        case 'increment-zasypn-indice':
          if (sn.endsWith(zasypn + indice)) {
            return sn.substring(0, sn.length - (zasypn + indice).length);
          }
          break;
        default:
          return '';
      }
      return '';
    } catch (error) {
      console.error('Error extracting SN:', error);
      return '';
    }
  }

  private generateBarcode(value: string): string | null {
    if (!value) return null;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, { format: 'CODE128', displayValue: false, height: 30, width: 1 });
    svg.setAttribute('height', '60');
    svg.setAttribute('width', '130');
    return svg.outerHTML;
  }

  showMessageModal(title: string, message: string) {
    this.messageTitle = title;
    this.messageModal = message;
  }

  closeMessageModal() {
    this.messageModal = null;
    this.messageTitle = '';
  }
}