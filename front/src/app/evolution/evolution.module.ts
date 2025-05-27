import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EvolutionRoutingModule } from './evolution-routing.module';
import { CreateEvolutionComponent } from './components/create-evolution/create-evolution.component';
import { UpdateEvolutionComponent } from './components/update-evolution/update-evolution.component';
import { ListEvolutionsComponent } from './components/list-evolutions/list-evolutions.component';
import { OrdoUpdateEvolutionComponent } from './components/ordo-update-evolution/ordo-update-evolution.component';

@NgModule({
  declarations: [
    CreateEvolutionComponent,
    UpdateEvolutionComponent,
    ListEvolutionsComponent,
    OrdoUpdateEvolutionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EvolutionRoutingModule
  ]
})
export class EvolutionModule { }