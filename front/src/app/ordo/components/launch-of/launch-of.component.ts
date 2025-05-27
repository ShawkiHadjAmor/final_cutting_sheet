import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CuttingSheetEndpointsService } from 'src/app/cutting-sheet/services/endpoints-services/cutting-sheet-endpoints.service';
import * as XLSX from 'xlsx';
import { CmlService } from 'src/app/cml/service/cml.service';
import { StoreService } from 'src/app/store/service/store.service';
import { AuthService } from 'src/app/authentification/service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { OrdoService } from '../../service/ordo.service';

interface CuttingSheet {
  id: number;
  article: string;
}

interface CmlPayload {
  ordoId: number;
  article: string;
}

interface StorePayload {
  ordoId: number;
  article: string;
  hasCuttingSheet: boolean;
}

interface ExcelRow {
  orderNumber: string;
  quantity: number;
  article: string;
  date: string;
  programme: string;
  rowIndex: string;
}

interface Evolution {
  field: string;
  article?: string;
  oldValue: string;
  newValue: string;
  reason: string;
  evolutionId: string;
}

interface DuplicateResponse {
  duplicates: { orderNumber: string; article: string; rowIndex: string }[];
  blockedByEvolutions: {
    orderNumber: string;
    article: string;
    rowIndex: string;
    programme: string;
    evolutions: Evolution[];
  }[];
  allDuplicates: boolean;
  allBlockedByEvolutions: boolean;
}

interface ProgramSearchResult {
  id: number;
  name: string;
  indice: string | null;
  zasypn: string | null;
  hasEvolution: boolean;
}

interface IncrementSearchResult {
  programId: number;
  article: string;
  lastIncrement: number;
  hasEvolution: boolean;
  evolution?: { id: number; oldValue: string; newValue: string; reason: string };
}

interface CuttingSheetResult {
  article: string;
  cuttingSheets: any[];
  error?: any;
}

@Component({
  selector: 'app-launch-of',
  templateUrl: './launch-of.component.html',
  styleUrls: ['./launch-of.component.css']
})
export class LaunchOfComponent implements OnInit {
  selectedFile: File | null = null;
  tableheaders: string[] = [];
  tableData: ExcelRow[] = [];
  urgentArticles: ExcelRow[] = [];
  nonUrgentArticles: ExcelRow[] = [];
  isLoading: boolean = false;
  showDuplicateModal: boolean = false;
  showAllDuplicatesModal: boolean = false;
  showEvolutionBlockedModal: boolean = false;
  showAllBlockedByEvolutionsModal: boolean = false;
  articlesWithCuttingSheet: string[] = [];
  articlesWithoutCuttingSheet: string[] = [];
  priorityArticles: { [key: string]: boolean } = {};
  ordoIds: number[] = [];
  ordos: any[] = [];
  messageModal: string | null = null;
  messageType: 'success' | 'error' = 'error';
  messageTitle: string = '';
  duplicates: { orderNumber: string; article: string; rowIndex: string }[] = [];
  blockedByEvolutions: DuplicateResponse['blockedByEvolutions'] = [];
  searchQuery: string = '';
  programSearchResults: ProgramSearchResult[] = [];
  showProgramSearchResults: boolean = false;
  selectedProgram: ProgramSearchResult | null = null;
  incrementSearchProgram: string = '';
  incrementSearchArticle: string = '';
  incrementSearchResult: IncrementSearchResult | null = null;
  showIncrementSearchResult: boolean = false;
  showSplitTable: boolean = false;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private cuttingSheetService: CuttingSheetEndpointsService,
    private ordoService: OrdoService,
    private cmlService: CmlService,
    private storeService: StoreService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.resetSearchState();
    this.tableheaders = ['of', 'quantite', 'article', 'date', 'programme', 'direction', 'statut'];
  }

  resetForm() {
    this.selectedFile = null;
    this.tableheaders = ['of', 'quantite', 'article', 'date', 'programme', 'direction', 'statut'];
    this.tableData = [];
    this.urgentArticles = [];
    this.nonUrgentArticles = [];
    this.articlesWithCuttingSheet = [];
    this.articlesWithoutCuttingSheet = [];
    this.priorityArticles = {};
    this.ordoIds = [];
    this.ordos = [];
    this.duplicates = [];
    this.blockedByEvolutions = [];
    this.showDuplicateModal = false;
    this.showAllDuplicatesModal = false;
    this.showEvolutionBlockedModal = false;
    this.showAllBlockedByEvolutionsModal = false;
    this.showSplitTable = false;
    this.messageModal = null;
    this.resetSearchState();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  resetSearchState() {
    this.searchQuery = '';
    this.programSearchResults = [];
    this.showProgramSearchResults = false;
    this.selectedProgram = null;
    this.incrementSearchProgram = '';
    this.incrementSearchArticle = '';
    this.incrementSearchResult = null;
    this.showIncrementSearchResult = false;
  }

  async onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.xlsx')) {
      this.showMessageModal('error', 'Fichier Invalide', 'Veuillez sélectionner un fichier .xlsx valide.');
      event.target.value = '';
      return;
    }

    this.resetForm(); // Reset state before processing new file
    this.selectedFile = file;
    await this.importFile();
    event.target.value = ''; // Clear file input after processing
  }

  async importFile() {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.resetSearchState();
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', dateNF: 'dd-mm-yyyy' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd-mm-yyyy' });
        const excelHeaders = jsonData[0]?.map(String) || [];
        const requiredColumns = ['of', 'quantite', 'article', 'date', 'programme'];
        const columnIndices: { [key: string]: number } = {};
        requiredColumns.forEach(col => {
          const index = excelHeaders.findIndex((header: string) => header.toLowerCase().trim() === col);
          if (index === -1) {
            this.showMessageModal('error', 'Fichier Invalide', `Colonne "${col}" introuvable. En-têtes : ${excelHeaders.join(', ')}`);
            this.resetForm();
            this.isLoading = false;
            return;
          }
          columnIndices[col] = index;
        });

        if (Object.keys(columnIndices).length !== requiredColumns.length) return;

        const invalidRows: string[] = [];
        this.tableData = jsonData.slice(1).filter((row, index) => {
          const article = row[columnIndices['article']] ? String(row[columnIndices['article']]).trim() : '';
          const dateStr = row[columnIndices['date']] ? String(row[columnIndices['date']]).trim() : '';
          const quantityStr = row[columnIndices['quantite']] ? String(row[columnIndices['quantite']]).trim() : '';
          const programme = row[columnIndices['programme']] ? String(row[columnIndices['programme']]).trim() : '';

          if (!article || article === 'undefined' || article === 'null') {
            invalidRows.push(`Ligne ${index + 2} : Article manquant ou invalide`);
            return false;
          }
          if (!programme || programme === 'undefined' || programme === 'null') {
            invalidRows.push(`Ligne ${index + 2} : Programme manquant ou invalide`);
            return false;
          }

          let quantity: number;
          try {
            quantity = parseInt(quantityStr);
            if (isNaN(quantity) || quantity <= 0) {
              invalidRows.push(`Ligne ${index + 2} : Quantité invalide "${quantityStr}"`);
              return false;
            }
          } catch (e) {
            invalidRows.push(`Ligne ${index + 2} : Quantité invalide "${quantityStr}"`);
            return false;
          }

          const { formattedDate, error } = this.parseAndFormatDate(dateStr);
          if (!formattedDate) {
            invalidRows.push(`Ligne ${index + 2} : ${error || `Date invalide "${dateStr}" (formats attendus : yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy, dd/MM/yy, ou MM/dd/yyyy)`}`);
            return false;
          }

          (row as any)._formattedDate = formattedDate;
          return true;
        }).map((row, index) => ({
          orderNumber: String(row[columnIndices['of']]).trim(),
          quantity: parseInt(String(row[columnIndices['quantite']])),
          article: String(row[columnIndices['article']]).trim().toLowerCase(),
          date: (row as any)._formattedDate as string,
          programme: String(row[columnIndices['programme']]).trim(),
          rowIndex: String(index + 2)
        }));

        if (this.tableData.length === 0) {
          const errorMessage = invalidRows.length > 0
            ? `Aucune donnée valide trouvée dans le fichier Excel. Problèmes :\n${invalidRows.join('\n')}`
            : 'Aucune donnée valide trouvée dans le fichier Excel.';
          this.showMessageModal('error', 'Aucune Donnée', errorMessage);
          this.resetForm();
          return;
        }

        if (invalidRows.length > 0) {
          console.warn('Certaines lignes ont été ignorées en raison de données invalides :', invalidRows);
          this.showMessageModal('error', 'Lignes Invalides', `Certaines lignes ont été ignorées :\n${invalidRows.join('\n')}`);
        }

        const rowsToCheck = this.tableData.map(row => ({
          orderNumber: row.orderNumber.trim(),
          article: row.article.trim().toLowerCase(),
          rowIndex: row.rowIndex,
          programme: row.programme.trim().toLowerCase()
        }));
        console.log('Lignes à vérifier pour les doublons/évolutions :', rowsToCheck);

        try {
          const duplicateResponse = await this.ordoService.checkDuplicates(rowsToCheck).toPromise();
          console.log('Réponse brute des doublons :', duplicateResponse);

          if (!duplicateResponse) {
            console.error('La réponse des doublons est indéfinie ou nulle');
            this.showMessageModal('error', 'Erreur Serveur', 'Échec de la vérification des doublons/évolutions : Aucune réponse du serveur.');
            this.isLoading = false;
            return;
          }

          this.duplicates = duplicateResponse.duplicates || [];
          this.blockedByEvolutions = duplicateResponse.blockedByEvolutions || [];

          console.log('Doublons analysés :', this.duplicates);
          console.log('Lignes bloquées par évolutions :', this.blockedByEvolutions);

          if (duplicateResponse.allBlockedByEvolutions) {
            this.showAllBlockedByEvolutionsModal = true;
            this.isLoading = false;
            return;
          }

          if (duplicateResponse.allDuplicates) {
            this.showAllDuplicatesModal = true;
            this.isLoading = false;
            return;
          }

          if (this.blockedByEvolutions.length > 0) {
            this.showEvolutionBlockedModal = true;
            this.isLoading = false;
            return;
          }

          if (this.duplicates.length > 0) {
            this.showDuplicateModal = true;
            this.isLoading = false;
            return;
          }

          await this.updateArticlesLists();

        } catch (error) {
          console.error('Erreur lors de la vérification des doublons/évolutions :', error);
          this.handleApiError(error, 'Erreur lors de la vérification des doublons ou évolutions');
          this.isLoading = false;
          return;
        }

      } catch (error) {
        console.error('Erreur lors de la lecture du fichier Excel :', error);
        this.showMessageModal('error', 'Erreur de Fichier', 'Erreur lors de la lecture du fichier Excel.');
      } finally {
        this.isLoading = false;
      }
    };

    reader.onerror = () => {
      console.error('Erreur lors de la lecture du fichier');
      this.showMessageModal('error', 'Erreur de Fichier', 'Erreur lors de la lecture du fichier.');
      this.isLoading = false;
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }

  private parseAndFormatDate(dateStr: string): { formattedDate: string | null; error: string | null } {
    if (!dateStr) {
      return { formattedDate: null, error: 'La date est vide' };
    }

    const patterns = [
      { regex: /^(\d{4})-(\d{2})-(\d{2})$/, format: 'yyyy-MM-dd' },
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'dd/MM/yyyy' },
      { regex: /^(\d{2})-(\d{2})-(\d{4})$/, format: 'dd-MM-yyyy' },
      { regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, format: 'dd/MM/yy' },
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, format: 'MM/dd/yyyy' }
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern.regex);
      if (match && match[1] && match[2] && match[3]) {
        let year: number, month: number, day: number;
        if (pattern.format === 'yyyy-MM-dd') {
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else if (pattern.format === 'dd/MM/yyyy' || pattern.format === 'dd-MM-yyyy') {
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
        } else if (pattern.format === 'dd/MM/yy') {
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          let shortYear = parseInt(match[3]);
          year = shortYear < 100 ? 2000 + shortYear : shortYear;
        } else if (pattern.format === 'MM/dd/yyyy') {
          month = parseInt(match[1]);
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          return { formattedDate: null, error: `Format de date non reconnu "${dateStr}"` };
        }

        if (month < 1 || month > 12) {
          return { formattedDate: null, error: `Mois invalide "${month}" dans la date "${dateStr}"` };
        }
        if (day < 1 || day > 31) {
          return { formattedDate: null, error: `Jour invalide "${day}" dans la date "${dateStr}"` };
        }
        if (year < 1900 || year > 9999) {
          return { formattedDate: null, error: `Année invalide "${year}" dans la date "${dateStr}"` };
        }

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime()) || date.getMonth() !== month - 1) {
          return { formattedDate: null, error: `Date invalide "${dateStr}" : ne forme pas une date valide` };
        }

        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return { formattedDate, error: null };
      }
    }

    if (!isNaN(Number(dateStr))) {
      const excelDate = Number(dateStr);
      if (excelDate <= 0) {
        return { formattedDate: null, error: `Date numérique Excel invalide "${dateStr}"` };
      }

      const epoch = new Date(1899, 11, 30);
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(epoch.getTime() + excelDate * msPerDay);

      if (isNaN(date.getTime())) {
        return { formattedDate: null, error: `Date numérique Excel invalide "${dateStr}"` };
      }

      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { formattedDate, error: null };
    }

    return { formattedDate: null, error: `Format de date non reconnu "${dateStr}"` };
  }

  getTableCells(row: ExcelRow): string[] {
    const direction = this.articlesWithCuttingSheet.includes(row.article)
      ? 'Vers CML/MAGASIN'
      : 'Vers MAGASIN';
    return [
      row.orderNumber,
      row.quantity.toString(),
      row.article,
      row.date,
      row.programme,
      direction,
      '' // Placeholder for Statut checkbox
    ];
  }

  isUrgent(): boolean {
    return Object.values(this.priorityArticles).some(priority => priority);
  }

  async continueWithoutDuplicates() {
    this.showDuplicateModal = false;
    this.tableData = this.tableData.filter(row =>
      !this.duplicates.some(duplicate =>
        duplicate.orderNumber === row.orderNumber && duplicate.article === row.article
      )
    );
    if (this.tableData.length === 0) {
      this.showMessageModal('error', 'Aucune Donnée Valide', 'Toutes les lignes sont des doublons.');
      this.resetForm();
      return;
    }
    await this.updateArticlesLists();
  }

  async continueWithoutBlockedRows() {
    this.showEvolutionBlockedModal = false;
    this.tableData = this.tableData.filter(row =>
      !this.blockedByEvolutions.some(blocked =>
        blocked.orderNumber === row.orderNumber && blocked.article === row.article
      )
    );
    if (this.tableData.length === 0) {
      this.showMessageModal('error', 'Aucune Donnée Valide', 'Toutes les lignes sont bloquées par des évolutions.');
      this.resetForm();
      return;
    }
    await this.updateArticlesLists();
  }

  cancelDuplicateModal() {
    this.showDuplicateModal = false;
    this.resetForm();
  }

  cancelEvolutionBlockedModal() {
    this.showEvolutionBlockedModal = false;
    this.resetForm();
  }

  closeAllDuplicatesModal() {
    this.showAllDuplicatesModal = false;
    this.resetForm();
  }

  closeAllBlockedByEvolutionsModal() {
    this.showAllBlockedByEvolutionsModal = false;
    this.resetForm();
  }

async updateArticlesLists() {
  const articlesWithPrograms = Array.from(
    new Set(
      this.tableData
        .map(row => ({
          article: row.article.trim().toLowerCase(),
          programme: row.programme.trim().toLowerCase()
        }))
        .filter(item => item.article && item.article !== 'undefined' && item.article !== 'null' && item.programme && item.programme !== 'undefined' && item.programme !== 'null')
    )
  );

  this.articlesWithCuttingSheet = [];
  this.articlesWithoutCuttingSheet = [];
  this.priorityArticles = {};

  const promises = articlesWithPrograms.map(({ article, programme }) =>
    this.cuttingSheetService.getCuttingSheetByArticleAndProgram(article, programme).toPromise()
      .then(cuttingSheets => ({ article, programme, cuttingSheets: cuttingSheets || [] }))
      .catch(error => ({ article, programme, cuttingSheets: [], error }))
  );

  const results: CuttingSheetResult[] = await Promise.all(promises);

  for (const result of results) {
    const articleKey = result.article;
    if (result.cuttingSheets.length > 0) {
      this.articlesWithCuttingSheet.push(articleKey);
      this.priorityArticles[articleKey] = false;
    } else {
      this.articlesWithoutCuttingSheet.push(articleKey);
      this.priorityArticles[articleKey] = false; // Initialize non-urgent articles
    }
    if (result.error && result.error.status && result.error.status !== 404) {
      console.error(`Erreur lors de la vérification de la fiche de découpe pour l'article "${result.article}"`, result.error);
    }
  }
}
  async onLaunchClick() {
    if (this.tableData.length === 0) {
      this.showMessageModal('error', 'Aucune Donnée', 'Aucune données à traiter. Veuillez importer un fichier Excel valide.');
      return;
    }
    await this.updateArticlesLists();
    if (this.isUrgent()) {
      this.showSplitTable = true;
      this.urgentArticles = this.tableData.filter(row => this.priorityArticles[row.article]);
      this.nonUrgentArticles = this.tableData.filter(row => !this.priorityArticles[row.article]);
    }
    await this.startProcess();
  }

  async startProcess(skipDuplicates: boolean = false) {
    if (!this.authService.isAuthenticated()) {
      this.showMessageModal('error', 'Erreur d\'Authentification', 'Veuillez vous connecter pour continuer.');
      this.authService.logout();
      this.showSplitTable = false;
      return;
    }

    this.isLoading = true;
    try {
      const articlesPayload = [
        ...this.articlesWithCuttingSheet.map(article => ({
          article,
          priority: this.priorityArticles[article] || false
        })),
        ...this.articlesWithoutCuttingSheet.map(article => ({
          article,
          priority: this.priorityArticles[article] || false
        }))
      ];

      if (this.tableData.length === 0) {
        throw new Error('Aucune ligne valide à traiter.');
      }

      const payload = {
        rows: this.tableData,
        articles: articlesPayload,
        skipDuplicates
      };
      console.log('Envoi du payload à createOrdo :', payload);
      const ordoResponse = await this.ordoService.createOrdo(payload).toPromise();
      if (!ordoResponse || !Array.isArray(ordoResponse)) {
        throw new Error('Tableau d\'Ordos attendu');
      }
      this.ordos = ordoResponse.filter(ordo => ordo.id && ordo.article);
      this.ordoIds = this.ordos.map(ordo => ordo.id);
      if (this.ordoIds.length === 0) {
        throw new Error('Aucun Ordo valide créé');
      }
      console.log('Ordos créés :', this.ordos);

      const processedCmlArticles = new Set<string>();
      const processedStoreArticles = new Set<string>();
      const errors: string[] = [];

      for (const row of this.tableData) {
        const article = row.article.trim().toLowerCase();
        if (!article || article === 'undefined' || article === 'null') {
          console.warn('Ignorer la ligne avec un article invalide :', row);
          errors.push(`Ligne ${row.rowIndex} : Article invalide`);
          continue;
        }

        const matchingOrdo = this.ordos.find(ordo =>
          String(ordo.article).trim().toLowerCase() === article &&
          String(ordo.orderNumber).trim() === row.orderNumber
        );
        if (!matchingOrdo) {
          console.warn(`Aucun Ordo trouvé pour l'article "${article}" et orderNumber "${row.orderNumber}"`);
          errors.push(`Ligne ${row.rowIndex} : Aucun Ordo trouvé pour l'article "${article}" et orderNumber "${row.orderNumber}"`);
          continue;
        }
        const ordoId = matchingOrdo.id;

        if (this.articlesWithCuttingSheet.includes(article) && !processedCmlArticles.has(article)) {
          try {
            const cmlPayload: CmlPayload = { ordoId, article };
            await this.cmlService.createCml(cmlPayload).toPromise();
            processedCmlArticles.add(article);
            console.log(`CML créé pour l'article "${article}" avec ordoId ${ordoId}`);
          } catch (error) {
            console.error(`Erreur lors de la création du CML pour l'article "${article}" :`, error);
            errors.push(`Ligne ${row.rowIndex} : Échec de la création du CML pour l'article "${article}"`);
          }
        }

        if (!processedStoreArticles.has(article)) {
          try {
            const storePayload: StorePayload = {
              ordoId,
              article,
              hasCuttingSheet: this.articlesWithCuttingSheet.includes(article)
            };
            await this.storeService.createStore(storePayload).toPromise();
            processedStoreArticles.add(article);
            console.log(`Store créé pour l'article "${article}" avec ordoId ${ordoId}`);
          } catch (error) {
            console.error(`Erreur lors de la création du Store pour l'article "${article}" :`, error);
            errors.push(`Ligne ${row.rowIndex} : Échec de la création du Store pour l'article "${article}"`);
          }
        }
      }

      if (errors.length > 0) {
        this.showMessageModal('error', 'Erreurs de Traitement', `Certaines lignes n'ont pas pu être traitées :\n${errors.join('\n')}`);
      } else {
        this.showMessageModal('success', 'Succès', 'Toutes les lignes ont été traitées avec succès.');
        this.resetForm();
      }

    } catch (error) {
      console.log('Caught error in startProcess:', error);
      this.handleApiError(error, 'Erreur lors du traitement des Ordos');
    } finally {
      this.isLoading = false;
      this.showSplitTable = false;
    }
  }

  async searchPrograms() {
    if (!this.searchQuery.trim()) {
      this.programSearchResults = [];
      this.showProgramSearchResults = false;
      this.selectedProgram = null;
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.ordoService.searchPrograms(this.searchQuery).toPromise();
      this.programSearchResults = response || [];
      this.showProgramSearchResults = true;
      this.selectedProgram = null;
    } catch (error) {
      this.handleApiError(error, 'Erreur lors de la recherche des programmes');
      this.programSearchResults = [];
      this.showProgramSearchResults = false;
    } finally {
      this.isLoading = false;
    }
  }

  selectProgram(program: ProgramSearchResult) {
    this.selectedProgram = program;
    this.incrementSearchProgram = program.name;
    this.showProgramSearchResults = false;
    this.searchQuery = '';
  }

  async searchIncrement() {
    if (!this.selectedProgram || !this.incrementSearchArticle.trim()) {
      this.showMessageModal('error', 'Entrée Invalide', 'Veuillez sélectionner un programme et entrer un article.');
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.ordoService.getArticleIncrementWithEvolution(
        this.selectedProgram.id,
        this.incrementSearchArticle.trim().toLowerCase()
      ).toPromise();
      this.incrementSearchResult = response || null;
      this.showIncrementSearchResult = true;
    } catch (error) {
      this.handleApiError(error, 'Erreur lors de la recherche de l\'incrément');
      this.incrementSearchResult = null;
      this.showIncrementSearchResult = false;
    } finally {
      this.isLoading = false;
    }
  }

  handleApiError(error: any, defaultMessage: string) {
    console.error('Erreur API détaillée :', error);
    let message = defaultMessage;

    console.log('Structure de l\'erreur :', {
      status: error?.status,
      statusText: error?.statusText,
      error: error?.error,
      message: error?.message,
      instanceofHttpErrorResponse: error instanceof HttpErrorResponse
    });

    const errorMessage = error?.error?.message || error?.message || '';
    if (errorMessage.includes('409 CONFLICT') || errorMessage.includes('Duplicate OF')) {
      message = 'Les données importées ont déjà été lancées.';
    } else if (error && typeof error === 'object') {
      const status = error.status || (error.response && error.response.status);
      if (status === 401) {
        this.showMessageModal('error', 'Erreur d\'Authentification', 'Veuillez vous connecter pour continuer.');
        this.authService.logout();
        return;
      } else if (status === 400) {
        message = error.error?.message || error.message || defaultMessage;
      } else if (error.message) {
        message = error.message;
      } else if (error.error && typeof error.error === 'string') {
        message = error.error;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    this.showMessageModal('error', 'Erreur', message);
  }

  showMessageModal(type: 'success' | 'error', title: string, message: string) {
    this.messageType = type;
    this.messageTitle = title;
    this.messageModal = message.replace(/</g, '<').replace(/>/g, '>');
  }

  closeMessageModal() {
    this.messageModal = null;
    this.messageTitle = '';
  }
}