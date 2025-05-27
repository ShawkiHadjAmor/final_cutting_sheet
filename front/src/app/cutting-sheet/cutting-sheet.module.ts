import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CuttingSheetRoutingModule } from './cutting-sheet-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { CableOperationComponent } from './operations/cable-operation/cable-operation.component';
import { ThermoOperationComponent } from './operations/thermo-operation/thermo-operation.component';
import { TmsOperationComponent } from './operations/tms-operation/tms-operation.component';
import { MonchonOperationComponent } from './operations/monchon-operation/monchon-operation.component';
import { MarquageLaserOperationComponent } from './operations/marquage-laser-operation/marquage-laser-operation.component';
import { MarquageEtiquetteOperationComponent } from './operations/marquage-etiquette-operation/marquage-etiquette-operation.component';
import { KittingCablageOperationComponent } from './operations/kitting-cablage-operation/kitting-cablage-operation.component';
import { CuttingSheetListComponent } from './components/cutting-sheet-list/cutting-sheet-list.component';
import { UpdateCuttingSheetComponent } from './components/update-cutting-sheet/update-cutting-sheet.component';
import { CoupeCableDansUapComponent } from './operations/coupe-cable-dans-uap/coupe-cable-dans-uap.component';
import { MarquageLaserTmsOperationComponent } from './operations/marquage-laser-tms/marquage-laser-tms.component';
import { InvalidFieldsModalComponent } from './modals/invalid-fields-modal/invalid-fields-modal.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KonvaModule } from 'ng2-konva';
import { AgGridModule } from 'ag-grid-angular';
import { CreateCuttingSheetComponent } from './components/create-cutting-sheet/create-cutting-sheet.component';
import { CustomOperationComponent } from './operations/custom-operation/custom-operation.component';
import { LayoutsModule } from '../layouts/layouts.module';

@NgModule({
  declarations: [
    CreateCuttingSheetComponent,
    CableOperationComponent,
    ThermoOperationComponent,
    TmsOperationComponent,
    MonchonOperationComponent,
    MarquageLaserOperationComponent,
    MarquageEtiquetteOperationComponent,
    KittingCablageOperationComponent,
    CuttingSheetListComponent,
    UpdateCuttingSheetComponent,
    CoupeCableDansUapComponent,
    MarquageLaserTmsOperationComponent,
    InvalidFieldsModalComponent,
    CustomOperationComponent 
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    CuttingSheetRoutingModule,
    ReactiveFormsModule,
    DragDropModule,
    FormsModule,
    KonvaModule,
    LayoutsModule, 
    AgGridModule
  ],
  exports: [
    CreateCuttingSheetComponent,
    CuttingSheetListComponent,
    UpdateCuttingSheetComponent
  ]
})
export class CuttingSheetModule {}