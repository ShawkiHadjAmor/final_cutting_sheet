import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisplaySerialNumbersComponent } from './components/display-serial-numbers/display-serial-numbers.component';

const routes: Routes = [
  { path: 'list', component: DisplaySerialNumbersComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SerialNumbersRoutingModule { }