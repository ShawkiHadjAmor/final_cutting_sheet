import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-invalid-fields-modal',
  templateUrl: './invalid-fields-modal.component.html',
  styleUrls: ['./invalid-fields-modal.component.css']
})
export class InvalidFieldsModalComponent {
  @Input() invalidFields: { operation: string; table: number; row?: number; field: string }[] = [];
  @Output() close = new EventEmitter<void>();
}