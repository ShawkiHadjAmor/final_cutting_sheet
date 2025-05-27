import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CuttingSheetListComponent } from './components/cutting-sheet-list/cutting-sheet-list.component';
import { UpdateCuttingSheetComponent } from './components/update-cutting-sheet/update-cutting-sheet.component';
import { CreateCuttingSheetComponent } from './components/create-cutting-sheet/create-cutting-sheet.component';

const routes: Routes = [
  { path: 'create', component: CreateCuttingSheetComponent },
  { path: 'view', component: CuttingSheetListComponent },
  { path: 'update', component: UpdateCuttingSheetComponent },
  { path: 'update/:id', component: UpdateCuttingSheetComponent },
  { path: '', redirectTo: 'view', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CuttingSheetRoutingModule { }