import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RoleGuard } from '../authentification/guard/RoleGuard';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ENGINEER', 'ORDO', 'CML', 'STOREKEEPER', 'QUALITY'] },
    children: [
      {
        path: 'cutting-sheet',
        canActivate: [RoleGuard],
        data: { roles: ['ENGINEER', 'ORDO', 'CML'] },
        loadChildren: () =>
          import('../cutting-sheet/cutting-sheet.module').then(
            (m) => m.CuttingSheetModule
          )
      },
      {
        path: 'programs',
        canActivate: [RoleGuard],
        data: { roles: ['ENGINEER'] },
        loadChildren: () =>
          import('../program/program.module').then(
            (m) => m.ProgrammeModule
          )
      },
      {
        path: 'launch-of',
        canActivate: [RoleGuard],
        data: { roles: ['ORDO'] },
        loadChildren: () =>
          import('../ordo/ordo.module').then(
            (m) => m.OrdoModule
          )
      },
      {
        path: 'cml',
        canActivate: [RoleGuard],
        data: { roles: ['CML'] },
        loadChildren: () =>
          import('../cml/cml.module').then(
            (m) => m.CmlModule
          )
      },
      {
        path: 'store',
        canActivate: [RoleGuard],
        data: { roles: ['STOREKEEPER'] },
        loadChildren: () =>
          import('../store/store.module').then(
            (m) => m.StoreModule
          )
      },
      {
        path: 'serial-numbers',
        canActivate: [RoleGuard],
        data: { roles: ['ENGINEER', 'ORDO', 'CML'] },
        loadChildren: () =>
          import('../serial-numbers/serial-numbers.module').then(
            (m) => m.SerialNumbersModule
          )
      },
      {
        path: 'article-increment',
        canActivate: [RoleGuard],
        data: { roles: ['ENGINEER'] },
        loadChildren: () =>
          import('../article-increment/article-increment.module').then(
            (m) => m.ArticleIncrementModule
          )
      },
      {
        path: 'quality',
        canActivate: [RoleGuard],
        data: { roles: ['QUALITY'] },
        loadChildren: () =>
          import('../quality/quality.module').then(
            (m) => m.QualityModule
          )
      },
      {
        path: 'evolutions',
        canActivate: [RoleGuard],
        data: { roles: ['QUALITY', 'ENGINEER', 'ORDO'] },
        loadChildren: () =>
          import('../evolution/evolution.module').then(
            (m) => m.EvolutionModule
          )
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutsRoutingModule {}