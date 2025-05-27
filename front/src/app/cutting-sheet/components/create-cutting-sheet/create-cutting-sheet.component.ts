import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { animate, style, transition, trigger, AnimationEvent } from '@angular/animations';
import { CuttingSheetEndpointsService } from '../../services/endpoints-services/cutting-sheet-endpoints.service';
import { ProgramService } from 'src/app/program/service/program.service';

type OperationType = 'cable' | 'thermo' | 'tms' | 'monchon' | 'marquageLaser' | 'marquageEtiquette' | 'kittingCablage' | 'coupeCableDansUap' | 'marquageLaserTms' | 'custom';
type TableCreator = (type?: 'input' | 'output') => FormGroup;
type RowCreator = (type?: string) => FormGroup;

interface TableConfig {
  tableCreator: TableCreator;
  rowCreator?: RowCreator;
}

interface CustomOperation {
  id: number;
  name: string;
  operationData: string;
  svgData: string;
}

@Component({
  selector: 'app-create-cutting-sheet',
  templateUrl: './create-cutting-sheet.component.html',
  styleUrls: ['./create-cutting-sheet.component.css'],
  animations: [
    trigger('popupAnimation', [
      transition(':enter', [style({ transform: 'scale(0.5)', opacity: 0 }), animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ transform: 'scale(0.5)', opacity: 0 }))]),
    ]),
    trigger('overlayAnimation', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('resultAnimation', [
      transition(':enter', [style({ transform: 'scale(0.7)', opacity: 0 }), animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ transform: 'scale(0.7)', opacity: 0 }))]),
    ]),
    trigger('invalidFieldsAnimation', [
      transition(':enter', [style({ transform: 'scale(0.7)', opacity: 0 }), animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ transform: 'scale(0.7)', opacity: 0 }))]),
    ]),
  ],
})
export class CreateCuttingSheetComponent implements OnInit, OnDestroy {
  cuttingSheetForm!: FormGroup;
  isModalOpen = false;
  modalOperationIndex: number | null = null;
  modalOperationForm: FormGroup | null = null;
  showResultModal = false;
  resultModalTitle = '';
  resultModalMessage = '';
  revisionModalOpen = false;
  revisionForm!: FormGroup;
  programmes: any[] = [];
  customOperations: CustomOperation[] = [];
  selectedCustomOperation: CustomOperation | null = null;
  private operationTypeSubscription: Subscription | null = null;
  private customOperationSubscription: Subscription | null = null;
  private loggedInUser: string | null = null;
  isInvalidFieldsModalOpen = false;
  invalidFields: { operation: string; table: number; row?: number; field: string }[] = [];
  isLoading = false;
  private pollingSubscription: Subscription | null = null;
  isCustomOnly: boolean = false;

  readonly allowedTypes = ['mecanique', 'cablage', 'montage'];

  selectedProgram: any = null;

  private readonly tableConfigs: Record<OperationType, TableConfig> = {
    cable: { tableCreator: this.createCableTable.bind(this) },
    thermo: { tableCreator: this.createThermoTable.bind(this) },
    tms: { tableCreator: this.createTmsTable.bind(this), rowCreator: this.createTmsRow.bind(this) },
    monchon: { tableCreator: this.createMonchonTable.bind(this), rowCreator: this.createMonchonRow.bind(this) },
    marquageLaser: {
      tableCreator: this.createMarquageLaserTable.bind(this),
      rowCreator: (type = 'monchon') => this.createMarquageLaserRow(type),
    },
    marquageEtiquette: { tableCreator: this.createEtiquetteTable.bind(this) },
    kittingCablage: {
      tableCreator: this.createKittingCablageTable.bind(this),
      rowCreator: this.createKittingCablageRow.bind(this),
    },
    coupeCableDansUap: { tableCreator: this.createCableTable.bind(this) },
    marquageLaserTms: {
      tableCreator: this.createMarquageLaserTmsTable.bind(this),
      rowCreator: this.createMarquageLaserTmsRow.bind(this),
    },
    custom: { tableCreator: this.createCustomTable.bind(this) },
  };

  constructor(
    private fb: FormBuilder,
    private cuttingSheetService: CuttingSheetEndpointsService,
    private programService: ProgramService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fetchProgrammes();
    this.fetchCustomOperations();
    this.startProgramPolling();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loggedInUser = user.username || null;

    this.cuttingSheetForm.get('programme')?.valueChanges.subscribe((programId: string) => {
      this.updateSelectedProgram(programId);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  private startProgramPolling(): void {
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.fetchProgrammes(true);
      this.fetchCustomOperations(true);
    });
  }

  fetchProgrammes(silent: boolean = false): void {
    this.programService.getAllProgrammes().subscribe({
      next: (response) => {
        this.programmes = response || [];
        const currentProgramId = this.cuttingSheetForm.get('programme')?.value;
        if (currentProgramId) {
          this.updateSelectedProgram(currentProgramId);
        }
        if (!silent) {
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        if (!silent) {
          console.error('Error fetching programs:', error);
        }
      },
    });
  }

  fetchCustomOperations(silent: boolean = false): void {
    this.cuttingSheetService.getAllCustomOperations().subscribe({
      next: (response: CustomOperation[]) => {
        this.customOperations = response || [];
        if (!silent) {
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        if (!silent) {
          console.error('Error fetching custom operations:', error);
        }
      },
    });
  }

  private updateSelectedProgram(programId: string): void {
    this.selectedProgram = this.programmes.find(p => String(p.id) === String(programId)) || null;
  }

  ngOnDestroy(): void {
    this.operationTypeSubscription?.unsubscribe();
    this.customOperationSubscription?.unsubscribe();
    this.pollingSubscription?.unsubscribe();
  }

  private initializeForm(): void {
    this.cuttingSheetForm = this.fb.group({
      article: ['', Validators.required],
      programme: ['', Validators.required],
      indice: ['', Validators.required],
      type: ['', Validators.required],
      hasSerialNumber: [false, Validators.required],
      operations: this.fb.array([this.createOperation('thermo')]),
    });

    this.revisionForm = this.fb.group({
      newIndice: ['', Validators.required],
      revisionObject: ['', Validators.required],
    });
  }

  get operations(): FormArray {
    return this.cuttingSheetForm.get('operations') as FormArray;
  }

  private createOperation(operationType: OperationType = 'thermo'): FormGroup {
    const baseGroup: { [key: string]: any } = {
      operation: [operationType, Validators.required],
      type: [operationType === 'custom' ? 'custom' : 'thermo'],
      imageRequired: ['no'],
      image: [null],
      tables: this.fb.array([]),
      customOperation: [operationType === 'custom' ? '' : null],
      customOperationData: [operationType === 'custom' ? '' : null],
      customSvgData: [operationType === 'custom' ? '' : null],
    };
    if (operationType !== 'marquageEtiquette' && operationType !== 'marquageLaserTms' && operationType !== 'custom') {
      baseGroup['quantity'] = ['', [Validators.min(1)]];
    }
    const operationGroup = this.fb.group(baseGroup);
    if (operationType === 'marquageLaserTms') {
      this.initializeMarquageLaserTmsTables(operationGroup);
    } else if (operationType === 'custom') {
      this.initializeCustomOperationTables(operationGroup);
    }
    return operationGroup;
  }

  private createCableTable(): FormGroup {
    return this.fb.group({
      cableRef: ['', Validators.required],
      gauge: ['', Validators.required],
      columns: this.fb.array([this.createCableColumn()]),
    });
  }

  private createCableColumn(): FormGroup {
    return this.fb.group({
      longueur: ['', Validators.required],
      quantite: ['', Validators.required],
    });
  }

  private createThermoTable(): FormGroup {
    return this.fb.group({
      thermoRef: ['', Validators.required],
      columns: this.fb.array([this.createThermoColumn()]),
    });
  }

  private createThermoColumn(): FormGroup {
    return this.fb.group({
      longueur: ['', Validators.required],
      quantite: ['', Validators.required],
    });
  }

  private createTmsTable(): FormGroup {
    return this.fb.group({ rows: this.fb.array([]) });
  }

  private createTmsRow(): FormGroup {
    return this.fb.group({
      tmsVierges: ['', Validators.required],
      origine: ['', Validators.required],
      programmeImpression: ['', Validators.required],
      qteUnit: ['', Validators.required],
    });
  }

  private createMonchonTable(): FormGroup {
    return this.fb.group({ rows: this.fb.array([]) });
  }

  private createMonchonRow(): FormGroup {
    return this.fb.group({
      manchon: ['', Validators.required],
      qteUnit: ['', Validators.required],
    });
  }

  private createMarquageLaserTable(): FormGroup {
    return this.fb.group({ rows: this.fb.array([]) });
  }

  private createMarquageLaserRow(type = 'monchon'): FormGroup {
    const row = this.fb.group({
      type: [type],
      collierRef: [type === 'collier' ? '' : null, type === 'collier' ? Validators.required : null],
      monchonRef: [type === 'monchon' ? '' : null, type === 'monchon' ? Validators.required : null],
      origine: ['', Validators.required],
      qteUnit: ['', Validators.required],
      programmeLaser: ['', Validators.required],
    });

    row.get('type')?.valueChanges.subscribe((newType) => {
      const collierRef = row.get('collierRef');
      const monchonRef = row.get('monchonRef');
      if (newType === 'collier') {
        collierRef?.setValidators(Validators.required);
        monchonRef?.clearValidators();
        monchonRef?.setValue(null);
      } else {
        monchonRef?.setValidators(Validators.required);
        collierRef?.clearValidators();
        collierRef?.setValue(null);
      }
      collierRef?.updateValueAndValidity();
      monchonRef?.updateValueAndValidity();
    });

    return row;
  }

  private createEtiquetteTable(): FormGroup {
    return this.fb.group({
      etiquetteRef: ['', Validators.required],
      qte: ['', Validators.required],
    });
  }

  private createKittingCablageTable(): FormGroup {
    return this.fb.group({ rows: this.fb.array([]) });
  }

  private createKittingCablageRow(): FormGroup {
    return this.fb.group({
      article: ['', Validators.required],
      longueur: ['', Validators.required],
      bobine: ['', Validators.required],
      quantite: ['', Validators.required],
      emplacement: ['', Validators.required],
    });
  }

  private createMarquageLaserTmsTable(type: 'input' | 'output' = 'input'): FormGroup {
    return this.fb.group({
      type: [type],
      rows: this.fb.array([]),
    });
  }

  private createMarquageLaserTmsRow(type?: string): FormGroup {
    if (type === 'input') {
      return this.fb.group({
        tmsViergeRef: ['', Validators.required],
        quantite: ['', [Validators.required, Validators.min(1)]],
      });
    } else {
      return this.fb.group({
        tmsViergeRef1: new FormControl({ value: '', disabled: true }, Validators.required),
        texteDeMarquage: ['', Validators.required],
        quantiteUnitaire: ['', [Validators.required, Validators.min(1)]],
        positionDeMarquage: ['', Validators.required],
        programme: ['', Validators.required],
        quantiteAImprimer: ['', [Validators.required, Validators.min(1)]],
      });
    }
  }

  private createCustomTable(): FormGroup {
    return this.fb.group({
      customData: [''],
    });
  }

  private initializeMarquageLaserTmsTables(formGroup: FormGroup): void {
    const tablesArray = formGroup.get('tables') as FormArray;
    tablesArray.clear();

    const inputTable = this.createMarquageLaserTmsTable('input');
    const inputRows = inputTable.get('rows') as FormArray;
    inputRows.push(this.createMarquageLaserTmsRow('input'));

    const outputTable = this.createMarquageLaserTmsTable('output');
    const outputRows = outputTable.get('rows') as FormArray;
    outputRows.push(this.createMarquageLaserTmsRow('output'));

    const inputRow = inputRows.at(0) as FormGroup;
    const outputRow = outputRows.at(0) as FormGroup;
    const tmsViergeRefControl = inputRow.get('tmsViergeRef');
    const tmsViergeRef1Control = outputRow.get('tmsViergeRef1');

    if (tmsViergeRefControl && tmsViergeRef1Control) {
      tmsViergeRef1Control.setValue(tmsViergeRefControl.value);
      tmsViergeRefControl.valueChanges.subscribe((value) => {
        tmsViergeRef1Control.setValue(value);
      });
    }

    tablesArray.push(inputTable);
    tablesArray.push(outputTable);
  }

  private initializeCustomOperationTables(formGroup: FormGroup): void {
    const tablesArray = formGroup.get('tables') as FormArray;
    tablesArray.clear();
    tablesArray.push(this.createCustomTable());
  }

  private updateTables(index: number): void {
    const targetForm = this.isModalOpen && this.modalOperationForm ? this.modalOperationForm : this.operations.at(index) as FormGroup;
    const opType = targetForm.get('operation')?.value as OperationType;
    const tablesArray = targetForm.get('tables') as FormArray;
    const config = this.tableConfigs[opType];
  
    if (!config || !opType) return;
  
    const existingTables = tablesArray.controls.map(control => control.value);
  
    tablesArray.clear();
    if (opType === 'marquageLaserTms') {
      this.initializeMarquageLaserTmsTables(targetForm);
      this.cdr.detectChanges();
    } else {
      switch (opType) {
        case 'marquageEtiquette':
          const etiquetteTable = config.tableCreator();
          if (existingTables[0]) etiquetteTable.patchValue(existingTables[0]);
          tablesArray.push(etiquetteTable);
          break;
        case 'marquageLaser':
        case 'tms':
        case 'monchon':
        case 'kittingCablage':
          const table = config.tableCreator();
          tablesArray.push(table);
          const rowsArray = table.get('rows') as FormArray;
          const imageRequired = targetForm.get('imageRequired')?.value;
          const quantity = imageRequired === 'yes' ? 1 : parseInt(targetForm.get('quantity')?.value || '1', 10) || 1;
  
          if (existingTables[0]?.rows?.length) {
            rowsArray.clear();
            existingTables[0].rows.forEach((row: any) => {
              const newRow = config.rowCreator!(row.type || 'monchon');
              newRow.patchValue(row);
              rowsArray.push(newRow);
            });
            if (rowsArray.length < quantity && imageRequired !== 'yes') {
              this.adjustFormArray(rowsArray, quantity, () => config.rowCreator!('monchon'));
            }
          } else {
            this.adjustFormArray(rowsArray, quantity, () => config.rowCreator!('monchon'));
          }
          break;
        case 'cable':
        case 'thermo':
        case 'coupeCableDansUap':
          const tableQuantity = parseInt(targetForm.get('quantity')?.value || '1', 10) || 1;
          for (let i = 0; i < tableQuantity; i++) {
            const newTable = config.tableCreator();
            if (existingTables[i]) {
              newTable.patchValue({
                cableRef: existingTables[i].cableRef,
                gauge: existingTables[i].gauge,
                thermoRef: existingTables[i].thermoRef,
              });
              const columnsArray = newTable.get('columns') as FormArray;
              columnsArray.clear();
              existingTables[i].columns?.forEach((col: any) => {
                const newColumn = this.fb.group({
                  longueur: [col.longueur || '', Validators.required],
                  quantite: [col.quantite || '', Validators.required],
                });
                columnsArray.push(newColumn);
              });
              if (!columnsArray.length) {
                columnsArray.push(this.createCableColumn());
              }
            }
            tablesArray.push(newTable);
          }
          break;
      }
    }
    this.cdr.detectChanges();
  }

  private adjustFormArray(formArray: FormArray, requiredLength: number, createItem: () => FormGroup): void {
    while (formArray.length < requiredLength) formArray.push(createItem());
    while (formArray.length > requiredLength) formArray.removeAt(formArray.length - 1);
  }

  openOperationModal(index: number): void {
    this.modalOperationIndex = index;
    const operationGroup = this.operations.at(index) as FormGroup;

    this.modalOperationForm = this.fb.group({
      operation: [operationGroup.get('operation')?.value, Validators.required],
      type: [operationGroup.get('type')?.value],
      imageRequired: [operationGroup.get('imageRequired')?.value],
      image: [operationGroup.get('image')?.value],
      tables: this.fb.array([]),
      customOperation: [operationGroup.get('customOperation')?.value || ''],
      customOperationData: [operationGroup.get('customOperationData')?.value || ''],
      customSvgData: [operationGroup.get('customSvgData')?.value || ''],
    });

    if (operationGroup.get('operation')?.value !== 'marquageEtiquette' && operationGroup.get('operation')?.value !== 'marquageLaserTms' && operationGroup.get('operation')?.value !== 'custom') {
      this.modalOperationForm.addControl('quantity', this.fb.control(operationGroup.get('quantity')?.value || '', [Validators.min(1)]));
    }

    const tablesArray = this.modalOperationForm.get('tables') as FormArray;
    const existingTables = (operationGroup.get('tables') as FormArray).controls;

    existingTables.forEach((table: any) => {
      const opType = operationGroup.get('operation')?.value as OperationType;
      const newTable = this.tableConfigs[opType].tableCreator(table.get('type')?.value);
      newTable.patchValue(table.value);
      if (table.get('rows')) {
        const rowsArray = newTable.get('rows') as FormArray;
        (table.get('rows') as FormArray).controls.forEach((row: any) => {
          let newRow: FormGroup;
          if (opType === 'marquageLaserTms') {
            newRow = this.createMarquageLaserTmsRow(table.get('type')?.value);
          } else if (opType === 'custom') {
            newRow = this.fb.group({ customData: [row.value.customData] });
          } else {
            newRow = this.tableConfigs[opType].rowCreator?.(row.get('type')?.value || 'monchon') || this.fb.group(row.value);
          }
          newRow.patchValue(row.value);
          rowsArray.push(newRow);
          if (opType === 'marquageLaserTms' && table.get('type')?.value === 'output') {
            const inputIdx = existingTables.indexOf(table) - 1;
            if (inputIdx >= 0) {
              const inputRow = (existingTables[inputIdx].get('rows') as FormArray).controls[0] as FormGroup;
              const tmsViergeRefControl = inputRow.get('tmsViergeRef');
              const tmsViergeRef1Control = newRow.get('tmsViergeRef1');
              if (tmsViergeRefControl && tmsViergeRef1Control) {
                tmsViergeRef1Control.setValue(tmsViergeRefControl.value);
                tmsViergeRef1Control.disable();
                tmsViergeRefControl.valueChanges.subscribe((value) => {
                  tmsViergeRef1Control.setValue(value);
                });
              }
            }
          }
        });
      }
      if (table.get('columns')) {
        const columnsArray = newTable.get('columns') as FormArray;
        columnsArray.clear();
        (table.get('columns') as FormArray).controls.forEach((col: any) => {
          const newColumn = this.fb.group(col.value);
          columnsArray.push(newColumn);
        });
      }
      tablesArray.push(newTable);
    });

    this.updateTables(index);
    this.updateSelectedCustomOperation();
    this.isModalOpen = true;

    if (this.isCustomOnly) {
      this.modalOperationForm.get('operation')?.disable();
    } else {
      this.modalOperationForm.get('operation')?.enable();
    }

    this.operationTypeSubscription?.unsubscribe();
    this.customOperationSubscription?.unsubscribe();

    const operationControl = this.modalOperationForm.get('operation');
    if (operationControl) {
      this.operationTypeSubscription = operationControl.valueChanges.subscribe((newType) => {
        if (newType === 'marquageEtiquette' || newType === 'marquageLaserTms' || newType === 'custom') {
          this.modalOperationForm?.removeControl('quantity');
        } else if (!this.modalOperationForm?.get('quantity')) {
          this.modalOperationForm?.addControl('quantity', this.fb.control('', [Validators.min(1)]));
        }
        this.updateTables(index);
      });
    }

    const customOperationControl = this.modalOperationForm.get('customOperation');
    if (customOperationControl) {
      this.customOperationSubscription = customOperationControl.valueChanges.subscribe((customOpId) => {
        this.updateSelectedCustomOperation();
        if (this.modalOperationForm?.get('operation')?.value === 'custom') {
          this.updateTables(index);
        }
      });
    }

    const quantityControl = this.modalOperationForm.get('quantity');
    if (quantityControl) {
      quantityControl.valueChanges.subscribe(() => this.updateTables(index));
    }
  }

  onCustomOperationChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const customOpId = selectElement.value;
    if (customOpId && this.modalOperationForm) {
      this.modalOperationForm.get('operation')?.setValue('custom');
      this.modalOperationForm.get('customOperation')?.setValue(customOpId);
      this.updateTables(this.modalOperationIndex!);
    }
  }

  private updateSelectedCustomOperation(): void {
    const customOpId = this.modalOperationForm?.get('customOperation')?.value;
    this.selectedCustomOperation = customOpId
      ? this.customOperations.find(op => op.id === +customOpId) || null
      : null;
    this.cdr.detectChanges();
  }

  closeOperationModal(): void {
    this.isModalOpen = false;
    this.operationTypeSubscription?.unsubscribe();
    this.customOperationSubscription?.unsubscribe();
    this.operationTypeSubscription = null;
    this.customOperationSubscription = null;
    this.modalOperationIndex = null;
    this.modalOperationForm = null;
    this.selectedCustomOperation = null;
    this.isCustomOnly = false;
  }

  saveAndCloseModal(): void {
    if (this.modalOperationIndex === null || !this.modalOperationForm) return;

    const operationGroup = this.operations.at(this.modalOperationIndex) as FormGroup;
    operationGroup.patchValue({
      operation: this.modalOperationForm.get('operation')?.value,
      type: this.modalOperationForm.get('type')?.value,
      imageRequired: this.modalOperationForm.get('imageRequired')?.value,
      image: this.modalOperationForm.get('image')?.value,
      customOperation: this.modalOperationForm.get('customOperation')?.value,
      customOperationData: this.modalOperationForm.get('customOperationData')?.value,
      customSvgData: this.modalOperationForm.get('customSvgData')?.value,
      ...(this.modalOperationForm.get('quantity') && { quantity: this.modalOperationForm.get('quantity')?.value }),
    });

    const tablesArray = operationGroup.get('tables') as FormArray;
    tablesArray.clear();
    const modalTables = (this.modalOperationForm.get('tables') as FormArray).controls;

    let inputTmsViergeRef = '';
    modalTables.forEach((table: any) => {
      const opType = operationGroup.get('operation')?.value as OperationType;
      const tableType = table.get('type')?.value;
      const newTable = this.tableConfigs[opType].tableCreator(tableType);
      newTable.patchValue(table.value);

      if (table.get('rows')) {
        const rowsArray = newTable.get('rows') as FormArray;
        const modalRows = (table.get('rows') as FormArray).controls;

        if (opType === 'marquageLaserTms' && tableType === 'input') {
          inputTmsViergeRef = modalRows[0]?.get('tmsViergeRef')?.value || '';
          modalRows.forEach((row: any) => {
            const newRow = this.createMarquageLaserTmsRow('input');
            newRow.patchValue(row.value);
            rowsArray.push(newRow);
          });
        } else if (opType === 'marquageLaserTms' && tableType === 'output') {
          modalRows.forEach((row: any) => {
            const newRow = this.createMarquageLaserTmsRow('output');
            newRow.patchValue(row.value);
            newRow.get('tmsViergeRef1')?.setValue(inputTmsViergeRef);
            rowsArray.push(newRow);
          });
        } else if (opType === 'custom') {
          modalRows.forEach((row: any) => {
            const newRow = this.fb.group({ customData: [row.get('customData')?.value] });
            rowsArray.push(newRow);
          });
        } else {
          modalRows.forEach((row: any) => {
            const newRow = this.tableConfigs[opType].rowCreator?.(row.get('type')?.value || 'monchon') || this.fb.group(row.value);
            newRow.patchValue(row.value);
            rowsArray.push(newRow);
          });
        }
      }

      if (table.get('columns')) {
        const columnsArray = newTable.get('columns') as FormArray;
        columnsArray.clear();
        (table.get('columns') as FormArray).controls.forEach((col: any) => {
          const colGroup = this.fb.group(col.value);
          columnsArray.push(colGroup);
        });
      }

      tablesArray.push(newTable);
    });

    this.closeOperationModal();
    this.cdr.detectChanges();
  }

  addNewOperation(): void {
    this.isCustomOnly = false;
    this.operations.push(this.createOperation('thermo'));
    this.openOperationModal(this.operations.length - 1);
  }

  addCustomOperation(): void {
    this.isCustomOnly = true;
    const newOperation = this.createOperation('custom');
    this.operations.push(newOperation);
    this.openOperationModal(this.operations.length - 1);
  }

  removeOperation(index: number): void {
    if (this.operations.length > 1) {
      this.operations.removeAt(index);
      this.cdr.detectChanges();
    }
  }

  onFileChange(event: { index: number; file: File }): void {
    const { file, index } = event;
    const reader: FileReader = new FileReader();
    reader.onload = () => {
      const targetForm = this.isModalOpen && this.modalOperationIndex === index ? this.modalOperationForm : this.operations.at(index);
      targetForm?.patchValue({ image: reader.result, imageRequired: 'yes' });
      this.updateTables(index);
    };
    reader.readAsDataURL(file);
  }

  onQuantityChanged(quantity: number, index: number): void {
    this.updateTables(index);
  }

  submitForm(): void {
    this.validateAllFormFields(this.cuttingSheetForm);
    const invalidFields = this.getInvalidFields(this.cuttingSheetForm);

    if (this.cuttingSheetForm.valid) {
      this.isLoading = true;
      this.cdr.detectChanges();

      const formValue = this.cuttingSheetForm.getRawValue();
      const transformedData = this.transformFormValue(formValue);
      transformedData.createdBy = this.loggedInUser || 'unknown';
      transformedData.updatedBy = null;

      transformedData.program = Number(transformedData.program);

      const customOperationIds = formValue.operations
        .filter((op: any) => op.operation === 'custom' && op.customOperation)
        .map((op: any) => Number(op.customOperation))
        .filter((id: number) => !isNaN(id));

      transformedData.customOperations = customOperationIds.length > 0 ? customOperationIds : [];

      console.log('Payload being sent to backend:', JSON.stringify(transformedData, null, 2));

      setTimeout(() => {
        this.cuttingSheetService.createCuttingSheet(transformedData).subscribe({
          next: () => {
            this.isLoading = false;
            this.showResultModal = true;
            this.resultModalTitle = 'Succès';
            this.resultModalMessage = 'Fiche de coupe générée avec succès !';
            this.cuttingSheetForm.reset();
            this.initializeForm();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.isLoading = false;
            this.showResultModal = true;
            this.resultModalTitle = 'Erreur';
            this.resultModalMessage = `Échec de la sauvegarde de la fiche de coupe : ${err.message}`;
            this.cdr.detectChanges();
          },
        });
      }, 4000);
    } else {
      if (invalidFields.length > 0) {
        this.invalidFields = invalidFields;
        this.isInvalidFieldsModalOpen = true;
        this.cdr.detectChanges();
      }
    }
  }

  openRevisionModal(): void {
    this.revisionModalOpen = true;
  }

  closeRevisionModal(): void {
    this.revisionModalOpen = false;
  }

  saveRevision(): void {
    if (this.revisionForm.valid) {
      const revisionData = {
        cuttingSheetId: null,
        newIndice: this.revisionForm.get('newIndice')?.value,
        revisionObject: this.revisionForm.get('revisionObject')?.value,
        updatedBy: this.loggedInUser || 'unknown',
      };
      this.cuttingSheetForm.patchValue({ indice: revisionData.newIndice });
      this.closeRevisionModal();
    }
  }

  closeResultModal(): void {
    this.showResultModal = false;
    this.cdr.detectChanges();
  }

  closeInvalidFieldsModal(): void {
    this.isInvalidFieldsModalOpen = false;
    this.cdr.detectChanges();
  }

  private validateAllFormFields(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
        control.markAsDirty({ onlySelf: true });
        control.updateValueAndValidity();
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.validateAllFormFields(control);
      }
    });
  }

  private getInvalidFields(formGroup: FormGroup | FormArray, path: string = ''): { operation: string; table: number; row?: number; field: string }[] {
    const invalidFields: { operation: string; table: number; row?: number; field: string }[] = [];
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      const currentPath = path ? `${path}.${field}` : field;
      if (control instanceof FormControl) {
        if (control.invalid && control.errors) {
          const fieldInfo = this.extractFieldInfo(currentPath);
          invalidFields.push(fieldInfo);
        }
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        invalidFields.push(...this.getInvalidFields(control, currentPath));
      }
    });
    return invalidFields;
  }

  private extractFieldInfo(path: string): { operation: string; table: number; row?: number; field: string } {
    const pathParts = path.split('.');
    let operationName = 'Formulaire Principal';
    let tableIndex = -1;
    let rowIndex: number | undefined = undefined;
    let fieldName = pathParts[pathParts.length - 1];

    if (pathParts[0] === 'operations' && pathParts.length > 1) {
      const opIndex = parseInt(pathParts[1], 10);
      operationName = this.getOperationLabel(this.operations.at(opIndex)?.get('operation')?.value || 'unknown');
      if (pathParts[2] === 'tables' && pathParts.length > 3) {
        tableIndex = parseInt(pathParts[3], 10);
        if (pathParts[4] === 'rows' && pathParts.length > 5) {
          rowIndex = parseInt(pathParts[5], 10);
          fieldName = pathParts.slice(6).join('.');
        } else {
          fieldName = pathParts.slice(4).join('.');
        }
      } else if (pathParts[2] !== 'tables') {
        fieldName = pathParts.slice(2).join('.');
      }
    }

    const fieldLabel = this.getFieldLabel(fieldName);
    return { operation: operationName, table: tableIndex, row: rowIndex, field: fieldLabel };
  }

  private getFieldLabel(fieldName: string): string {
    switch (fieldName) {
      case 'article': return 'Article';
      case 'programme': return 'Programme';
      case 'indice': return 'Indice';
      case 'type': return 'Type';
      case 'hasSerialNumber': return 'Numéro de série';
      case 'operation': return 'Type d\'Opération';
      case 'quantity': return 'Quantité';
      case 'cableRef': return 'Référence Câble';
      case 'gauge': return 'Jauge';
      case 'longueur': return 'Longueur';
      case 'quantite': return 'Quantité';
      case 'thermoRef': return 'Référence Thermo';
      case 'tmsVierges': return 'TMS Vierges';
      case 'origine': return 'Origine';
      case 'programmeImpression': return 'Programme d\'Impression';
      case 'qteUnit': return 'Quantité Unitaire';
      case 'manchon': return 'Manchon';
      case 'collierRef': return 'Référence Collier';
      case 'monchonRef': return 'Référence Manchon';
      case 'programmeLaser': return 'Programme Laser';
      case 'etiquetteRef': return 'Référence Étiquette';
      case 'qte': return 'Quantité';
      case 'bobine': return 'Bobine';
      case 'emplacement': return 'Emplacement';
      case 'tmsViergeRef': return 'Référence TMS Vierge';
      case 'tmsViergeRef1': return 'Référence TMS Vierge 1';
      case 'texteDeMarquage': return 'Texte de Marquage';
      case 'quantiteUnitaire': return 'Quantité Unitaire';
      case 'positionDeMarquage': return 'Position de Marquage';
      case 'programme': return 'Programme';
      case 'quantiteAImprimer': return 'Quantité à Imprimer';
      case 'customOperation': return 'Opération Personnalisée';
      case 'customData': return 'Données Personnalisées';
      default: return fieldName || 'Champ Inconnu';
    }
  }

  public getOperationLabel(operationType: string): string {
    if (operationType === 'custom') {
      const customOpId = this.modalOperationForm?.get('customOperation')?.value || 
                        this.operations.controls[this.modalOperationIndex ?? 0]?.get('customOperation')?.value;
      const customOp = this.customOperations.find(op => op.id === +customOpId);
      return customOp ? customOp.name : 'Opération Personnalisée';
    }
    switch (operationType) {
      case 'cable': return 'Câble';
      case 'thermo': return 'Thermo';
      case 'tms': return 'Marquage TMS';
      case 'monchon': return 'Manchon Vierge';
      case 'marquageLaser': return 'Marquage Laser';
      case 'marquageEtiquette': return 'Marquage Étiquette';
      case 'kittingCablage': return 'Kitting Câblage/Thermo';
      case 'coupeCableDansUap': return 'Coupe Câble dans UAP';
      case 'marquageLaserTms': return 'Marquage Laser TMS';
      default: return 'Non Sélectionné';
    }
  }

  private transformFormValue(formValue: any): any {
    const transformed = { ...formValue };
    transformed.program = transformed.programme;
    delete transformed.programme;

    transformed.operations = transformed.operations.map((op: any) => {
      const operationData = {
        operation: op.operation,
        type: op.type,
        imageRequired: op.imageRequired,
        image: op.image,
      };
      if (op.operation !== 'marquageEtiquette' && op.operation !== 'marquageLaserTms' && op.operation !== 'custom') {
        (operationData as any).quantity = op.quantity || 1;
      }
      if (op.operation === 'custom') {
        (operationData as any).customOperation = op.customOperation;
        (operationData as any).customOperationData = op.customOperationData || '';
        (operationData as any).customSvgData = op.customSvgData || '';
      }
      (operationData as any).tables = op.tables.map((tableData: any) => ({
        ...tableData,
        ...(tableData.rows && { rows: tableData.rows.map((row: any) => ({ ...row })) }),
        ...(tableData.columns && { columns: tableData.columns.map((col: any) => ({ ...col })) }),
      }));
      return operationData;
    });
    return transformed;
  }

  onOverlayAnimationStart(event: AnimationEvent): void {}
  onOverlayAnimationDone(event: AnimationEvent): void {}
  onPopupAnimationStart(event: AnimationEvent): void {}
  onPopupAnimationDone(event: AnimationEvent): void {}
  onResultAnimationStart(event: AnimationEvent): void {}
  onResultAnimationDone(event: AnimationEvent): void {}
  onInvalidFieldsAnimationStart(event: AnimationEvent): void {}
  onInvalidFieldsAnimationDone(event: AnimationEvent): void {}
}