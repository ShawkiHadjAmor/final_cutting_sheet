import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Konva from 'konva';
import { CuttingSheetEndpointsService } from '../../services/endpoints-services/cutting-sheet-endpoints.service';

interface Calculation {
  operation: 'SUM' | 'OF_CELL';
  references: Array<{ tableIndex: number; rowIndex: number; colIndex: number } | number>;
}

interface Cell {
  type: 'text' | 'number';
  content: string | number;
  colspan: number;
  rowspan: number;
  alignment: 'left' | 'center' | 'right';
  height?: number;
  fontSize?: number;
  id: string;
  calculation?: Calculation;
  isHeader?: boolean;
}

interface Table {
  rows: Cell[][];
}

interface TableState {
  tableIndex: number;
  table: { rows: Cell[][] };
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

@Component({
  selector: 'app-custom-operation',
  templateUrl: './custom-operation.component.html',
  styleUrls: ['./custom-operation.component.css']
})
export class CustomOperationComponent implements OnInit, AfterViewInit {
  @ViewChild('konvaContainer') konvaContainer!: ElementRef;
  @ViewChild('stageImageInput') stageImageInput!: ElementRef;

  customOperationForm!: FormGroup;
  tables: Table[] = [];
  selectedCell: { tableIndex: number; rowIndex: number; colIndex: number } | null = null;
  showContextMenu = false;
  contextMenuX = 0;
  contextMenuY = 0;
  isPreviewEmpty = true;
  selectedStrokeWidth: number = 1;
  selectedTextSize: number = 10;
  private history: TableState[] = [];
  public annotationStack: Konva.Group[] = [];
  private activeTextarea: HTMLTextAreaElement | null = null;
  isSidebarOpen = true;
  selectingReferences = false;
  referenceCells: Array<{ tableIndex: number; rowIndex: number; colIndex: number }> = [];
  selectedForSum: Array<{ tableIndex: number; rowIndex: number; colIndex: number }> = [];

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private tableGroup!: Konva.Group;
  private annotationGroup!: Konva.Group;
  private transformer!: Konva.Transformer;

  showModal: boolean = false;
  modalMessage: string = '';
  private readonly MAX_DATA_SIZE_BYTES = 16 * 1024 * 1024; // 16MB
  private readonly MAX_IMAGE_SIZE_PX = 800;
  private readonly IMAGE_QUALITY = 0.7;

  constructor(
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private cuttingSheetEndpointsService: CuttingSheetEndpointsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.customOperationForm = this.fb.group({
      operationName: ['', Validators.required]
    });

    this.customOperationForm.get('operationName')?.valueChanges.subscribe(() => {
      this.updatePreview();
    });
  }

  ngAfterViewInit(): void {
    this.initializeKonva();
    this.resizeStage();
    this.addTable(); // Initialize with one table
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeStage();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const contextMenu = document.querySelector('.context-menu');
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      this.showContextMenu = false;
      this.cdRef.detectChanges();
    }
  }

  private resizeStage(): void {
    if (!this.konvaContainer) return;
    const container = this.konvaContainer.nativeElement;
    if (this.stage) {
      this.stage.width(container.offsetWidth);
      this.stage.height(window.innerWidth < 768 ? 1000 : 2000);
      this.renderTables();
      this.stage.draw();
    }
  }

  private initializeKonva(): void {
    const container = this.konvaContainer.nativeElement;
    this.stage = new Konva.Stage({
      container: container,
      width: container.offsetWidth,
      height: window.innerWidth < 768 ? 1000 : 2000
    });
    this.layer = new Konva.Layer();
    this.tableGroup = new Konva.Group({ x: 0, y: 0 });
    this.annotationGroup = new Konva.Group({ x: 0, y: 0 });
    this.layer.add(this.tableGroup);
    this.layer.add(this.annotationGroup);
    this.stage.add(this.layer);

    this.transformer = new Konva.Transformer({
      keepRatio: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      }
    });
    this.layer.add(this.transformer);

    this.stage.on('click', (e) => {
      if (e.target === this.stage) {
        this.transformer.nodes([]);
        this.layer.batchDraw();
      } else if (this.selectingReferences) {
        const target = e.target.getAncestors().find(node => node.name().startsWith('cell_')) || e.target;
        if (target.name().startsWith('cell_')) {
          const [, tableIndex, rowIndex, colIndex] = target.name().split('_').map(Number);
          this.addReferenceCell(tableIndex, rowIndex, colIndex);
        }
      }
    });
  }

  public updatePreview(): void {
    this.isPreviewEmpty = this.tables.length === 0 || this.tables.every(table => !table.rows.length);
    this.renderTables();
    this.stage.draw();
    this.cdRef.detectChanges();
  }

  addTable(): void {
    const table: Table = { rows: [] };
    this.tables.push(table);
    this.addInitialRow(this.tables.length - 1);
    this.isPreviewEmpty = false;
    this.updatePreview();
  }

  removeTable(tableIndex: number): void {
    if (this.tables.length > 1) {
      this.tables.splice(tableIndex, 1);
      this.isPreviewEmpty = this.tables.length === 0;
      this.updatePreview();
    }
  }

  addInitialRow(tableIndex: number): void {
    const table = this.tables[tableIndex];
    if (!table.rows) {
      table.rows = [];
    }
    if (table.rows.length === 0) {
      const numCols = 4;
      const newRow = Array(numCols)
        .fill(null)
        .map((_, colIndex) => this.createCell('text', `cell_0_${colIndex}_${Date.now()}`));
      table.rows.push(newRow);
      table.rows = [...table.rows];
      this.updatePreview();
    }
  }

  addRow(tableIndex: number): void {
    const table = this.tables[tableIndex];
    if (!table.rows) {
      table.rows = [];
      this.addInitialRow(tableIndex);
      return;
    }
    const numCols = this.getNumColumns(table) || 4;
    const newRow = Array(numCols)
      .fill(null)
      .map((_, colIndex) => this.createCell('text', `cell_${table.rows.length}_${colIndex}_${Date.now()}`));
    table.rows.push(newRow);
    table.rows = [...table.rows];
    this.updatePreview();
  }

  removeRow(tableIndex: number, rowIndex: number): void {
    const table = this.tables[tableIndex];
    if (!table.rows || !this.canRemoveRow(table, rowIndex)) {
      this.showMessage('Impossible de supprimer cette ligne car elle fait partie d\'une cellule fusionnée.');
      return;
    }
    if (table.rows.length > 1) {
      table.rows.splice(rowIndex, 1);
      table.rows = [...table.rows];
      this.updatePreview();
    }
  }

  addColumn(tableIndex: number): void {
    const table = this.tables[tableIndex];
    if (!table.rows || table.rows.length === 0) {
      this.addInitialRow(tableIndex);
      return;
    }
    table.rows.forEach((row, rowIdx) => {
      const newCell = this.createCell('text', `cell_${rowIdx}_${row.length}_${Date.now()}`);
      row.push(newCell);
      table.rows[rowIdx] = [...row];
    });
    table.rows = [...table.rows];
    this.updatePreview();
  }

  removeColumn(tableIndex: number): void {
    const table = this.tables[tableIndex];
    const numCols = this.getNumColumns(table);
    if (numCols <= 1) return;

    this.saveTableState(tableIndex);
    const columnToRemove = numCols - 1;

    table.rows.forEach((row, rowIndex) => {
      let currentCol = 0;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        const cellStart = currentCol;
        const cellEnd = currentCol + cell.colspan - 1;
        if (cellStart <= columnToRemove && cellEnd >= columnToRemove) {
          if (cell.colspan > 1) {
            cell.colspan--;
            for (let r = rowIndex + 1; r < rowIndex + cell.rowspan && r < table.rows.length; r++) {
              const targetRow = table.rows[r];
              let targetCol = 0;
              for (let tc = 0; tc < targetRow.length; tc++) {
                if (targetCol === cellStart) {
                  targetRow.splice(tc, 1);
                  table.rows[r] = [...targetRow];
                  break;
                }
                targetCol += targetRow[tc].colspan;
              }
            }
          } else {
            row.splice(c, 1);
            c--;
          }
          break;
        }
        currentCol += cell.colspan;
      }
      table.rows[rowIndex] = [...row];
    });
    table.rows = [...table.rows];
    this.updatePreview();
  }

  private createCell(type: Cell['type'], id: string): Cell {
    return {
      type,
      content: type === 'text' ? '' : 0,
      colspan: 1,
      rowspan: 1,
      alignment: 'left',
      fontSize: 10,
      id,
      isHeader: false
    };
  }

  private canRemoveRow(table: Table, rowIndex: number): boolean {
    if (!table.rows || rowIndex < 0 || rowIndex >= table.rows.length) return false;
    const cellMap = this.buildCellMap(table);
    for (let col = 0; col < cellMap[rowIndex].length; col++) {
      const cell = cellMap[rowIndex][col];
      if (cell === 'occupied' || (cell && cell.rowspan > 1 && rowIndex < table.rows.length - 1)) return false;
    }
    return true;
  }

  onInputContextMenu(event: MouseEvent, tableIndex: number, rowIndex: number, colIndex: number): void {
    event.preventDefault();
    this.selectedCell = { tableIndex, rowIndex, colIndex };
    this.showContextMenu = true;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.adjustContextMenuPosition();
    this.cdRef.detectChanges();
  }

  private adjustContextMenuPosition(): void {
    setTimeout(() => {
      const menu = document.querySelector('.context-menu') as HTMLElement;
      if (!menu) return;
      const menuRect = menu.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      if (menuRect.right > windowWidth) {
        this.contextMenuX = windowWidth - menuRect.width - 5;
      }
      if (menuRect.bottom > windowHeight) {
        this.contextMenuY -= (menuRect.bottom - windowHeight + 5);
      } else if (menuRect.top < 0) {
        this.contextMenuY = 5;
      }

      menu.style.left = `${this.contextMenuX}px`;
      menu.style.top = `${this.contextMenuY}px`;

      const submenus = menu.querySelectorAll('.submenu') as NodeListOf<HTMLElement>;
      submenus.forEach(submenu => {
        const submenuRect = submenu.getBoundingClientRect();
        if (submenuRect.right > windowWidth) {
          submenu.style.left = 'auto';
          submenu.style.right = '100%';
        } else {
          submenu.style.left = '100%';
          submenu.style.right = 'auto';
        }
        if (submenuRect.bottom > windowHeight) {
          submenu.style.top = `-${submenuRect.height - menuRect.height}px`;
        } else if (submenuRect.top < 0) {
          submenu.style.top = '0';
        } else {
          submenu.style.top = '0';
        }
      });
    }, 0);
  }

  setAlignment(alignment: 'left' | 'center' | 'right'): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    this.tables[tableIndex].rows[rowIndex][colIndex].alignment = alignment;
    this.showContextMenu = false;
    this.updatePreview();
  }

  toggleHeader(): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    const cell = this.tables[tableIndex].rows[rowIndex][colIndex];
    cell.isHeader = !cell.isHeader;
    this.showContextMenu = false;
    this.updatePreview();
  }

  changeCellType(type: 'text' | 'number'): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    const cell = this.tables[tableIndex].rows[rowIndex][colIndex];
    cell.type = type;
    if (type === 'text') {
      cell.content = '';
      delete cell.calculation;
    } else if (type === 'number') {
      cell.content = cell.calculation ? this.evaluateCalculation(cell.calculation) : 0;
    }
    this.showContextMenu = false;
    this.updatePreview();
  }

  setCalculation(operation: 'SUM' | 'OF_CELL'): void {
    if (!this.selectedCell) return;
    this.selectingReferences = true;
    this.referenceCells = [];
    this.selectedForSum = [];
    this.showContextMenu = false;

    const cell = this.tables[this.selectedCell.tableIndex].rows[this.selectedCell.rowIndex][this.selectedCell.colIndex];
    cell.calculation = { operation, references: [] };

    if (operation === 'SUM') {
      this.showMessage('Cliquez sur les cellules à inclure dans la somme. Cliquez sur "Terminer (Somme)" pour confirmer ou "Annuler" pour abandonner.');
    } else if (operation === 'OF_CELL') {
      this.showMessage('Cliquez sur une cellule à multiplier par OF. Cliquez sur "Terminer (OF x Cell)" pour confirmer ou "Annuler" pour abandonner.');
    }

    this.cdRef.detectChanges();
  }

  addReferenceCell(tableIndex: number, rowIndex: number, colIndex: number): void {
    if (this.selectingReferences && this.selectedCell) {
      const ref = { tableIndex, rowIndex, colIndex };
      if (
        tableIndex === this.selectedCell.tableIndex &&
        rowIndex === this.selectedCell.rowIndex &&
        colIndex === this.selectedCell.colIndex
      ) {
        this.showMessage('Une cellule ne peut pas se référencer elle-même.');
        return;
      }
      if (this.referenceCells.some(r => r.tableIndex === tableIndex && r.rowIndex === rowIndex && r.colIndex === colIndex)) {
        this.showMessage('Cette cellule est déjà inclue dans les références.');
        return;
      }
      const cell = this.tables[tableIndex].rows[rowIndex][colIndex];
      if (cell.type !== 'number') {
        this.showMessage('Seules les cellules de type "Nombre" peuvent être référencées pour un calcul.');
        return;
      }
      if (this.tables[this.selectedCell.tableIndex].rows[this.selectedCell.rowIndex][this.selectedCell.colIndex].calculation?.operation === 'OF_CELL' && this.referenceCells.length >= 1) {
        this.showMessage('Une seule cellule peut être sélectionnée pour le calcul OF x Cell.');
        return;
      }
      this.referenceCells.push(ref);
      if (this.tables[this.selectedCell.tableIndex].rows[this.selectedCell.rowIndex][this.selectedCell.colIndex].calculation?.operation === 'SUM') {
        this.selectedForSum.push(ref);
      }
      this.showMessage(`Cellule ajoutée (${tableIndex + 1}, ${rowIndex + 1}, ${colIndex + 1}). Continuez ou terminez.`);
      this.updatePreview();
      this.cdRef.detectChanges();
    }
  }

  finishCalculation(operation: 'SUM' | 'OF_CELL'): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    const cell = this.tables[tableIndex].rows[rowIndex][colIndex];

    if (this.referenceCells.length === 0) {
      this.showMessage('Aucune cellule référencée sélectionnée pour le calcul.');
      this.cancelCalculation();
      return;
    }
    if (operation === 'OF_CELL' && this.referenceCells.length !== 1) {
      this.showMessage('Une seule cellule doit être sélectionnée pour le calcul OF x Cell.');
      this.cancelCalculation();
      return;
    }

    cell.calculation = {
      operation,
      references: this.referenceCells
    };
    cell.type = 'number';
    cell.content = this.evaluateCalculation(cell.calculation);

    this.selectingReferences = false;
    this.referenceCells = [];
    this.selectedForSum = [];
    this.showContextMenu = false;
    this.updatePreview();
    this.showMessage(`Calcul appliqué : ${operation === 'OF_CELL' ? 'OF x Cell' : 'Somme'}.`);
    this.cdRef.detectChanges();
  }

  cancelCalculation(): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    const cell = this.tables[tableIndex].rows[rowIndex][colIndex];
    delete cell.calculation;
    cell.content = cell.type === 'number' ? 0 : '';
    this.selectingReferences = false;
    this.referenceCells = [];
    this.selectedForSum = [];
    this.showContextMenu = false;
    this.showMessage('Calcul annulé.');
    this.updatePreview();
    this.cdRef.detectChanges();
  }

  private evaluateCalculation(calculation: Calculation): number {
    if (!calculation) return 0;
    const { operation, references } = calculation;

    if (operation === 'SUM') {
      return references.reduce((sum: number, ref: any) => {
        if (typeof ref === 'number') return sum + ref;
        const { tableIndex, rowIndex, colIndex } = ref;
        const cell = this.tables[tableIndex].rows[rowIndex][colIndex];
        const value = parseFloat(cell.content as string) || 0;
        return sum + value;
      }, 0);
    } else if (operation === 'OF_CELL') {
      return 0; // Placeholder, actual calculation happens in template service with quantite
    }
    return 0;
  }

  isCellSelectedForSum(tableIndex: number, rowIndex: number, colIndex: number): boolean {
    return this.selectedForSum.some(ref => ref.tableIndex === tableIndex && ref.rowIndex === rowIndex && ref.colIndex === colIndex);
  }

  private buildCellMap(table: Table): (Cell | 'occupied' | null)[][] {
    if (!table.rows || table.rows.length === 0) {
      return [];
    }
    const numRows = table.rows.length;
    const numCols = this.getNumColumns(table);
    const cellMap: (Cell | 'occupied' | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));

    table.rows.forEach((row, rowIndex) => {
      let col = 0;
      row.forEach(cell => {
        while (col < numCols && cellMap[rowIndex][col] !== null) {
          col++;
        }
        for (let r = rowIndex; r < rowIndex + cell.rowspan && r < numRows; r++) {
          for (let c = col; c < col + cell.colspan && c < numCols; c++) {
            cellMap[r][c] = (r === rowIndex && c === col) ? cell : 'occupied';
          }
        }
        col += cell.colspan;
      });
    });
    return cellMap;
  }

  private getCellGridPosition(table: Table, rowIndex: number, colIndex: number): { gridRow: number; gridCol: number } {
    if (!table.rows || !table.rows[rowIndex]) {
      return { gridRow: rowIndex, gridCol: 0 };
    }
    let gridCol = 0;
    for (let c = 0; c < colIndex && c < table.rows[rowIndex].length; c++) {
      gridCol += table.rows[rowIndex][c].colspan;
    }
    return { gridRow: rowIndex, gridCol };
  }

  mergeRight(): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    const table = this.tables[tableIndex];
    const row = table.rows[rowIndex];
    if (colIndex >= row.length - 1) {
      this.showMessage('Impossible de fusionner au-delà des limites du tableau.');
      return;
    }
    const cell = row[colIndex];
    const nextCell = row[colIndex + 1];

    if (cell.rowspan !== nextCell.rowspan) {
      this.showMessage('Impossible de fusionner des cellules avec des rowspans différents.');
      return;
    }

    this.saveTableState(tableIndex);
    cell.colspan += nextCell.colspan;
    row.splice(colIndex + 1, 1);
    table.rows[rowIndex] = [...row];
    table.rows = [...table.rows];
    this.updatePreview();
    this.showContextMenu = false;
  }

  mergeDown(): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    const table = this.tables[tableIndex];
    const cell = table.rows[rowIndex][colIndex];
    if (rowIndex + cell.rowspan >= table.rows.length) {
      this.showMessage('Impossible de fusionner au-delà des limites du tableau.');
      return;
    }
    const pos = this.getCellGridPosition(table, rowIndex, colIndex);
    const mergeStartCol = pos.gridCol;
    const mergeEndCol = pos.gridCol + cell.colspan - 1;
    const mergeRow = rowIndex + cell.rowspan;

    const cellMap = this.buildCellMap(table);
    for (let c = mergeStartCol; c <= mergeEndCol; c++) {
      const targetCell = cellMap[mergeRow][c];
      if (targetCell === 'occupied' || (targetCell && targetCell.rowspan > 1)) {
        this.showMessage('Impossible de fusionner dans une cellule déjà fusionnée.');
        return;
      }
    }

    this.saveTableState(tableIndex);
    cell.rowspan++;

    const targetRow = table.rows[mergeRow];
    const toRemove: number[] = [];
    for (let c = 0; c < targetRow.length; c++) {
      let gridCol = -1;
      for (let gc = 0; gc < cellMap[0].length; gc++) {
        if (cellMap[mergeRow][gc] === targetRow[c]) {
          gridCol = gc;
          break;
        }
      }
      if (gridCol >= mergeStartCol && gridCol <= mergeEndCol) {
        toRemove.push(c);
      }
    }

    toRemove.reverse().forEach(index => targetRow.splice(index, 1));
    table.rows[mergeRow] = [...targetRow];
    table.rows = [...table.rows];
    this.updatePreview();
    this.showContextMenu = false;
  }

  undoMerge(): void {
    if (this.history.length === 0) return;
    const lastState = this.history.pop();
    if (lastState) {
      const table = this.tables[lastState.tableIndex];
      table.rows = JSON.parse(JSON.stringify(lastState.table.rows));
      table.rows = [...table.rows];
      this.updatePreview();
      this.cdRef.detectChanges();
    }
    this.showContextMenu = false;
  }

  private saveTableState(tableIndex: number): void {
    const tableCopy = { rows: JSON.parse(JSON.stringify(this.tables[tableIndex].rows)) };
    this.history.push({ tableIndex, table: tableCopy });
  }

  setTextSize(): void {
    if (!this.selectedCell) return;
    const { tableIndex, rowIndex, colIndex } = this.selectedCell;
    this.tables[tableIndex].rows[rowIndex][colIndex].fontSize = this.selectedTextSize;
    this.showContextMenu = false;
    this.updatePreview();
  }

  addText(): void {
    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();

    const textGroup = new Konva.Group({
      x: stageWidth / 2 - 50,
      y: stageHeight / 2 - 10,
      draggable: true,
      name: `textAnnotation_${Date.now()}`
    });

    const text = new Konva.Text({
      text: 'Cliquez pour modifier',
      fontSize: 12,
      fill: 'black',
      align: 'left',
      width: 100,
      height: 20,
      wrap: 'word',
      padding: 2,
      lineHeight: 1.2,
      name: 'textNode'
    });

    textGroup.add(text);
    this.annotationGroup.add(textGroup);
    this.annotationStack.push(textGroup);

    textGroup.on('click tap', (e) => {
      e.cancelBubble = true;
      this.transformer.nodes([textGroup]);
      this.layer.batchDraw();
    });

    text.on('dblclick dbltap', () => {
      this.editText(text, textGroup);
    });

    textGroup.on('transform', () => {
      const scaleX = textGroup.scaleX();
      const scaleY = textGroup.scaleY();

      const newWidth = Math.max(20, text.width() * scaleX);
      const newHeight = Math.max(20, text.height() * scaleY);
      const newFontSize = Math.max(8, text.fontSize() * scaleY);

      text.width(newWidth);
      text.height(newHeight);
      text.fontSize(newFontSize);

      textGroup.scale({ x: 1, y: 1 });
      textGroup.setAbsolutePosition(textGroup.getAbsolutePosition());

      this.layer.batchDraw();
    });

    textGroup.on('dragstart', () => {
      this.transformer.nodes([]);
      if (this.activeTextarea) {
        const textPos = text.getAbsolutePosition();
        const stageBox = this.stage.container().getBoundingClientRect();
        this.activeTextarea.style.left = `${stageBox.left + textPos.x}px`;
        this.activeTextarea.style.top = `${stageBox.top + textPos.y}px`;
      }
    });

    textGroup.on('dragmove', () => {
      if (this.activeTextarea) {
        const textPos = text.getAbsolutePosition();
        const stageBox = this.stage.container().getBoundingClientRect();
        this.activeTextarea.style.left = `${stageBox.left + textPos.x}px`;
        this.activeTextarea.style.top = `${stageBox.top + textPos.y}px`;
      }
    });

    this.layer.batchDraw();
  }

  editText(text: Konva.Text, group: Konva.Group): void {
    if (this.activeTextarea) {
      this.activeTextarea.remove();
      this.activeTextarea = null;
    }

    const textPosition = text.getAbsolutePosition();
    const stageBox = this.stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y
    };

    const textarea = document.createElement('textarea');
    textarea.className = `konva-textarea-${group.name()}`;
    document.body.appendChild(textarea);
    this.activeTextarea = textarea;

    textarea.value = text.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${text.width()}px`;
    textarea.style.height = `${text.height()}px`;
    textarea.style.fontSize = `${text.fontSize()}px`;
    textarea.style.border = '1px solid #ccc';
    textarea.style.padding = `${text.padding()}px`;
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.color = text.fill();
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';
    textarea.style.lineHeight = text.lineHeight().toString();
    textarea.style.textAlign = text.align();
    textarea.focus();

    const updateText = () => {
      text.text(textarea.value);
      text.height(textarea.scrollHeight / text.scaleY());
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      this.layer.batchDraw();
    };

    textarea.addEventListener('input', updateText);

    const removeTextarea = () => {
      if (textarea.value.trim()) {
        text.text(textarea.value);
      } else {
        group.destroy();
        const index = this.annotationStack.indexOf(group);
        if (index > -1) {
          this.annotationStack.splice(index, 1);
        }
      }
      document.body.removeChild(textarea);
      this.activeTextarea = null;
      group.off('dragmove');
      this.layer.batchDraw();
    };

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
    });
  }

  addArrow(): void {
    const stageWidth = this.stage.width();
    const stageHeight = this.stage.height();
    const centerX = stageWidth / 2;
    const centerY = stageHeight / 2;
    const offset = 50;
    const startX = centerX - offset;
    const startY = centerY;
    const endX = centerX + offset;
    const endY = centerY;

    const arrowGroup = new Konva.Group({
      draggable: true,
      name: 'arrowGroup'
    });

    const arrow = new Konva.Arrow({
      points: [startX, startY, endX, endY],
      stroke: 'black',
      strokeWidth: this.selectedStrokeWidth,
      pointerLength: 10,
      pointerWidth: 10
    });

    const startHandle = new Konva.Circle({
      x: startX,
      y: startY,
      radius: 6,
      fill: 'red',
      draggable: true
    });
    startHandle.setAttr('isHandle', true);

    const endHandle = new Konva.Circle({
      x: endX,
      y: endY,
      radius: 6,
      fill: 'red',
      draggable: true
    });
    endHandle.setAttr('isHandle', true);

    startHandle.on('dragmove', () => {
      const points = arrow.points();
      arrow.points([startHandle.x(), startHandle.y(), points[2], points[3]]);
      this.layer.draw();
    });

    endHandle.on('dragmove', () => {
      const points = arrow.points();
      arrow.points([points[0], points[1], endHandle.x(), endHandle.y()]);
      this.layer.draw();
    });

    arrowGroup.add(arrow);
    arrowGroup.add(startHandle);
    arrowGroup.add(endHandle);
    this.annotationGroup.add(arrowGroup);
    this.annotationStack.push(arrowGroup);
    this.stage.draw();
  }

  triggerImageUpload(): void {
    if (this.stageImageInput) {
      this.stageImageInput.nativeElement.click();
    }
  }

  onStageImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > this.MAX_IMAGE_SIZE_PX || height > this.MAX_IMAGE_SIZE_PX) {
              const scale = Math.min(this.MAX_IMAGE_SIZE_PX / width, this.MAX_IMAGE_SIZE_PX / height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const resizedDataUrl = canvas.toDataURL('image/jpeg', this.IMAGE_QUALITY);

              const imageGroup = new Konva.Group({
                x: 50,
                y: 50,
                draggable: true,
                name: 'image'
              });

              const border = new Konva.Rect({
                width: width,
                height: height,
                strokeWidth: 1,
                fill: 'white'
              });

              const konvaImg = new Konva.Image({
                image: img,
                width: width,
                height: height
              });

              imageGroup.add(border);
              imageGroup.add(konvaImg);
              this.annotationGroup.add(imageGroup);
              this.annotationStack.push(imageGroup);

              imageGroup.on('click', () => {
                this.transformer.nodes([imageGroup]);
                this.transformer.keepRatio(false);
                this.layer.batchDraw();
              });

              imageGroup.on('transform', () => {
                const newWidth = Math.max(20, border.width() * imageGroup.scaleX());
                const newHeight = Math.max(20, border.height() * imageGroup.scaleY());
                border.width(newWidth);
                border.height(newHeight);
                konvaImg.width(newWidth);
                konvaImg.height(newHeight);
                imageGroup.scaleX(1);
                imageGroup.scaleY(1);
                this.layer.batchDraw();
              });

              this.layer.batchDraw();
            }
          };
        };
        reader.readAsDataURL(file);
      });
    }
  }

  addRectangle(): void {
    const rectGroup = new Konva.Group({
      x: 50,
      y: 50,
      draggable: true,
      name: 'rectangle'
    });

    const rect = new Konva.Rect({
      width: 100,
      height: 50,
      stroke: 'black',
      strokeWidth: 2,
      fill: 'transparent'
    });

    rectGroup.add(rect);
    this.annotationGroup.add(rectGroup);
    this.annotationStack.push(rectGroup);

    rectGroup.on('click', () => {
      this.transformer.nodes([rectGroup]);
      this.transformer.keepRatio(false);
      this.layer.batchDraw();
    });

    rectGroup.on('transform', () => {
      const newWidth = Math.max(20, rect.width() * rectGroup.scaleX());
      const newHeight = Math.max(20, rect.height() * rectGroup.scaleY());
      rect.width(newWidth);
      rect.height(newHeight);
      rectGroup.scaleX(1);
      rectGroup.scaleY(1);
      this.layer.batchDraw();
    });

    this.layer.batchDraw();
  }

  undo(): void {
    const lastAnnotation = this.annotationStack.pop();
    if (lastAnnotation) {
      if (this.transformer.nodes().includes(lastAnnotation)) {
        this.transformer.nodes([]);
      }
      lastAnnotation.destroy();
      this.layer.batchDraw();
    }
  }

  private computeAnnotationBoundingBox(): BoundingBox {
    let bounds: BoundingBox = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    };

    const updateBounds = (node: Konva.Node) => {
      if (node.getAttr('isHandle') || node === this.transformer) return;

      const clientRect = node.getClientRect({ relativeTo: this.stage as unknown as Konva.Container });
      bounds.minX = Math.min(bounds.minX, clientRect.x);
      bounds.minY = Math.min(bounds.minY, clientRect.y);
      bounds.maxX = Math.max(bounds.maxX, clientRect.x + clientRect.width);
      bounds.maxY = Math.max(bounds.maxY, clientRect.y + clientRect.height);
    };

    if (this.annotationGroup.children) {
      this.annotationGroup.children.forEach(child => {
        updateBounds(child);
        if (child instanceof Konva.Group && child.children) {
          child.children.forEach(subChild => {
            if (!subChild.getAttr('isHandle')) {
              updateBounds(subChild);
            }
          });
        }
      });
    }

    if (bounds.minX === Infinity) {
      bounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }

    return bounds;
  }

  private generateAnnotationSVGContent(): string {
    const bounds = this.computeAnnotationBoundingBox();
    const padding = 10;
    let svgWidth = bounds.maxX - bounds.minX + 2 * padding;
    let svgHeight = bounds.maxY - bounds.minY + 2 * padding;

    const mmToPx = 96 / 25.4;
    const maxWidthPx = 180 * mmToPx;
    const maxHeightPx = 270 * mmToPx;

    const scaleX = maxWidthPx / svgWidth;
    const scaleY = maxHeightPx / svgHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    svgWidth = svgWidth * scale;
    svgHeight = svgHeight * scale;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
    svgContent += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="black" /></marker></defs>`;

    const translateX = padding - bounds.minX;
    const translateY = padding - bounds.minY;
    svgContent += `<g transform="translate(${translateX * scale}, ${translateY * scale}) scale(${scale})">`;

    if (this.annotationGroup && this.annotationGroup.children) {
      this.annotationGroup.children.forEach(child => {
        svgContent += this.nodeToSVG(child);
      });
    }

    svgContent += '</g></svg>';

    if (new TextEncoder().encode(svgContent).length > this.MAX_DATA_SIZE_BYTES) {
      throw new Error('SVG data exceeds maximum size of 16MB');
    }

    return svgContent;
  }

  private nodeToSVG(node: Konva.Node): string {
    if (node.getAttr('isHandle') || node === this.transformer) {
      return '';
    }
    if (node instanceof Konva.Group) {
      const transform = node.getAbsoluteTransform();
      const matrix = transform.getMatrix();
      const transformStr = `matrix(${matrix[0]},${matrix[1]},${matrix[2]},${matrix[3]},${matrix[4]},${matrix[5]})`;
      let groupSVG = `<g transform="${transformStr}">`;
      if (node.children) {
        node.children.forEach(child => {
          groupSVG += this.nodeToSVG(child);
        });
      }
      groupSVG += '</g>';
      return groupSVG;
    } else if (node instanceof Konva.Rect) {
      const x = node.x();
      const y = node.y();
      const width = node.width();
      const height = node.height();
      const fill = node.fill() || 'none';
      const stroke = node.stroke();
      const strokeWidth = node.strokeWidth();
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
    } else if (node instanceof Konva.Text) {
      let x = node.x();
      const y = node.y();
      const fontSize = node.fontSize();
      const fill = node.fill();
      const align = node.align();
      const width = node.width();
      let textAnchor = 'start';
      if (align === 'center') {
        x += width / 2;
        textAnchor = 'middle';
      } else if (align === 'right') {
        x += width;
        textAnchor = 'end';
      }
      const text = node.text().replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');
      return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="hanging">${text}</text>`;
    } else if (node instanceof Konva.Image) {
      const x = node.x();
      const y = node.y();
      const width = node.width();
      const height = node.height();
      const src = (node.image() as HTMLImageElement).src;
      return `<image x="${x}" y="${y}" width="${width}" height="${height}" xlink:href="${src}" />`;
    } else if (node instanceof Konva.Arrow) {
      const points = node.points();
      const stroke = node.stroke();
      const strokeWidth = node.strokeWidth();
      return `<line x1="${points[0]}" y1="${points[1]}" x2="${points[2]}" y2="${points[3]}" stroke="${stroke}" stroke-width="${strokeWidth}" marker-end="url(#arrowhead)" />`;
    }
    return '';
  }

  saveAsSVG(): void {
    try {
      const svgContent = this.generateAnnotationSVGContent();
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.customOperationForm.get('operationName')?.value || 'operation'}.svg`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      this.showMessage(error.message || 'Échec de l\'enregistrement du SVG');
    }
  }

  submitForm(): void {
    if (this.customOperationForm.invalid) {
      this.showMessage('Veuillez remplir tous les champs requis.');
      return;
    }

    try {
      const operationName = this.customOperationForm.get('operationName')?.value;
      const svgContent = this.annotationGroup.children?.length ? this.generateAnnotationSVGContent() : null;

      const tabledata = JSON.stringify(this.tables.map(table => ({
        table: { rows: table.rows }
      })));
      if (new TextEncoder().encode(tabledata).length > this.MAX_DATA_SIZE_BYTES) {
        this.showMessage('Les données du tableau dépassent la taille maximale de 16 Mo');
        return;
      }

      const payload = {
        name: operationName,
        operationData: JSON.stringify({ tables: this.tables.map(table => ({
          table: { rows: table.rows }
        })) }),
        svgData: svgContent,
        tabledata: tabledata
      };

      this.cuttingSheetEndpointsService.createCustomOperation(payload).subscribe({
        next: (response: any) => {
          this.showMessage('Opération personnalisée enregistrée avec succès !');
          this.customOperationForm.reset();
          this.tables = [];
          this.isPreviewEmpty = true;
          this.annotationStack = [];
          this.tableGroup.destroyChildren();
          this.annotationGroup.destroyChildren();
          this.stage.draw();
        },
        error: (error: any) => {
          const errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'enregistrement.';
          this.showMessage(errorMessage);
        }
      });
    } catch (error: any) {
      this.showMessage(error.message || 'Échec du traitement de la soumission du formulaire');
    }
  }

  private renderTables(): void {
    if (!this.tableGroup) return;
    this.tableGroup.destroyChildren();
    let yPos: number = 24;
    const padding: number = window.innerWidth < 640 ? 12 : 24;
    const stageWidth: number = this.stage.width();
    const tableWidth: number = stageWidth - 2 * padding;

    // Add operation name as title
    const operationName = this.customOperationForm.get('operationName')?.value || 'Opération Sans Nom';
    const titleGroup = new Konva.Group({ x: padding, y: yPos });
    const titleText = new Konva.Text({
      text: operationName,
      fontSize: 18,
      fontStyle: 'bold',
      fill: 'black',
      width: tableWidth,
      align: 'center'
    });
    titleGroup.add(titleText);
    this.tableGroup.add(titleGroup);
    yPos += 30;

    this.tables.forEach((table, tableIndex) => {
      if (!table.rows || table.rows.length === 0) {
        return;
      }

      if (tableIndex > 0) {
        yPos += 30; // Space between tables
      }

      const cellMap = this.buildCellMap(table);
      const numCols = cellMap[0]?.length || 0;
      const numRows = cellMap.length;
      const tableStartY: number = yPos;

      const baseColWidth: number = numCols ? tableWidth / numCols : tableWidth;
      const rowHeights: number[] = Array(numRows).fill(30);
      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
          const cell = cellMap[row][col];
          if (cell && cell !== 'occupied') {
            const cellHeight = cell.height || 30;
            for (let r = row; r < row + cell.rowspan; r++) {
              rowHeights[r] = Math.max(rowHeights[r], cellHeight / cell.rowspan);
            }
          }
        }
      }

      const colWidths: number[] = Array(numCols).fill(baseColWidth);

      const rowPositions: number[] = Array(numRows).fill(0);
      rowPositions[0] = tableStartY;
      for (let r = 1; r < numRows; r++) {
        rowPositions[r] = rowPositions[r - 1] + rowHeights[r - 1];
      }

      const colPositions: number[] = Array(numCols).fill(0);
      colPositions[0] = padding;
      for (let c = 1; c < numCols; c++) {
        colPositions[c] = colPositions[c - 1] + colWidths[c - 1];
      }

      for (let row = 0; row < numRows; row++) {
        let hasContent = false;
        for (let col = 0; col < numCols; col++) {
          const cell = cellMap[row][col];
          if (cell && cell !== 'occupied' && (cell.content || cell.calculation)) {
            hasContent = true;
            break;
          }
        }
        if (!hasContent) continue;

        for (let col = 0; col < numCols; col++) {
          const cell = cellMap[row][col];
          if (cell && cell !== 'occupied' && (row === 0 || cellMap[row - 1][col] !== cell)) {
            let cellWidth = 0;
            for (let c = col; c < col + cell.colspan; c++) {
              cellWidth += colWidths[c];
            }
            let cellHeight = 0;
            for (let r = row; r < row + cell.rowspan; r++) {
              cellHeight += rowHeights[r];
            }

            const xPos: number = colPositions[col];
            const cellYPos: number = rowPositions[row];

            const cellGroup = new Konva.Group({
              x: xPos,
              y: cellYPos,
              name: `cell_${tableIndex}_${row}_${col}`
            });

            const isSelectedForSum = this.isCellSelectedForSum(tableIndex, row, col);
            const isHeaderCell = cell?.isHeader;

            const cellRect = new Konva.Rect({
              width: cellWidth,
              height: cellHeight,
              fill: cell.calculation ? '#e6f3ff' : isHeaderCell ? '#f0f0f0' : 'white',
              stroke: isSelectedForSum ? 'green' : 'black',
              strokeWidth: isSelectedForSum ? 2 : 1
            });
            cellGroup.add(cellRect);

            let contentX: number = 4;
            const contentY: number = cellHeight / 2 + 3;

            const displayContent = cell.calculation ? cell.content.toString() : String(cell.content || '');

            const textNode = new Konva.Text({
              text: displayContent,
              fontSize: cell.fontSize || 10,
              fill: isHeaderCell ? '#333' : 'black',
              x: contentX,
              y: contentY - (cell.fontSize || 10) / 2,
              align: cell.alignment,
              width: cellWidth - 8,
              wrap: 'word'
            });
            cellGroup.add(textNode);

            if (cell.calculation) {
              const calcLabel = new Konva.Text({
                text: `(* ${cell.calculation.operation})`,
                fontSize: 8,
                fill: cell.calculation.operation === 'OF_CELL' ? '#7c3aed' : '#2563eb',
                x: cellWidth - 40,
                y: contentY - (cell.fontSize || 10) / 2 - 10
              });
              cellGroup.add(calcLabel);
            }

            this.tableGroup.add(cellGroup);
          }
        }
      }

      yPos = rowPositions[numRows - 1] + rowHeights[numRows - 1] + 30;
    });

    this.stage.height(yPos + (window.innerWidth < 768 ? 300 : 500));
    this.stage.draw();
  }

  getNumColumns(table: Table): number {
    if (!table.rows || table.rows.length === 0) {
      return 0;
    }
    return table.rows[0].reduce((sum, cell) => sum + cell.colspan, 0);
  }

  trackByTable(index: number, table: Table): number {
    return index;
  }

  trackByRow(index: number, row: Cell[]): number {
    return index;
  }

  trackByCell(index: number, cell: Cell): number {
    return index;
  }

  onCellInput(tableIndex: number, rowIndex: number, colIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const cell = this.tables[tableIndex].rows[rowIndex][colIndex];

    if (cell.type === 'number') {
      const numValue = parseFloat(value) || 0;
      cell.content = numValue;

      if (cell.calculation && cell.calculation.operation === 'SUM') {
        cell.content = this.evaluateCalculation(cell.calculation);
      }
    } else {
      cell.content = value;
    }

    this.isSidebarOpen = true;
    this.updatePreview();
  }

  onModalBackgroundClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMessage = '';
    this.cdRef.detectChanges();
  }

  showMessage(message: string): void {
    this.modalMessage = message;
    this.showModal = true;
    this.cdRef.detectChanges();
  }

  onToggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.cdRef.detectChanges();
  }
}