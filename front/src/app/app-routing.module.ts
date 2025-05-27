import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomOperationComponent } from './cutting-sheet/operations/custom-operation/custom-operation.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'authentification/login',
    pathMatch: 'full'
  },
  {
    path: 'authentification',
    loadChildren: () => import('./authentification/authentification.module').then(m => m.AuthentificationModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./layouts/layouts.module').then(m => m.LayoutsModule)
  },
  { path: 'custom-operation', component: CustomOperationComponent }, // Standalone route
  { path: '**', redirectTo: 'authentification/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }