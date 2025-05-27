import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateProgramComponent } from './components/create-program/create-program.component';
import { UpdateProgramComponent } from './components/update-program/update-program.component';
import { ViewAllProgramsComponent } from './components/view-all-programs/view-all-programs.component';

const routes: Routes = [
  { path: 'create', component: CreateProgramComponent },
  { path: 'update', component: UpdateProgramComponent },
  { path: 'view', component: ViewAllProgramsComponent },
  { path: '', redirectTo: 'view', pathMatch: 'full' } // Default to view all programmes
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgrammeRoutingModule { }