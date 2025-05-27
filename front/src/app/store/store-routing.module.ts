import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListOfComponent } from './components/list-of/list-of.component';
import { StorePreparationTimeComponent } from './components/store-preparation-time/store-preparation-time.component';

const routes: Routes = [
  { path: 'list', component: ListOfComponent },
  { path: 'preparation-time', component: StorePreparationTimeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreRoutingModule { }