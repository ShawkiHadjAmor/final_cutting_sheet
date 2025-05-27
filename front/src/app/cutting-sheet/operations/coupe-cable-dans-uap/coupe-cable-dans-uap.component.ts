import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-coupe-cable-dans-uap',
  templateUrl: './coupe-cable-dans-uap.component.html',
  styleUrls: ['./coupe-cable-dans-uap.component.css'],
})
export class CoupeCableDansUapComponent {
  @Input() group!: FormGroup;
  @Input() index!: number;
  @Output() quantityChanged = new EventEmitter<number>();

  maxColumns = 3; // Maximum allowed columns

  constructor(private fb: FormBuilder) {}

  get tables(): FormArray {
    return this.group.get('tables') as FormArray;
  }

  getColumnsForTable(tableIndex: number): FormArray {
    return this.tables.at(tableIndex).get('columns') as FormArray;
  }

  onQuantityChange(event: Event): void {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    if (quantity > 0) this.quantityChanged.emit(quantity);
  }

  addColumn(tableIndex: number): void {
    const columns = this.getColumnsForTable(tableIndex);
    if (columns.length < this.maxColumns) {
      columns.push(
        this.fb.group({
          longueur: ['', Validators.required],
          quantite: ['', Validators.required],
        })
      );
    }
  }

  removeColumn(tableIndex: number, columnIndex: number): void {
    const columns = this.getColumnsForTable(tableIndex);
    if (columns.length > 1) {
      columns.removeAt(columnIndex);
    }
  }
}