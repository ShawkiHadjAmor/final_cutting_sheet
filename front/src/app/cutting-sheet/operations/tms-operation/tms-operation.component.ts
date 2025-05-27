import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'app-tms-operation',
  templateUrl: './tms-operation.component.html',
  styleUrls: ['./tms-operation.component.css'],
})
export class TmsOperationComponent {
  @Input() group!: FormGroup;
  @Input() index!: number;
  @Output() quantityChanged = new EventEmitter<number>();

  get tables(): FormArray {
    return this.group.get('tables') as FormArray;
  }

  get tmsTable(): FormGroup | null {
    return this.tables.length > 0 ? (this.tables.at(0) as FormGroup) : null;
  }

  get tmsRows(): FormArray {
    return this.tmsTable ? (this.tmsTable.get('rows') as FormArray) : this.tables;
  }

  onQuantityChange(event: Event): void {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    if (quantity > 0) this.quantityChanged.emit(quantity);
  }

  onEnterKeyPressed(event: KeyboardEvent): void { // Fixed: Changed to KeyboardEvent
    event.preventDefault();
    const quantity = parseInt(this.group.get('quantity')?.value || '1', 10);
    if (quantity > 0) this.quantityChanged.emit(quantity);
  }
}