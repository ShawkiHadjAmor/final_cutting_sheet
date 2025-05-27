import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { StoreRoutingModule } from './store-routing.module';
import { ListOfComponent } from './components/list-of/list-of.component';
import { StorePreparationTimeComponent } from './components/store-preparation-time/store-preparation-time.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    ListOfComponent,
    StorePreparationTimeComponent
  ],
  imports: [
    CommonModule,
    FormsModule, // Add FormsModule
    StoreRoutingModule,
    HttpClientModule
  ]
})
export class StoreModule { }