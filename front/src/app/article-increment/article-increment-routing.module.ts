import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleGuard } from '../authentification/guard/RoleGuard';
import { CreateArticleIncrementComponent } from './components/create-article-increment/create-article-increment.component';
import { ListArticleIncrementComponent } from './components/list-article-increment/list-article-increment.component';

const routes: Routes = [
  {
    path: 'create',
    component: CreateArticleIncrementComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ENGINEER'] }
  },
  {
    path: 'list',
    component: ListArticleIncrementComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ENGINEER'] }
  },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ArticleIncrementRoutingModule { }