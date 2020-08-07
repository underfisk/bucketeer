import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthGuard } from '../core/services/auth-service/auth.guard';
import { LocalExplorerComponent } from '../local-explorer/local-explorer.component';
import { CloudExplorerComponent } from 'app/cloud-explorer/cloud-explorer.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'cloud', component: CloudExplorerComponent },
      { path: 'local', component: LocalExplorerComponent },
      // { path: 'bin', component: BinExplorerComponent }
    ]
  }
];

@NgModule({
  declarations: [],
  providers: [AuthGuard],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
