import { Component, OnInit } from '@angular/core';
import { CmlService, Cml } from '../../service/cml.service';
import * as JsBarcode from 'jsbarcode';
import { CuttingSheetTemplateService } from 'src/app/cutting-sheet/services/template-services/cutting-sheet-template.service';
import { CuttingSheetEndpointsService } from 'src/app/cutting-sheet/services/endpoints-services/cutting-sheet-endpoints.service';

interface OF {
  id: number;
  orderNumber: string;
  quantity: number;
  article: string;
  date: string;
  programme: string;
  priority: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-view-list-of',
  templateUrl: './view-list-of.component.html',
  styleUrls: ['./view-list-of.component.css']
})
export class ViewListOfComponent implements OnInit {
  groupedArticles: { date: string; headers: string[]; articles: Cml[] }[] = [];
  isLoading: boolean = false;
  isPrinting: { [key: number]: boolean } = {};
  isPrinted: { [key: number]: boolean } = {};
  messageModal: string | null = null;
  messageTitle: string = '';

  constructor(
    private cmlService: CmlService,
    private templateService: CuttingSheetTemplateService,
    private cuttingSheetService: CuttingSheetEndpointsService
  ) {}

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.isLoading = true;
    this.isPrinted = {};
    this.cmlService.getAllCmlsWithOrdos().subscribe({
      next: (cmls: Cml[]) => {
        console.log('CMLs with ordos received:', cmls);
        const validCmls = cmls.filter(cml => {
          if (!cml.article || cml.article.trim() === '') {
            console.warn(`Skipping CML ID ${cml.id} due to null or empty article:`, cml);
            return false;
          }
          return true;
        });
        console.log(`Filtered ${cmls.length - validCmls.length} invalid CMLs. Valid CMLs:`, validCmls);

        const groupedByDate = validCmls.reduce((acc: { [key: string]: { headers: string[]; articles: Cml[] } }, cml: Cml) => {
          const ordo = cml.ordo;
          if (!ordo || !ordo.createdAt) {
            console.warn('CML missing ordo or createdAt:', cml);
            return acc;
          }
          const date = new Date(ordo.createdAt).toISOString().split('T')[0];
          const headers = ['orderNumber', 'quantity', 'article', 'date', 'programme'];

          if (!acc[date]) {
            acc[date] = { headers, articles: [] };
          }
          acc[date].articles.push(cml);
          return acc;
        }, {});

        this.groupedArticles = Object.keys(groupedByDate)
          .sort((a, b) => b.localeCompare(a))
          .map(date => ({
            date,
            headers: groupedByDate[date].headers,
            articles: groupedByDate[date].articles.sort((a, b) => {
              const priorityA = a.ordo.priority ? 1 : 0;
              const priorityB = b.ordo.priority ? 1 : 0;
              if (priorityA !== priorityB) {
                return priorityB - priorityA;
              }
              return new Date(b.ordo.createdAt).getTime() - new Date(a.ordo.createdAt).getTime();
            })
          }));

        console.log('Grouped CML articles:', this.groupedArticles);
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error fetching CML articles:', error);
        this.showMessageModal('Erreur lors du chargement', 'Erreur lors du chargement des articles CML: ' + error.message);
        this.groupedArticles = [];
        this.isLoading = false;
      }
    });
  }

  getTableCells(article: Cml): string[] {
    const ordo = article.ordo;
    return [
      ordo.orderNumber,
      ordo.quantity.toString(),
      ordo.article,
      ordo.date,
      ordo.programme
    ];
  }

  printCuttingSheet(article: Cml) {
    this.isPrinting[article.id] = true;
    this.isPrinted[article.id] = true;

    if (!article.article || article.article.trim() === '') {
      this.isPrinting[article.id] = false;
      this.isPrinted[article.id] = false;
      this.showMessageModal('Erreur d\'impression', 'Erreur: L\'article est manquant ou invalide pour ce CML.');
      console.error(`Invalid article for CML ID ${article.id}:`, article);
      return;
    }

    const ofId = String(article.ordo.id);
    const ofDisplayValue = article.ordo.orderNumber;
    const quantiteValue = String(article.ordo.quantity);
    const programmeValue = article.ordo.programme;

    console.log(`Final extracted for article ${article.article}: OF=${ofDisplayValue}, OF_ID=${ofId}, QUANTITE=${quantiteValue}, PROGRAMME=${programmeValue}`);

    if (!ofId || isNaN(Number(ofId))) {
      this.isPrinting[article.id] = false;
      this.isPrinted[article.id] = false;
      this.showMessageModal('Erreur d\'impression', 'Erreur: L\'ID de l\'OF est requis et doit être un numéro valide.');
      return;
    }

    this.cmlService.getCuttingSheetByArticle(article.article).subscribe({
      next: (cuttingSheet) => {
        console.log('Raw cutting sheet response:', cuttingSheet);
        const operations = cuttingSheet.operationsJson ? JSON.parse(cuttingSheet.operationsJson) : [];
        let customOperations = cuttingSheet.customOperations || [];

        if (!Array.isArray(customOperations)) {
          console.warn('customOperations is not an array, setting to empty array:', customOperations);
          customOperations = [];
        }

        if (customOperations.length === 0 && cuttingSheet.customOperationIds && cuttingSheet.customOperationIds.length > 0) {
          console.log('Fetching custom operations by IDs:', cuttingSheet.customOperationIds);
          const customOperationRequests = cuttingSheet.customOperationIds.map((id: number) =>
            this.cuttingSheetService.getCustomOperationById(id)
          );
          Promise.all(customOperationRequests.map((req: { toPromise: () => any; }) => req.toPromise())).then((ops: any[]) => {
            customOperations = ops.map((op: any) => {
              let parsedTableData = [];
              try {
                parsedTableData = op.tabledata ? JSON.parse(op.tabledata) : [];
              } catch (e) {
                console.error(`Error parsing tabledata for custom operation ID ${op.id}:`, e);
              }
              return {
                ...op,
                tabledata: parsedTableData
              };
            });
            this.processTemplateData(cuttingSheet, operations, customOperations, article, ofDisplayValue, quantiteValue, programmeValue, ofId);
          }).catch(error => {
            console.error('Error fetching custom operations:', error);
            this.processTemplateData(cuttingSheet, operations, customOperations, article, ofDisplayValue, quantiteValue, programmeValue, ofId);
          });
        } else {
          customOperations = customOperations.map((op: any) => {
            let parsedTableData = [];
            try {
              parsedTableData = op.tabledata ? JSON.parse(op.tabledata) : [];
            } catch (e) {
              console.error(`Error parsing tabledata for custom operation ID ${op.id}:`, e);
            }
            return {
              ...op,
              tabledata: parsedTableData
            };
          });
          this.processTemplateData(cuttingSheet, operations, customOperations, article, ofDisplayValue, quantiteValue, programmeValue, ofId);
        }
      },
      error: (error: Error) => {
        this.isPrinting[article.id] = false;
        this.isPrinted[article.id] = false;
        console.error('Erreur lors de la récupération de la fiche de coupe:', error);
        this.showMessageModal('Erreur d\'impression', `Erreur lors de la récupération de la fiche de coupe: ${error.message}`);
      }
    });
  }

  private processTemplateData(cuttingSheet: any, operations: any[], customOperations: any[], article: Cml, ofDisplayValue: string, quantiteValue: string, programmeValue: string, ofId: string) {
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
      article: article.article!,
      programme: { name: '' },
      operations,
      hasSN: cuttingSheet.hasSerialNumber ? 'yes' : 'no',
      snDe: '',
      snA: '',
      barcodeDe: null,
      barcodeA: null,
      revisionHistory: cuttingSheet.revisionHistory || '{}',
      extractedSn: '',
      customOperations,
      indice: cuttingSheet.indice || 'A',
      of: ofDisplayValue,
      quantite: quantiteValue
    };

    const fetchProgram = programmeValue
      ? this.cmlService.getProgramByName(programmeValue)
      : this.cmlService.getProgramById(cuttingSheet.programmeId || 1);

    fetchProgram.subscribe({
      next: (program) => {
        templateData.programme.name = program.name;
        const programId = program.id;

        if (cuttingSheet.hasSerialNumber) {
          const serialNumberPayload = {
            programmeId: programId,
            article: article.article!,
            of: ofId,
            quantite: quantiteValue
          };
          console.log('Serial number payload:', serialNumberPayload);

          this.cmlService.getSerialNumber(serialNumberPayload).subscribe({
            next: (existingSerialNumber) => {
              templateData.snDe = existingSerialNumber.numeroDeSerie;
              templateData.snA = existingSerialNumber.serialNumberTo;
              templateData.extractedSn = this.extractSN(existingSerialNumber.numeroDeSerie, program.extractionRule);
              templateData.barcodeDe = this.generateBarcode(existingSerialNumber.numeroDeSerie);
              templateData.barcodeA = this.generateBarcode(existingSerialNumber.serialNumberTo);
              this.generateAndPrintCuttingSheet(article, templateData);
            },
            error: (error: Error) => {
              if (error.message === 'Serial number not found') {
                this.cmlService.createSerialNumber(serialNumberPayload).subscribe({
                  next: (serialNumber) => {
                    templateData.snDe = serialNumber.numeroDeSerie;
                    templateData.snA = serialNumber.serialNumberTo;
                    templateData.extractedSn = this.extractSN(serialNumber.numeroDeSerie, program.extractionRule);
                    templateData.barcodeDe = this.generateBarcode(serialNumber.numeroDeSerie);
                    templateData.barcodeA = this.generateBarcode(serialNumber.serialNumberTo);
                    this.generateAndPrintCuttingSheet(article, templateData);
                  },
                  error: (createError: Error) => {
                    this.isPrinting[article.id] = false;
                    this.isPrinted[article.id] = false;
                    console.error('Erreur lors de la création du numéro de série:', createError);
                    this.showMessageModal('Erreur d\'impression',
                      `Erreur lors de la création du numéro de série: ${createError.message}`);
                  }
                });
              } else {
                this.isPrinting[article.id] = false;
                this.isPrinted[article.id] = false;
                console.error('Erreur lors de la vérification du numéro de série:', error);
                this.showMessageModal('Erreur d\'impression',
                  `Erreur lors de la vérification du numéro de série: ${error.message}`);
              }
            }
          });
        } else {
          this.generateAndPrintCuttingSheet(article, templateData);
        }
      },
      error: (error: Error) => {
        this.isPrinting[article.id] = false;
        this.isPrinted[article.id] = false;
        console.error('Erreur lors de la récupération du programme:', error);
        this.showMessageModal('Erreur d\'impression', `Erreur lors de la récupération du programme: ${error.message}`);
      }
    });
  }

  private generateAndPrintCuttingSheet(article: Cml, templateData: any) {
    const htmlContent = this.templateService.generateTemplate(templateData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      this.cmlService.deleteCml(article.id).subscribe({
        next: () => {
          console.log(`CML with ID ${article.id} deleted successfully`);
          this.groupedArticles = this.groupedArticles.map(group => ({
            ...group,
            articles: group.articles.filter(a => a.id !== article.id)
          })).filter(group => group.articles.length > 0);
        },
        error: (error: Error) => {
          console.error(`Error deleting CML with ID ${article.id}:`, error);
          this.isPrinted[article.id] = false;
          this.showMessageModal('Erreur de suppression', `Erreur lors de la suppression du CML: ${error.message}`);
        }
      });
    } else {
      this.isPrinting[article.id] = false;
      this.isPrinted[article.id] = false;
      this.showMessageModal('Erreur d\'impression', 'Erreur: Impossible d\'ouvrir la fenêtre d\'impression.');
    }
    this.isPrinting[article.id] = false;
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