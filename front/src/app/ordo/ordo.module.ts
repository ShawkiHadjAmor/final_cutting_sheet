import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdoRoutingModule } from './ordo-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LaunchOfComponent } from './components/launch-of/launch-of.component';



@NgModule({
  declarations: [
    LaunchOfComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    OrdoRoutingModule
  ]
})
export class OrdoModule { }
