import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { SerialNumbersRoutingModule } from './serial-numbers-routing.module';
import { DisplaySerialNumbersComponent } from './components/display-serial-numbers/display-serial-numbers.component';

@NgModule({
  declarations: [
    DisplaySerialNumbersComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    SerialNumbersRoutingModule
  ]
})
export class SerialNumbersModule { }