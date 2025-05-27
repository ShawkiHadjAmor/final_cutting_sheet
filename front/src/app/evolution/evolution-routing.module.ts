import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateEvolutionComponent } from './components/create-evolution/create-evolution.component';
import { RoleGuard } from '../authentification/guard/RoleGuard';
import { UpdateEvolutionComponent } from './components/update-evolution/update-evolution.component';
import { OrdoUpdateEvolutionComponent } from './components/ordo-update-evolution/ordo-update-evolution.component';
import { ListEvolutionsComponent } from './components/list-evolutions/list-evolutions.component';

const routes: Routes = [
  {
    path: 'create',
    component: CreateEvolutionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['QUALITY'] }
  },
  {
    path: 'update',
    component: UpdateEvolutionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['QUALITY'] }
  },
  {
    path: 'ordo-update',
    component: OrdoUpdateEvolutionComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORDO'] }
  },
  {
    path: 'list',
    component: ListEvolutionsComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORDO',"ENGINEER","QUALITY"] }
  },
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EvolutionRoutingModule {}