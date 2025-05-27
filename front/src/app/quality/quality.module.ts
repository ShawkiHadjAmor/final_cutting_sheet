import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityRoutingModule } from './quality-routing.module';
import { ListCuttingSheetComponent } from './components/list-cutting-sheet/list-cutting-sheet.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    ListCuttingSheetComponent
  ],
  imports: [
    CommonModule,
    QualityRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ]
})
export class QualityModule { }