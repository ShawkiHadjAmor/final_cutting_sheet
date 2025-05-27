import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'app-kitting-cablage-operation',
  templateUrl: './kitting-cablage-operation.component.html',
  styleUrls: ['./kitting-cablage-operation.component.css'],
})
export class KittingCablageOperationComponent {
  @Input() group!: FormGroup;
  @Input() index!: number;
  @Output() quantityChanged = new EventEmitter<number>();

  get tables(): FormArray {
    return this.group.get('tables') as FormArray;
  }

  get kittingTable(): FormGroup | null {
    return this.tables.length > 0 ? (this.tables.at(0) as FormGroup) : null;
  }

  get kittingRows(): FormArray {
    return this.kittingTable ? (this.kittingTable.get('rows') as FormArray) : this.tables;
  }

  onQuantityChange(event: Event): void {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    if (quantity > 0) this.quantityChanged.emit(quantity);
  }

  onEnterKeyPressed(event: KeyboardEvent): void { // Fixed: Changed to KeyboardEvent
    event.preventDefault();
    const quantity = this.group.get('quantity')?.value;
    if (quantity > 0) this.quantityChanged.emit(quantity);
  }
}