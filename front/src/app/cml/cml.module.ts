import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmlRoutingModule } from './cml-routing.module';
import { ViewListOfComponent } from './components/view-list-of/view-list-of.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { OfHistoryComponent } from './components/of-history/of-history.component';

@NgModule({
  declarations: [
    ViewListOfComponent,
    OfHistoryComponent

  ],
  imports: [
    CommonModule,
    CmlRoutingModule,
    HttpClientModule
  ]
})
export class CmlModule { }