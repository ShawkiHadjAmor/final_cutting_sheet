import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ProgrammeRoutingModule } from './program-routing.module';
import { CreateProgramComponent } from './components/create-program/create-program.component';
import { UpdateProgramComponent } from './components/update-program/update-program.component';
import { ViewAllProgramsComponent } from './components/view-all-programs/view-all-programs.component';

@NgModule({
  declarations: [
    CreateProgramComponent,
    UpdateProgramComponent,
    ViewAllProgramsComponent
  ],
  imports: [
    CommonModule,
    ProgrammeRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class ProgrammeModule { }