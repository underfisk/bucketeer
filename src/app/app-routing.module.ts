import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';

import { DashboardRoutingModule } from './dashboard/dashboard-routing.module';
import { SigninComponent } from './signin/signin.component';
import { AuthGuard } from './core/services/auth-service/auth.guard'
import { GuestGuard } from './core/services/auth-service/guest.guard'
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/cloud',
    pathMatch: 'full',
    canActivate: [AuthGuard]
  },
  {
    path: 'signin',
    pathMatch: 'full',
    component: SigninComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'signup',
    pathMatch: 'full',
    component: SignupComponent,
    canActivate: [GuestGuard]
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  }
];

@NgModule({
  providers: [
    AuthGuard,
    GuestGuard
  ],
  imports: [
    RouterModule.forRoot(routes),
    DashboardRoutingModule,
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
