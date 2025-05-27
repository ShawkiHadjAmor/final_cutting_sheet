import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

interface Revision {
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  object?: string;
  verifiedBy?: string;
}

type RevisionHistory = { [key: string]: Revision };

interface Calculation {
  operation: 'SUM' | 'PRODUCT' | 'OF' | 'OF_CELL';
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
  table: { rows: Cell[][] };
}

interface Section {
  table: { rows: Cell[][] };
  title?: string;
  showBetweenText?: boolean;
  betweenText?: string;
  isHeader?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CuttingSheetTemplateService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  /** Main method to generate the template */
  generateTemplate(data: any): string {
    const {
      article,
      programme,
      operations,
      hasSN,
      snDe,
      snA,
      barcodeDe,
      barcodeA,
      revisionHistory,
      extractedSn,
      customOperations,
      of,
      quantite,
      indice,
    } = data;

    const cableTables = this.generateCableTables(operations, quantite);
    const thermoTables = this.generateThermoTables(operations, quantite);
    const tmsTables = this.generateTmsTables(operations, quantite);
    const monchonTables = this.generateMonchonTables(operations, quantite);
    const laserTables = this.generateLaserTables(operations, barcodeDe, barcodeA, snDe, snA, extractedSn, quantite);
    const etiquetteTables = this.generateEtiquetteTables(operations, quantite);
    const kittingTables = this.generateKittingCablageTables(operations, quantite);
    const coupeCableDansUapTables = this.generateCoupeCableDansUapTables(operations, quantite);
    const marquageLaserTmsTables = this.generateMarquageLaserTmsTables(operations, quantite);
    const customOperationTables = this.generateCustomOperationTables(customOperations, quantite);
    const revisionTable = this.generateRevisionTable(revisionHistory);

    const latestIndice = this.getLatestIndice(revisionHistory) || indice || '';

    return this.generateFinalTemplate({
      article,
      programme,
      latestIndice,
      cableTables,
      thermoTables,
      tmsTables,
      monchonTables,
      laserTables,
      etiquetteTables,
      kittingTables,
      coupeCableDansUapTables,
      marquageLaserTmsTables,
      customOperationTables,
      revisionTable,
      hasSN,
      snDe,
      snA,
      barcodeDe,
      barcodeA,
      extractedSn,
      of,
      quantite,
    });
  }

  /** Get the latest revision indice from history based on createdAt date */
  private getLatestIndice(revisionHistory: string): string {
    if (!revisionHistory) return '';
    try {
      const history: RevisionHistory = JSON.parse(revisionHistory);
      const entries = Object.entries(history);
      if (entries.length === 0) return '';
      entries.sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime());
      return entries[0][0];
    } catch (e) {
      console.error('Error parsing revision history:', e);
      return '';
    }
  }

  /** Generate tables for custom operations using tabledata */
  private generateCustomOperationTables(customOperations: any[], quantite: string): string {
    if (!customOperations || !Array.isArray(customOperations) || customOperations.length === 0) {
      return '';
    }

    const sectionsHtml = customOperations
      .filter((customOp: any) => customOp && customOp.name)
      .map((customOp: any) => {
        let parsedData;
        try {
          parsedData = customOp.tabledata ? JSON.parse(customOp.tabledata) : [];
        } catch (e) {
          console.error(`Error parsing tabledata for custom operation ${customOp.name}:`, e);
          return `
            <div class="section">
              <div class="section-header">OPÉRATION PERSONNALISÉE : ${customOp.name.toUpperCase()}</div>
              <div class="section-content">
                <div class="table-container"><p>Erreur lors du chargement des données.</p></div>
              </div>
            </div>
          `;
        }

        let tablesArray;
        if (Array.isArray(parsedData)) {
          tablesArray = parsedData; // Directly use the array if it's provided
        } else if (parsedData && Array.isArray(parsedData.tables)) {
          tablesArray = parsedData.tables; // Use the tables array if it's wrapped in an object
        } else {
          tablesArray = []; // Default to empty if neither format matches
        }

        const tabledata = tablesArray.map((t: any) => ({
          table: t.table,
          title: '',
          showBetweenText: false,
          betweenText: '',
          isHeader: false,
        }));

        if (tabledata.length === 0) {
          return `
            <div class="section">
              <div class="section-header">OPÉRATION PERSONNALISÉE : ${customOp.name.toUpperCase()}</div>
              <div class="section-content">
                <div class="table-container"><p>Aucune donnée disponible</p></div>
              </div>
            </div>
          `;
        }

        const computedValues = this.computeAllCellValues(tabledata, quantite);

        const tablesHtml = Array.isArray(tabledata)
          ? tabledata
              .map((section: Section, index: number) =>
                this.generateCustomOperationTableContent(section, customOp.name, quantite, customOp.svgData, index, computedValues)
              )
              .join('')
          : '';

        return `
          <div class="section">
            <div class="section-header">OPÉRATION PERSONNALISÉE : ${customOp.name.toUpperCase()}</div>
            <div class="section-content">
              ${tablesHtml || '<div class="table-container"><p>Aucune donnée disponible</p></div>'}
            </div>
          </div>
        `;
      })
      .join('');

    return sectionsHtml || '';
  }

  /** Compute all cell values for the given sections */
  private computeAllCellValues(sections: Section[], quantite: string): { [key: string]: string } {
    const computedValues: { [key: string]: string } = {};
    sections.forEach((section: Section, sectionIndex: number) => {
      section.table.rows.forEach((row: Cell[], rowIdx: number) => {
        row.forEach((cell: Cell, colIdx: number) => {
          const value = this.resolveCellValue(sections, cell, quantite);
          computedValues[cell.id] = isNaN(value) ? '' : value.toString();
        });
      });
    });
    return computedValues;
  }

  /** Recursively resolve cell values, handling nested calculations across sections */
  private resolveCellValue(
    sections: Section[],
    cell: Cell,
    quantite: string,
    visited: Set<string> = new Set()
  ): number {
    if (!cell.calculation) {
      const parsedValue = parseFloat(cell.content as string);
      return isNaN(parsedValue) ? 0 : parsedValue; // Default to 0 if NaN
    }
    const cellId = cell.id;
    if (visited.has(cellId)) {
      console.warn(`Circular reference detected for cell ${cellId}`);
      return 0;
    }
    visited.add(cellId);

    const { operation, references } = cell.calculation;
    let value: number = 0;
    const qteOf = parseFloat(quantite) || 1;

    try {
      if (operation === 'OF') {
        const ref = references[0];
        const factor = typeof ref === 'number' ? ref : 0;
        value = factor * qteOf;
      } else if (operation === 'OF_CELL') {
        const ref = references[0] as { tableIndex: number; rowIndex: number; colIndex: number };
        if (ref && ref.tableIndex != null && ref.rowIndex != null && ref.colIndex != null) {
          const targetSection = sections[ref.tableIndex];
          const targetCell = targetSection?.table.rows[ref.rowIndex]?.[ref.colIndex];
          if (!targetCell) {
            console.warn(`Referenced cell not found: tableIndex=${ref.tableIndex}, rowIndex=${ref.rowIndex}, colIndex=${ref.colIndex}`);
            return 0;
          }
          const targetValue = this.resolveCellValue(sections, targetCell, quantite, visited);
          value = targetValue * qteOf;
        }
      } else if (operation === 'SUM') {
        value = (references as Array<{ tableIndex: number; rowIndex: number; colIndex: number }>).reduce((sum, ref) => {
          if (ref && ref.tableIndex != null && ref.rowIndex != null && ref.colIndex != null) {
            const refSection = sections[ref.tableIndex];
            const refCell = refSection?.table.rows[ref.rowIndex]?.[ref.colIndex];
            if (!refCell) {
              console.warn(`Referenced cell not found for SUM: tableIndex=${ref.tableIndex}, rowIndex=${ref.rowIndex}, colIndex=${ref.colIndex}`);
              return sum;
            }
            return sum + this.resolveCellValue(sections, refCell, quantite, visited);
          }
          return sum;
        }, 0);
      } else if (operation === 'PRODUCT') {
        value = (references as Array<{ tableIndex: number; rowIndex: number; colIndex: number }>).reduce((product, ref) => {
          if (ref && ref.tableIndex != null && ref.rowIndex != null && ref.colIndex != null) {
            const refSection = sections[ref.tableIndex];
            const refCell = refSection?.table.rows[ref.rowIndex]?.[ref.colIndex];
            if (!refCell) {
              console.warn(`Referenced cell not found for PRODUCT: tableIndex=${ref.tableIndex}, rowIndex=${ref.rowIndex}, colIndex=${ref.colIndex}`);
              return product;
            }
            return product * this.resolveCellValue(sections, refCell, quantite, visited);
          }
          return product;
        }, 1);
      }
    } catch (e) {
      console.error(`Error computing calculation for cell ${cellId}:`, e);
    } finally {
      visited.delete(cellId);
    }

    return isNaN(value) ? 0 : value;
  }

  /** Generate table content for a custom operation section */
  private generateCustomOperationTableContent(
    section: Section,
    operationName: string,
    quantite: string,
    svgData: string,
    sectionIndex: number,
    computedValues: { [key: string]: string }
  ): string {
    const hasRows = section?.table?.rows && Array.isArray(section.table.rows) && section.table.rows.length > 0;

    let headerHtml = '';
    let rowsHtml = '';
    if (hasRows) {
      const cellMap = this.buildCellMap(section.table.rows);

      // Header rows: rows with at least one cell where isHeader is true
      const headerRows = section.table.rows.filter(row => row.some(cell => cell.isHeader));
      headerHtml = headerRows.map((row, rowIdx) => {
        let rowHtml = '<tr>';
        let colIdx = 0;
        row.forEach((cell) => {
          while (colIdx < cellMap[rowIdx].length && cellMap[rowIdx][colIdx] === 'occupied') {
            colIdx++;
          }
          if (colIdx < cellMap[rowIdx].length) {
            const colspanAttr = cell.colspan > 1 ? `colspan="${cell.colspan}"` : '';
            const rowspanAttr = cell.rowspan > 1 ? `rowspan="${cell.rowspan}"` : '';
            const alignmentStyle = cell.alignment ? `text-align: ${cell.alignment};` : '';
            const fontSizeStyle = cell.fontSize ? `font-size: ${cell.fontSize}px;` : '';
            const content = cell.isHeader ? (cell.content || '') : (computedValues[cell.id] || cell.content || '');
            const tag = cell.isHeader ? 'th' : 'td';
            const style = cell.isHeader
              ? `${alignmentStyle}${fontSizeStyle}background-color: #f0f0f0;`
              : `${alignmentStyle}${fontSizeStyle}`;
            rowHtml += `
              <${tag} ${colspanAttr} ${rowspanAttr} style="${style}">
                ${content}
              </${tag}>
            `;
            colIdx += cell.colspan || 1;
          }
        });
        rowHtml += '</tr>';
        return rowHtml;
      }).join('');

      // Data rows: remaining rows without header cells
      const dataRows = section.table.rows.filter(row => !row.some(cell => cell.isHeader));
      rowsHtml = dataRows.map((row, rowIdx) => {
        let rowHtml = '<tr>';
        let colIdx = 0;
        const adjustedRowIdx = section.table.rows.indexOf(row); // Get original index in cellMap
        row.forEach((cell) => {
          while (colIdx < cellMap[adjustedRowIdx].length && cellMap[adjustedRowIdx][colIdx] === 'occupied') {
            colIdx++;
          }
          if (colIdx < cellMap[adjustedRowIdx].length) {
            const colspanAttr = cell.colspan > 1 ? `colspan="${cell.colspan}"` : '';
            const rowspanAttr = cell.rowspan > 1 ? `rowspan="${cell.rowspan}"` : '';
            const alignmentStyle = cell.alignment ? `text-align: ${cell.alignment};` : '';
            const fontSizeStyle = cell.fontSize ? `font-size: ${cell.fontSize}px;` : '';
            const content = computedValues[cell.id] || cell.content || '';
            const tag = cell.isHeader ? 'th' : 'td';
            const style = cell.isHeader
              ? `${alignmentStyle}${fontSizeStyle}background-color: #f0f0f0;`
              : `${alignmentStyle}${fontSizeStyle}`;
            rowHtml += `
              <${tag} ${colspanAttr} ${rowspanAttr} style="${style}">
                ${content}
              </${tag}>
            `;
            colIdx += cell.colspan || 1;
          }
        });
        rowHtml += '</tr>';
        return rowHtml;
      }).join('');
    } else {
      headerHtml = `<tr><th>Détails pour ${operationName}</th></tr>`;
      rowsHtml = `<tr><td>Aucune donnée disponible pour ${operationName}</td></tr>`;
    }

    const betweenTextHtml = section.showBetweenText && section.betweenText
      ? `<div class="between-text">${section.betweenText}</div>`
      : '';

    const svgHtml = svgData && sectionIndex === 0 ? this.adjustSvgForPrinting(svgData) : '';

    return `
      <div class="table-container">
        <table class="data-table">
          ${headerHtml ? `<thead>${headerHtml}</thead>` : ''}
          ${rowsHtml ? `<tbody>${rowsHtml}</tbody>` : ''}
        </table>
      </div>
      ${svgHtml ? `<div class="svg-wrapper">${svgHtml}</div>` : ''}
      ${betweenTextHtml}
    `;
  }

  /** Adjust SVG for printing within table bounds */
  private adjustSvgForPrinting(svgContent: string): string {
    if (!svgContent) return '';

    const widthMatch = svgContent.match(/width="(\d+\.?\d*)"/);
    const heightMatch = svgContent.match(/height="(\d+\.?\d*)"/);

    const svgWidth = widthMatch ? parseFloat(widthMatch[1]) : 100;
    const svgHeight = heightMatch ? parseFloat(heightMatch[1]) : 100;

    const mmToPx = 96 / 25.4;
    const maxWidthPx = 190 * mmToPx;
    const maxHeightPx = 100 * mmToPx;

    const scaleX = maxWidthPx / svgWidth;
    const scaleY = maxHeightPx / svgHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    return `
      <div class="svg-container" style="text-align: center; margin: 10px 0; page-break-inside: avoid;">
        ${svgContent.replace(
          /<svg([^>]*)>/,
          `<svg$1 transform="scale(${scale})" style="display: inline-block;">`
        )}
      </div>
    `;
  }

  /** Build a cell map to handle rowspan and colspan */
  private buildCellMap(rows: Cell[][]): (Cell | 'occupied' | null)[][] {
    if (!rows || rows.length === 0) return [];
    const numRows = rows.length;
    const numCols = rows[0].reduce((sum, cell) => sum + (cell.colspan || 1), 0);
    const cellMap: (Cell | 'occupied' | null)[][] = Array.from({ length: numRows }, () => Array(numCols).fill(null));

    rows.forEach((row, rowIndex) => {
      let col = 0;
      row.forEach((cell) => {
        while (col < numCols && cellMap[rowIndex][col] !== null) {
          col++;
        }
        for (let r = rowIndex; r < rowIndex + (cell.rowspan || 1) && r < numRows; r++) {
          for (let c = col; c < col + (cell.colspan || 1) && c < numCols; c++) {
            cellMap[r][c] = (r === rowIndex && c === col) ? cell : 'occupied';
          }
        }
        col += cell.colspan || 1;
      });
    });
    return cellMap;
  }

  private generateCableTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'cable' && op.tables?.length)
      .map((op) => {
        const tablesHtml = op.tables
          .map((table: any) => this.generateCableTableContent(table, quantite))
          .join('');
        return `
          <div class="section">
            <div class="section-header">COUPE CÂBLE</div>
            <div class="section-content">
              ${tablesHtml || '<div class="table-container"><p>Aucune donnée disponible</p></div>'}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateCableTableContent(table: any, quantite: string): string {
    if (!table || !table.columns || table.columns.length === 0) {
      return `<div class="table-container"><p>Aucune donnée disponible pour le câble: ${table?.cableRef || 'inconnu'}</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    let totalQteTotale = 0;
    const qteTotals: number[] = table.columns.map((col: any) => {
      const colQte = parseFloat(col.quantite) || 0;
      const qteTotal = colQte * qteOf;
      totalQteTotale += qteTotal;
      return qteTotal;
    });

    let tableHeader = `
      <div class="table-container">
        <div class="cable-header">
          Câble : ${table.cableRef || ''} | Mach : Con/Ld | Gauge : ${table.gauge || ''} | 1er N° Lot: ...................................................... | 2e N° Lot: ......................................................
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th></th>
    `;

    table.columns.forEach((_: any, index: number) => {
      const columnNumber = index + 1;
      tableHeader += `
        <th rowspan="2">Qté Unitaire ${columnNumber}</th>
        <th>Qté coupé ${columnNumber}</th>
        <th>Qté Total ${columnNumber}</th>
      `;
    });

    tableHeader += `
              <th class="operator-column">Visa Opérateur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Long/mm</td>
    `;

    table.columns.forEach((col: any) => {
      tableHeader += `
        <td>${col.longueur || ''}</td>
        <td rowspan="2"></td>
        <td rowspan="2">${(parseFloat(col.quantite) || 0) * qteOf || ''}</td>
      `;
    });

    tableHeader += `
              <td rowspan="2"></td>
            </tr>
            <tr>
              <td>Qté</td>
    `;

    table.columns.forEach((col: any) => {
      tableHeader += `
        <td>${col.quantite || ''}</td>
      `;
    });

    tableHeader += `
            </tr>
            <tr class="total-row">
              <td colspan="${3 * table.columns.length}">Câble : ${table.cableRef || ''}</td>
              <td>TOTAL</td>
              <td>${totalQteTotale || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    return tableHeader;
  }

  private generateThermoTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'thermo' && op.tables?.length)
      .map((op) => {
        const tablesHtml = op.tables
          .map((table: any) => this.generateThermoTableContent(table, quantite))
          .join('');
        return `
          <div class="section">
            <div class="section-header">COUPE THERMO</div>
            <div class="section-content">
              ${tablesHtml || '<div class="table-container"><p>Aucune donnée disponible</p></div>'}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateThermoTableContent(table: any, quantite: string): string {
    if (!table || !table.columns || table.columns.length === 0) {
      return `<div class="table-container"><p>Aucune donnée disponible pour le thermo: ${table?.thermoRef || 'inconnu'}</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    let totalQteTotale = 0;
    const qteTotals: number[] = table.columns.map((col: any) => {
      const colQte = parseFloat(col.quantite) || 0;
      const qteTotal = colQte * qteOf;
      totalQteTotale += qteTotal;
      return qteTotal;
    });

    let tableHeader = `
      <div class="table-container">
        <div class="cable-header">
          THERMO : ${table.thermoRef || ''} | 1er N° Lot: ...................................................... | 2e N° Lot: ......................................................
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th></th>
    `;

    table.columns.forEach((_: any, index: number) => {
      const columnNumber = index + 1;
      tableHeader += `
        <th rowspan="2">Qté Unitaire ${columnNumber}</th>
        <th>Qté totale ${columnNumber}</th>
        <th>Qté coupé ${columnNumber}</th>
      `;
    });

    tableHeader += `
              <th>Date Péremption</th>
              <th class="operator-column">Visa Opérateur</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Long/mm</td>
    `;

    table.columns.forEach((col: any, index: number) => {
      tableHeader += `
        <td>${col.longueur || ''}</td>
        <td rowspan="2">${qteTotals[index] || ''}</td>
        <td rowspan="2"></td>
      `;
    });

    tableHeader += `
              <td rowspan="2"></td>
              <td rowspan="2"></td>
            </tr>
            <tr>
              <td>Qté</td>
    `;

    table.columns.forEach((col: any) => {
      tableHeader += `
        <td>${col.quantite || ''}</td>
      `;
    });

    const totalColspan = (3 * table.columns.length) + 2;

    tableHeader += `
            </tr>
            <tr class="total-row">
              <td colspan="${totalColspan - 1}">THERMO : ${table.thermoRef || ''}</td>
              <td>TOTAL</td>
              <td>${totalQteTotale || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    return tableHeader;
  }

  private generateTmsTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'tms' && op.tables?.length)
      .map((op) => {
        const tableHtml = this.generateTmsTableContent(op.tables[0], quantite);
        return `
          <div class="section">
            <div class="section-header">MARQUAGE TMS</div>
            <div class="section-content">
              ${tableHtml}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateTmsTableContent(table: any, quantite: string): string {
    if (!table || !table.rows || table.rows.length === 0) {
      return `<div class="table-container"><p>Aucune donnée disponible pour TMS</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    let tmsRowsHtml = table.rows.map((row: any) => {
      const qteUnitaire = parseFloat(row.qteUnit) || 0;
      const qteTotale = qteUnitaire * qteOf;
      return `
        <tr>
          <td>${row.tmsVierges || ''}</td>
          <td>${row.origine || ''}</td>
          <td>${row.programmeImpression || ''}</td>
          <td>${row.qteUnit || ''}</td>
          <td>${qteTotale || ''}</td>
          <td></td>
          <td></td>
        </tr>
      `;
    }).join('');
    return `
      <div class="table-container">
        <div class="cable-header">
          1er N° Lot:............... | 2eme N° Lot:...............
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>TMS VIERGES</th>
              <th>Origine</th>
              <th>Programme d'impression</th>
              <th>Qté unit</th>
              <th>Qté Lot</th>
              <th>Qté Rebutée</th>
              <th class="operator-column">Visa Opérateur</th>
            </tr>
          </thead>
          <tbody>
            ${tmsRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateMonchonTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'monchon' && op.tables?.length)
      .map((op) => {
        const tableHtml = this.generateMonchonTableContent(op.tables[0], quantite);
        return `
          <div class="section">
            <div class="section-header">MANCHON VIERGE</div>
            <div class="section-content">
              ${tableHtml}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateMonchonTableContent(table: any, quantite: string): string {
    if (!table || !table.rows || table.rows.length === 0) {
      return `<div class="table-container"><p>Aucune donnée disponible pour le manchon</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    let monchonRowsHtml = table.rows.map((row: any) => {
      const qteUnitaire = parseFloat(row.qteUnit) || 0;
      const qteTotale = qteUnitaire * qteOf;
      return `
        <tr>
          <td>${row.manchon || ''}</td>
          <td>${row.qteUnit || ''}</td>
          <td>${qteTotale || ''}</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }).join('');
    return `
      <div class="table-container">
        <div class="cable-header">
          1er N° Lot:............... | 2eme N° Lot:...............
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Manchon</th>
              <th>Qté unit</th>
              <th>Total</th>
              <th class="lot-column">Num Lot</th>
              <th>Date péremption</th>
              <th class="operator-column">Visa Opérateur</th>
            </tr>
          </thead>
          <tbody>
            ${monchonRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateLaserTables(
    operations: any[],
    barcodeDe: string,
    barcodeA: string,
    snDe: string,
    snA: string,
    extractedSn: string,
    quantite: string
  ): string {
    const sections = operations
      .filter((op) => op.operation === 'marquageLaser' && op.tables?.length)
      .map((op) =>
        this.generateLaserTable(op.tables[0], op.imageRequired === 'yes', op.image, barcodeDe, barcodeA, snDe, snA, extractedSn, quantite)
      )
      .join('');
    return sections || '';
  }

  private generateLaserTable(
    table: any,
    showSerialColumns: boolean,
    image: string,
    barcodeDe: string,
    barcodeA: string,
    snDe: string,
    snA: string,
    extractedSn: string,
    quantite: string
  ): string {
    if (!table || !table.rows || table.rows.length === 0) {
      return `
        <div class="section">
          <div class="section-header">MARQUAGE LASER</div>
          <div class="section-content">
            <div class="table-container"><p>Aucune donnée disponible pour le marquage laser</p></div>
          </div>
        </div>
      `;
    }

    const qteOf = parseFloat(quantite) || 0;
    let laserRowsHtml = '';
    let markingTablesHtml = '';
    let additionalRow = '';

    const firstRow = table.rows[0] || {};
    const firstRowType = firstRow.type === 'collier' ? 'Collier' : 'Manchon';
    const firstRowReference = firstRow.type === 'collier' ? firstRow.collierRef : firstRow.monchonRef;
    const firstRowOrigine = firstRow.origine || '';
    const firstRowQteUnit = firstRow.qteUnit || '';

    laserRowsHtml = table.rows.map((row: any, index: number) => {
      const isLastRow = index === table.rows.length - 1;
      const rowClass = !image && isLastRow ? 'keep-with-next' : '';
      const typeHeader = row.type === 'collier' ? 'Collier' : 'Manchon';
      const reference = row.type === 'collier' ? row.collierRef : row.monchonRef;
      const qteUnitaire = parseFloat(isLastRow && !image ? firstRowQteUnit : row.qteUnit) || 0;
      const qteTotale = qteUnitaire * qteOf;

      let serialColumnContent = '';
      if (image && showSerialColumns) {
        serialColumnContent = `
          <td class="serial-number-column">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; ">De: ${snDe || ''}</td>
                <td style="width: 50%; ">À: ${snA || ''}</td>
              </tr>
            </table>
          </td>
        `;
      } else if (!image && showSerialColumns) {
        serialColumnContent = `
          <td class="serial-column">De: ${snDe || ''}</td>
          <td class="serial-column">À: ${snA || ''}</td>
        `;
      } else if (!image && isLastRow) {
        serialColumnContent = `
          <td class="serial-number-column" style="text-align: center; background-color: white;">
            <img src="../../assets/images/tempon.PNG" alt="Tempon" style="max-width: 100%; height: auto;">
          </td>
        `;
      } else if (!image && !showSerialColumns) {
        serialColumnContent = `
          <td class="serial-number-column" style="background-color: gray;"></td>
        `;
      }

      return `
        <tr class="${rowClass}">
          <td>${isLastRow && !image ? firstRowType : typeHeader}</td>
          <td>${isLastRow && !image ? firstRowReference || '' : reference || ''}</td>
          <td>${isLastRow && !image ? firstRowOrigine : row.origine || ''}</td>
          <td>${isLastRow && !image ? firstRowQteUnit : row.qteUnit || ''}</td>
          <td>${qteTotale || ''}</td>
          ${serialColumnContent}
          <td class="programme-laser-column">${isLastRow && !image ? 'CQ' : row.programmeLaser || ''}</td>
          <td class="lot-column"></td>
          <td class="operator-column"></td>
          <td class="control-column"></td>
        </tr>
      `;
    }).join('');

    const totalColumns = (image && showSerialColumns) || (!image && showSerialColumns) ? 11 : 10;

    if (image && showSerialColumns && extractedSn) {
      additionalRow = `
        <tr>
          <td colspan="${totalColumns}" style="text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center;">
              <div style="margin-right: 10px;"></div>
              <svg id="extracted-sn-barcode"></svg>
            </div>
          </td>
        </tr>
      `;
    }

    if (image && showSerialColumns) {
      markingTablesHtml = `
        <table class="marking-table">
          <tr>
            <td style="width: 33%;">
              <div class="marking-template">
                <img src="${image}" alt="Modèle de marquage" style="max-width: 100%;">
              </div>
            </td>
            <td style="width: 33%;">
              <div class="control-field">
                <strong>N° de série:</strong>
                <div class="serial-with-barcode">
                  <div class="serial-label">1er numéro de : </div>
                  <div class="serial-barcode">${barcodeDe || ''}</div>
                </div>
                </br>
                <div>à : ${barcodeA || '............'}</div>
              </div>
              <div class="control-field">
                <strong>Date:</strong> ...........
              </div>
              <div class="control-field">
                <strong>Poinçon de contrôle:</strong>
                <div style="height: 40px; border: 1px dashed #ccc; margin-top: 5px;"></div>
              </div>
            </td>
            <td style="width: 33%; text-align: center;">
              Contrôle aspect
            </td>
          </tr>
        </table>
      `;
    }

    const serialHeaders = image && showSerialColumns
      ? '<th class="serial-number-column">Numéro de série</th>'
      : !image && showSerialColumns
      ? '<th class="serial-column">De:</th><th class="serial-column">À:</th>'
      : '';
    const serialNumberHeader = !image && !showSerialColumns ? '<th class="serial-number-column">Numéro de série</th>' : '';

    return `
      <div class="section">
        <div class="section-header">MARQUAGE LASER</div>
        <div class="section-content">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Référence</th>
                  <th>Origine</th>
                  <th>Qté unitaire</th>
                  <th>Qté totale</th>
                  ${serialHeaders}
                  ${serialNumberHeader}
                  <th class="programme-laser-column">Programme LASER</th>
                  <th class="lot-column">N° de Lot</th>
                  <th class="operator-column">Visa Opérat1</th>
                  <th class="control-column">Visa Contrôle</th>
                </tr>
              </thead>
              <tbody>
                ${laserRowsHtml}
                ${additionalRow}
              </tbody>
            </table>
          </div>
          ${markingTablesHtml}
        </div>
      </div>
    `;
  }

  private generateKittingCablageTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'kittingCablage' && op.tables?.length)
      .map((op) => {
        const tableHtml = this.generateKittingCablageTableContent(op.tables[0], quantite);
        return `
          <div class="section">
            <div class="section-header">KITTING CÂBLAGE</div>
            <div class="section-content">
              ${tableHtml}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateKittingCablageTableContent(table: any, quantite: string): string {
    if (!table || !table.rows || table.rows.length === 0) {
      return `<div class="table-container"><p>Aucune donnée disponible pour le kitting câblage</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    let rowsHtml = table.rows.map((row: any) => {
      const qteUnitaire = parseFloat(row.quantite) || 0;
      const qteTotale = qteUnitaire * qteOf;
      return `
        <tr>
          <td>${row.article || ''}</td>
          <td>${row.longueur || ''}</td>
          <td>${row.bobine || ''}</td>
          <td>${row.quantite || ''}</td>
          <td>${row.emplacement || ''}</td>
          <td>${qteTotale || ''}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Longueur</th>
              <th>Bobine</th>
              <th>Quantité</th>
              <th>Emplacement</th>
              <th class="lot-column">N° Lot</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateEtiquetteTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'marquageEtiquette' && op.tables?.length)
      .map((op) => {
        const tablesHtml = op.tables.map((table: any) => this.generateEtiquetteTableContent(table, quantite)).join('');
        return `
          <div class="section">
            <div class="section-header">MARQUAGE ÉTIQUETTE</div>
            <div class="section-content">
              ${tablesHtml || '<div class="table-container"><p>Aucune donnée disponible</p></div>'}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateEtiquetteTableContent(table: any, quantite: string): string {
    if (!table || !table.etiquetteRef) {
      return `<div class="table-container"><p>Aucune donnée disponible pour l'étiquette</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    const qteUnitaire = parseFloat(table.qte) || 0;
    const qteTotale = qteUnitaire * qteOf;
    return `
      <div class="table-container">
        <table class="document-table">
          <tr>
            <td colspan="2"><div>Étiquette: ${table.etiquetteRef || ''}</div></td>
            <td>1er N° Lot:</td>
            <td>2e N° Lot:</td>
            <td>Qté rebutée: .....</td>
            <td class="operator-column" rowspan="2"><div>Visa Opérateur</div></td>
          </tr>
          <tr>
            <td class="qty-cell">Qté : ${table.qte || ''}</td>
            <td>Qté Total : ${qteTotale || ''}</td>
            <td colspan="2" class="warning-cell">
              <div class="warning-box">
                <div class="safran-logo">SAFRAN</div>
                Attention à l'orientation<br>sécurisée et serrée<br>sur le train d'atterrissage
              </div>
            </td>
            <td>Contrôle aspect : </td>
          </tr>
        </table>
      </div>
    `;
  }

  private generateCoupeCableDansUapTables(operations: any[], quantite: string): string {
    const sections = operations
      .filter((op) => op.operation === 'coupeCableDansUap' && op.tables?.length)
      .map((op) => {
        const tablesHtml = op.tables
          .map((table: any) => this.generateCableTableContent(table, quantite))
          .join('');
        return `
          <div class="section">
            <div class="section-header">COUPE CÂBLE DANS UAP</div>
            <div class="section-content">
              ${tablesHtml || '<div class="table-container"><p>Aucune données disponibles</p></div>'}
            </div>
          </div>
        `;
      })
      .join('');
    return sections || '';
  }

  private generateMarquageLaserTmsTables(operations: any[], quantite: string): string {
    let tablesHtml = '';
    operations
      .filter((op) => op.operation === 'marquageLaserTms' && op.tables?.length)
      .forEach((op) => {
        const inputTables = op.tables.filter((t: any) => t.type === 'input');
        const outputTables = op.tables.filter((t: any) => t.type === 'output');

        if (
          (inputTables.length > 0 && inputTables[0]?.rows?.length > 0) ||
          (outputTables.length > 0 && outputTables.some((t: any) => t.rows?.length > 0))
        ) {
          let inputTableHtml = inputTables.length > 0 ? this.generateMarquageLaserTmsInputTable(inputTables[0], quantite) : '';
          let outputTablesHtml = outputTables
            .map((outputTable: any, idx: number) => {
              const inputRowIndex = Math.min(idx, inputTables[0]?.rows?.length - 1 || 0);
              const tmsViergeRef = inputTables[0]?.rows?.[inputRowIndex]?.tmsViergeRef || '';
              return this.generateMarquageLaserTmsOutputTable(outputTable, idx + 1, tmsViergeRef, quantite);
            })
            .join('');

          tablesHtml += `
            <div class="section">
              <div class="section-header">MARQUAGE LASER TMS</div>
              <div class="section-content">
                ${inputTableHtml}
                ${outputTablesHtml}
              </div>
            </div>
          `;
        }
      });
    return tablesHtml;
  }

  private generateMarquageLaserTmsInputTable(table: any, quantite: string): string {
    if (!table || !table.rows || table.rows.length === 0) {
      return '<div class="table-container"><p>Aucune donnée disponible pour la table d\'entrée</p></div>';
    }
    const qteOf = parseFloat(quantite) || 0;
    let rowsHtml = table.rows.map((row: any) => {
      const qteUnitaire = parseFloat(row.quantite) || 0;
      const qteTotale = qteUnitaire * qteOf;
      return `
        <tr>
          <td colspan="2">${row.tmsViergeRef || ''}</td>
          <td>${row.quantite || ''}</td>
          <td class="lot-column"></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }).join('');
    return `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th colspan="2">TMS Vierge Ref</th>
              <th>Quantité</th>
              <th class="lot-column">N° Lot</th>
              <th>Date Péremption</th>
              <th class="operator-column">Visa Opérateur</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateMarquageLaserTmsOutputTable(table: any, tableNum: number, tmsViergeRef: string, quantite: string): string {
    if (!table || !table.rows || table.rows.length === 0) {
      return `<div class="table-container"><h5>Opérations sur TMS Vierge Ref ${tmsViergeRef} :</h5><p>Aucune donnée disponible</p></div>`;
    }
    const qteOf = parseFloat(quantite) || 0;
    let rowsHtml = table.rows.map((row: any) => {
      const qteUnitaire = parseFloat(row.quantiteUnitaire) || parseFloat(row.quantiteAImprimer) || 0;
      const qteTotale = qteUnitaire * qteOf;
      return `
        <tr>
          <td>${row.texteDeMarquage || ''}</td>
          <td>${row.quantiteUnitaire || ''}</td>
          <td>${row.positionDeMarquage || ''}</td>
          <td>${row.programme || ''}</td>
          <td>${row.quantiteAImprimer || ''}</td>
          <td></td>
          <td></td>
        </tr>
      `;
    }).join('');
    return `
      <div class="table-container">
        <h5>Opérations sur TMS Vierge Ref ${tmsViergeRef} :</h5>
        <table class="data-table">
          <thead>
            <tr>
              <th colspan="2">TMS Vierge Ref: ${tmsViergeRef}</th>
              <th colspan="5">Lot: </th>
            </tr>
            <tr>
              <th>Texte de Marquage</th>
              <th>Quantité Unitaire</th>
              <th>Position de Marquage</th>
              <th>Programme</th>
              <th>Quantité à Imprimer</th>
              <th class="operator-column">Visa Opérateur</th>
              <th class="control-column">Visa Contrôleur</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateRevisionTable(revisionHistory: string): string {
    if (!revisionHistory) {
      return `
        <div class="section">
          <div class="section-header">HISTORIQUE DES RÉVISIONS</div>
          <div class="section-content">
            <div class="table-container"><p>Aucun historique de révision disponible</p></div>
          </div>
        </div>
      `;
    }

    let historyRows = '';
    try {
      const history = JSON.parse(revisionHistory);
      const indices = Object.keys(history).sort((a, b) => a.localeCompare(b));
      historyRows = indices.map((indice) => {
        const details = history[indice];
        return `
          <tr>
            <td>${indice}</td>
            <td>${details.createdBy || ''}</td>
            <td>${details.createdAt || ''}</td>
            <td>${details.updatedBy || ''}</td>
            <td>${details.updatedAt || ''}</td>
            <td>${details.object || ''}</td>
            <td>${details.verifiedBy || ''}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error('Erreur lors de l\'analyse de l\'historique des révisions:', e);
      return `
        <div class="section">
          <div class="section-header">HISTORIQUE DES RÉVISIONS</div>
          <div class="section-content">
            <div class="table-container"><p>Erreur lors du chargement de l'historique des révisions</p></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="section">
        <div class="section-header">HISTORIQUE DES RÉVISIONS</div>
        <div class="section-content">
          <div class="table-container">
            <table class="data-table revision-table">
              <thead>
                <tr>
                  <th>Indice</th>
                  <th>Créé Par</th>
                  <th>Créé Le</th>
                  <th>Mis à Jour Par</th>
                  <th>Mis à Jour Le</th>
                  <th>Objet</th>
                  <th>Vérifié Par</th>
                </tr>
              </thead>
              <tbody>
                ${historyRows || '<tr><td colspan="7">Aucun historique de révision</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  private generateFinalTemplate(data: {
    article: string;
    programme: { name: string } | null;
    latestIndice: string;
    hasSN: string;
    snDe: string;
    snA: string;
    barcodeDe: string;
    barcodeA: string;
    cableTables: string;
    thermoTables: string;
    tmsTables: string;
    monchonTables: string;
    laserTables: string;
    etiquetteTables: string;
    kittingTables: string;
    coupeCableDansUapTables: string;
    marquageLaserTmsTables: string;
    customOperationTables: string;
    revisionTable: string;
    extractedSn: string;
    of: string;
    quantite: string;
  }): string {
    const {
      article,
      programme,
      latestIndice,
      hasSN,
      snDe,
      snA,
      barcodeDe,
      barcodeA,
      cableTables,
      thermoTables,
      tmsTables,
      monchonTables,
      laserTables,
      etiquetteTables,
      kittingTables,
      coupeCableDansUapTables,
      marquageLaserTmsTables,
      customOperationTables,
      revisionTable,
      extractedSn,
      of,
      quantite,
    } = data;

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche de Coupe</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            line-height: 1.2; 
            color: black; 
            background: white; 
            margin: 0; 
            padding: 0; 
          }
          .fiche-container { 
            width: 100%; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 10mm; 
            background: white; 
            border: 1px solid black; 
            box-decoration-break: clone; 
          }
          .fiche-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 10px; 
            border: 1px solid black; 
            margin-bottom: 10px; 
            background: #f0f0f0; 
          }
          .logo-container { 
            width: 150px; 
          }
          .title-container { 
            width: 200px; 
            text-align: center; 
          }
          .confidentiality-container { 
            width: 150px; 
            text-align: right; 
          }
          .fiche-header h1 { 
            font-size: 22px; 
            margin: 0; 
          }
          .header-confidentiality {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          .sn-container { 
            text-align: center; 
            margin: 5px 0; 
            padding: 5px; 
          }
          .sn-range { 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .barcode-container { 
            display: flex; 
            justify-content: center; 
            gap: 30px; 
            margin: 10px 0; 
          }
          .barcode-item { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
          }
          .header-info { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 10px; 
            margin: 5px 0; 
            padding: 5px; 
            font-size: 14px; 
          }
          .section { 
            margin: 5px 0;
            page-break-inside: auto; 
          }
          .section-header { 
            background: #f0f0f0; 
            color: black; 
            padding: 8px; 
            font-weight: 500; 
            text-align: center; 
            font-size: 16px; 
            border: 1px solid black; 
            margin-bottom: 5px; 
            page-break-after: avoid;
          }
          .section-content { 
            padding: 5px; 
          }
          .table-container { 
            page-break-inside: auto; 
            margin-bottom: 10px; 
            width: 100%; 
            overflow-x: auto; 
            break-inside: auto;
          }
          table.data-table { 
            table-layout: auto;
            width: 100%; 
            max-width: 100%; 
            border-collapse: collapse; 
            font-size: 10px; 
            page-break-inside: auto; 
          }
          th, td { 
            padding: 6px; 
            border: 1px solid black; 
            text-align: left; 
            color: black; 
            word-wrap: break-word; 
            overflow-wrap: break-word; 
            min-width: 40px;
          }
          th { 
            background: white; 
            font-weight: bold; 
          }
          tr { 
            page-break-inside: avoid; 
            page-break-after: auto; 
          }
          .cable-header { 
            margin-bottom: 5px; 
            font-weight: bold; 
            text-align: center; 
          }
          .total-row td { 
            font-weight: bold; 
          }
          .marking-table { 
            width: 100%; 
            max-width: 100%; 
            margin-top: 5px; 
            border-collapse: collapse; 
          }
          .marking-table td { 
            vertical-align: top; 
            padding: 5px; 
            border: 1px solid black; 
          }
          .marking-template { 
            padding: 5px; 
            text-align: center; 
          }
          .control-field { 
            margin-bottom: 5px; 
          }
          .document-table { 
            width: 100%; 
            max-width: 100%; 
            border-collapse: collapse; 
            margin: 5px 0; 
          }
          .warning-box { 
            border: 2px solid black; 
            padding: 5px; 
            text-align: center; 
            background: white; 
          }
          .safran-logo { 
            font-weight: bold; 
            color: black; 
            margin-bottom: 5px; 
          }
          .operator-cell { 
            text-align: center; 
            vertical-align: middle; 
          }
          .qty-cell { 
            font-weight: bold; 
          }
          .revision-table { 
            font-size: 10px; 
          }
          .serial-column {
            width: 90px;
          }
          .serial-number-column {
            width: 180px;
          }
          .lot-column {
            width: 100px;
          }
          .programme-laser-column {
            width: 100px;
          }
          .operator-column {
            width: 50px;
          }
          .control-column {
            width: 50px;
          }
          .keep-with-next {
            page-break-after: avoid;
          }
          .between-text {
            margin: 10px 0;
            font-style: italic;
            text-align: center;
            page-break-before: avoid;
            page-break-after: avoid;
          }
          .svg-wrapper {
            margin-top: 15px;
            page-break-inside: avoid;
            page-break-before: auto;
            page-break-after: auto;
          }
          .svg-container {
            width: 100%;
            max-width: 100%;
            text-align: center;
            margin: 10px 0;
            overflow: visible;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .svg-container svg {
            max-width: 100%;
            width: auto;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          @media screen {
            .fiche-container {
              max-width: 90%;
            }
          }
          @media print {
            @page { 
              size: A4; 
              margin: 10mm 10mm 20mm 10mm; 
              @bottom-center {
                content: "Page " counter(page) " / " counter(pages);
                font-size: 12pt;
                color: black;
              }
              @top-left {
                content: none;
              }
              @top-center {
                content: none;
              }
              @top-right {
                content: none;
              }
              @bottom-left {
                content: none;
              }
              @bottom-right {
                content: none;
              }
            }
            html, body { 
              width: 210mm; 
              height: 297mm; 
              margin: 0; 
              padding: 0; 
            }
            .fiche-container { 
              margin: 0; 
              padding: 10mm; 
              border: none; 
              box-shadow: none; 
              page-break-before: avoid; 
              page-break-after: avoid; 
            }
            .section-header { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: #f0f0f0; 
              page-break-after: avoid;
            }
            .fiche-header { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: #f0f0f0; 
              page-break-after: avoid;
            }
            .document-content {
              padding-bottom: 20mm; 
            }
            thead { 
              display: table-header-group; 
              page-break-before: avoid;
              page-break-after: avoid;
            }
            tbody { 
              page-break-inside: auto; 
              break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            td[style*="background-color"] {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .table-container {
              break-inside: auto;
              page-break-inside: auto;
              page-break-before: auto;
              page-break-after: auto;
              margin-bottom: 15px;
            }
            .svg-wrapper {
              break-inside: avoid;
              page-break-inside: avoid;
              page-break-before: auto;
              page-break-after: auto;
              margin-top: 15px;
            }
            .svg-container {
              break-inside: avoid;
              page-break-inside: avoid;
              page-break-before: auto;
              page-break-after: auto;
              margin: 15px 0;
            }
            body > *:not(.fiche-container) {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="fiche-container">
          <div class="fiche-header">
            <div class="logo-container">
              <img style="width: 150px; height: auto;" src="../../assets/images/LOGO_SAFRAN_noir.png" alt="SAFRAN" />
            </div>
            <div class="title-container">
              <h1>Fiche de coupe</h1>
            </div>
            <div class="confidentiality-container">
              <div class="header-confidentiality">
                <div>C2 - Confidentiel</div>
                <div>Date: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          ${data.hasSN === 'yes' ? `
            <div class="sn-container">
              <div class="sn-range">SN : De ${data.snDe || ''} À ${data.snA || ''}</div>
              <div class="barcode-container">
                ${data.barcodeDe ? `<div class="barcode-item"><div>DE</div>${data.barcodeDe}</div>` : ''}
                ${data.barcodeA ? `<div class="barcode-item"><div>À</div>${data.barcodeA}</div>` : ''}
              </div>
            </div>
          ` : ''}
          <div class="header-info">
            <div><strong>Article:</strong> ${data.article || ''}<br><strong>N° OF:</strong> ${data.of || ''}</div>
            <div><strong>Qté OF:</strong> ${data.quantite || ''}<br><strong>Programme:</strong> ${data.programme?.name || ''}</div>
            <div><strong>Activité:</strong> ........</div>
            <div><strong>Opérateur :</strong> ..............</div>
            <div><strong>Date:</strong> ...........</div>
            <div><strong>Révision :</strong> ${data.latestIndice}</div>
          </div>
          <div class="document-content">
            ${data.coupeCableDansUapTables}
            ${data.cableTables}
            ${data.thermoTables}
            ${data.kittingTables}
            ${data.tmsTables}
            ${data.monchonTables}
            ${data.laserTables}
            ${data.etiquetteTables}
            ${data.marquageLaserTmsTables}
            ${data.customOperationTables}
            ${data.revisionTable}
          </div>
        </div>
        <script>
          window.onload = function() {
            var extractedSnBarcode = document.getElementById('extracted-sn-barcode');
            if (extractedSnBarcode && '${data.extractedSn}') {
              JsBarcode(extractedSnBarcode, '${data.extractedSn}', {
                format: 'CODE128',
                displayValue: false,
                height: 30,
                width: 1
              });
              extractedSnBarcode.setAttribute('height', '60');
              extractedSnBarcode.setAttribute('width', '130');
            }
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                console.log("Impression terminée, fermeture de la fenêtre...");
                window.close();
              };
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
  }
}