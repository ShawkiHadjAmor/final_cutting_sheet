import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-marquage-laser-tms',
  templateUrl: './marquage-laser-tms.component.html',
  styleUrls: ['./marquage-laser-tms.component.css'],
})
export class MarquageLaserTmsOperationComponent implements OnInit {
  @Input() group!: FormGroup;
  @Input() index!: number;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.ensureTablesInitialized(); // Ensure tables exist
    this.initializeExistingTables(); // Set up relationships
  }

  /** Get the tables FormArray from the group */
  get tables(): FormArray {
    return this.group.get('tables') as FormArray;
  }

  /** Safely get the rows FormArray for a table, return null if not found */
  getTableRows(tableIdx: number): FormArray | null {
    const table = this.tables.at(tableIdx);
    return table ? (table.get('rows') as FormArray) : null;
  }

  /** Get the input table (first table) */
  get inputTable(): FormGroup | null {
    return this.tables.at(0) as FormGroup | null;
  }

  /** Get all output tables (everything after the first table) */
  get outputTables(): FormGroup[] {
    return this.tables.controls.slice(1) as FormGroup[];
  }

  /** Add a new row to the input table and a corresponding output table */
  addRow(tableIdx: number): void {
    if (tableIdx === 0) {
      const inputRows = this.getTableRows(0);
      if (inputRows) {
        const newInputRow = this.createInputRow();
        inputRows.push(newInputRow);
        const newOutputTable = this.createOutputTable(newInputRow);
        this.tables.push(newOutputTable);
      }
    }
  }

  /** Remove a row from the input table and its corresponding output table */
  removeRow(tableIdx: number, rowIdx: number): void {
    if (tableIdx === 0) {
      const inputRows = this.getTableRows(0);
      if (inputRows && inputRows.length > 1) {
        inputRows.removeAt(rowIdx);
        this.tables.removeAt(rowIdx + 1); // Remove the matching output table
      }
    }
  }

  /** Add a new row to an output table */
  addOutputRow(tableIdx: number): void {
    const outputRows = this.getTableRows(tableIdx);
    if (outputRows) {
      const correspondingInputRow = this.getTableRows(0)?.at(tableIdx - 1) as FormGroup | null;
      if (correspondingInputRow) {
        const newOutputRow = this.createOutputRow(correspondingInputRow);
        outputRows.push(newOutputRow);
      }
    }
  }

  /** Remove a row from an output table, but keep at least one */
  removeOutputRow(tableIdx: number, rowIdx: number): void {
    const outputRows = this.getTableRows(tableIdx);
    if (outputRows !== null && outputRows.length > 1) {
      outputRows.removeAt(rowIdx);
    }
  }

  /** Create a new input row with required fields */
  private createInputRow(): FormGroup {
    return this.fb.group({
      tmsViergeRef: ['', Validators.required],
      quantite: ['', [Validators.required, Validators.min(1)]],
    });
  }

  /** Create a new input table with one row */
  private createInputTable(): FormGroup {
    return this.fb.group({
      type: ['input'],
      rows: this.fb.array([this.createInputRow()]),
    });
  }

  /** Create a new output table linked to an input row */
  private createOutputTable(inputRow: FormGroup): FormGroup {
    const outputTable = this.fb.group({
      type: ['output'],
      rows: this.fb.array([]),
    });
    const outputRows = outputTable.get('rows') as FormArray;
    const initialOutputRow = this.createOutputRow(inputRow);
    outputRows.push(initialOutputRow);
    return outputTable;
  }

  /** Create a new output row, syncing tmsViergeRef with the input */
  private createOutputRow(inputRow: FormGroup): FormGroup {
    const outputRow = this.fb.group({
      tmsViergeRef1: [{ value: '', disabled: true }, Validators.required],
      texteDeMarquage: ['', Validators.required],
      quantiteUnitaire: ['', [Validators.required, Validators.min(1)]],
      positionDeMarquage: ['', Validators.required],
      programme: ['', Validators.required],
      quantiteAImprimer: ['', [Validators.required, Validators.min(1)]],
    });

    const tmsViergeRefControl = inputRow.get('tmsViergeRef');
    const tmsViergeRef1Control = outputRow.get('tmsViergeRef1');

    if (tmsViergeRefControl && tmsViergeRef1Control) {
      tmsViergeRef1Control.setValue(tmsViergeRefControl.value);
      tmsViergeRefControl.valueChanges.subscribe((value) => {
        tmsViergeRef1Control.setValue(value);
      });
    }

    return outputRow;
  }

  /** Ensure the tables FormArray has at least one input and one output table */
  private ensureTablesInitialized(): void {
    if (!this.tables || this.tables.length === 0) {
      const inputTable = this.createInputTable();
      this.tables.push(inputTable);
      if (this.inputTable) {
        const rows = this.inputTable.get('rows') as FormArray;
        if (rows && rows.at(0)) {
          const outputTable = this.createOutputTable(rows.at(0) as FormGroup);
          this.tables.push(outputTable);
        }
      }
    }
  }

  /** Set up existing tables, syncing input and output rows */
  private initializeExistingTables(): void {
    const inputRows = this.getTableRows(0)?.controls as FormGroup[] | null;
    const outputTables = this.outputTables;

    if (!inputRows) return; // Exit if input rows aren't ready

    inputRows.forEach((inputRow, idx) => {
      if (idx < outputTables.length) {
        const outputTable = outputTables[idx];
        const outputRows = outputTable.get('rows') as FormArray;
        if (outputRows.length > 0) {
          outputRows.controls.forEach((outputRow) => {
            const tmsViergeRefControl = inputRow.get('tmsViergeRef');
            const tmsViergeRef1Control = (outputRow as FormGroup).get('tmsViergeRef1');
            if (tmsViergeRefControl && tmsViergeRef1Control) {
              tmsViergeRef1Control.setValue(tmsViergeRefControl.value);
              tmsViergeRefControl.valueChanges.subscribe((value) => {
                tmsViergeRef1Control.setValue(value);
              });
            }
          });
        } else {
          const newOutputRow = this.createOutputRow(inputRow);
          outputRows.push(newOutputRow);
        }
      } else {
        this.tables.push(this.createOutputTable(inputRow));
      }
    });

    // Remove extra output tables if there are more than input rows
    while (this.outputTables.length > inputRows.length) {
      this.tables.removeAt(this.tables.length - 1);
    }
  }
}