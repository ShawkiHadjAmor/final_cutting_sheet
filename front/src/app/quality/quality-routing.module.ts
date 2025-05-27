import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListCuttingSheetComponent } from './components/list-cutting-sheet/list-cutting-sheet.component';
import { RoleGuard } from '../authentification/guard/RoleGuard';

const routes: Routes = [
  {
    path: 'list',
    component: ListCuttingSheetComponent,
    canActivate: [RoleGuard],
    data: { roles: ['QUALITY'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QualityRoutingModule { }