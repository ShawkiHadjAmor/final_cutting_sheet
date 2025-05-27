import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-marquage-laser-operation',
  templateUrl: './marquage-laser-operation.component.html',
  styleUrls: ['./marquage-laser-operation.component.css'],
})
export class MarquageLaserOperationComponent implements OnInit, OnDestroy {
  @Input() group!: FormGroup;
  @Input() index!: number;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() fileChanged = new EventEmitter<{ index: number; file: File }>();
  private typeSubscription?: Subscription;
  private imageRequiredSubscription?: Subscription;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const imageRequired = this.group.get('imageRequired')?.value;
    if (imageRequired === 'yes') {
      this.ensureSingleRow();
    }

    // Subscribe to type changes to update row fields dynamically
    this.typeSubscription = this.group.get('type')?.valueChanges.subscribe((newType: string) => {
      this.updateRowsType(newType);
    });

    // Subscribe to imageRequired changes to adjust rows and quantity control
    this.imageRequiredSubscription = this.group.get('imageRequired')?.valueChanges.subscribe((value: string) => {
      if (value === 'yes') {
        this.ensureSingleRow();
        this.group.get('quantity')?.disable();
      } else {
        this.group.get('quantity')?.enable();
        const quantity = parseInt(this.group.get('quantity')?.value || '1', 10) || 1;
        this.quantityChanged.emit(quantity);
      }
    });
  }

  ngOnDestroy(): void {
    this.typeSubscription?.unsubscribe();
    this.imageRequiredSubscription?.unsubscribe();
  }

  get tables(): FormArray {
    return this.group.get('tables') as FormArray;
  }

  get laserTable(): FormGroup | null {
    return this.tables.length > 0 ? (this.tables.at(0) as FormGroup) : null;
  }

  get laserRows(): FormArray {
    return this.laserTable ? (this.laserTable.get('rows') as FormArray) : this.fb.array([]);
  }

  private ensureSingleRow(): void {
    if (this.laserRows.length === 0) {
      const type = this.group.get('type')?.value || 'monchon';
      this.laserRows.push(this.createMarquageLaserRow(type));
    } else if (this.laserRows.length > 1) {
      const firstRow = this.laserRows.at(0);
      this.laserRows.clear();
      this.laserRows.push(firstRow);
    }
    this.quantityChanged.emit(1);
  }

  private createMarquageLaserRow(type = 'monchon'): FormGroup {
    return this.fb.group({
      type: [type],
      collierRef: [type === 'collier' ? '' : null, type === 'collier' ? Validators.required : null],
      monchonRef: [type === 'monchon' ? '' : null, type === 'monchon' ? Validators.required : null],
      origine: ['', Validators.required],
      qteUnit: ['', Validators.required],
      programmeLaser: ['', Validators.required],
    });
  }

  private updateRowsType(newType: string): void {
    this.laserRows.controls.forEach((control) => {
      const row = control as FormGroup;
      row.patchValue({ type: newType });
      if (newType === 'collier') {
        row.get('collierRef')?.setValidators(Validators.required);
        row.get('monchonRef')?.clearValidators();
        row.patchValue({ monchonRef: null });
      } else {
        row.get('monchonRef')?.setValidators(Validators.required);
        row.get('collierRef')?.clearValidators();
        row.patchValue({ collierRef: null });
      }
      row.get('collierRef')?.updateValueAndValidity();
      row.get('monchonRef')?.updateValueAndValidity();
    });
  }

  onQuantityChange(event: Event): void {
    const quantity = parseInt((event.target as HTMLInputElement).value, 10);
    if (quantity > 0) {
      this.quantityChanged.emit(quantity);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileChanged.emit({ index: this.index, file: input.files[0] });
    }
  }

  onEnterKeyPressed(event: Event): void {
    if (event instanceof KeyboardEvent) {
      event.preventDefault();
      const quantity = parseInt(this.group.get('quantity')?.value || '1', 10) || 1;
      this.quantityChanged.emit(quantity);
    } else {
      console.warn('Unexpected event type:', event);
    }
  }
}