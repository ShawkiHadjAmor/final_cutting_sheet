import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewListOfComponent } from './components/view-list-of/view-list-of.component';
import { OfHistoryComponent } from './components/of-history/of-history.component';

const routes: Routes = [
  { path: 'view-list', component: ViewListOfComponent },
  { path: 'prepared-time', component: OfHistoryComponent }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CmlRoutingModule { }