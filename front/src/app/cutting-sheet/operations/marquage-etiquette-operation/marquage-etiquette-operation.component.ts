import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-etiquette-operation',
  templateUrl: './marquage-etiquette-operation.component.html',
  styleUrls: ['./marquage-etiquette-operation.component.css'],
})
export class MarquageEtiquetteOperationComponent implements OnInit {
  @Input() group!: FormGroup;
  @Input() index: number | null = null;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.ensureSingleTable();
  }

  get tables(): FormArray {
    return this.group.get('tables') as FormArray;
  }

  get etiquetteTable(): FormGroup | null {
    return this.tables.length > 0 ? (this.tables.at(0) as FormGroup) : null;
  }

  private ensureSingleTable(): void {
    if (this.tables.length === 0) {
      this.tables.push(
        this.fb.group({
          etiquetteRef: ['', Validators.required],
          qte: ['', Validators.required],
        })
      );
    } else if (this.tables.length > 1) {
      while (this.tables.length > 1) this.tables.removeAt(1);
    }
    this.cdr.detectChanges();
  }
}