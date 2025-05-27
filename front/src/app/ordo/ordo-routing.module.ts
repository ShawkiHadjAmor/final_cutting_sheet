import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LaunchOfComponent } from './components/launch-of/launch-of.component';

const routes: Routes = [
  { path: '', component: LaunchOfComponent },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdoRoutingModule { }
