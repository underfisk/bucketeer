import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { SigninModule } from './signin/signin.module'
import { SignupModule } from './signup/signup.module'
import { AppRoutingModule } from './app-routing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store'
import { cloudStorageReducer } from './store/cloud-storage/cloud-storage.reducer'
import { localStorageReducer } from './store/local-storage/local-storage.reducer'
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { AppConfig } from '../environments/environment'; 
import { MaterialModule } from './shared/material.module';
import { ElectronService } from './core/services';

@NgModule({
   declarations: [
      AppComponent,
   ],
   imports: [
      BrowserModule,
      FormsModule,
      CoreModule,
      SharedModule,
      DashboardModule,
      SigninModule,
      SignupModule,
      AppRoutingModule,
      StoreModule.forRoot({ cloudStorage: cloudStorageReducer, localStorage: localStorageReducer }),
      StoreDevtoolsModule.instrument({
         maxAge: 25, // Retains last 25 states
         logOnly: AppConfig.production, // Restrict extension to log-only mode
       }),
       MaterialModule
   ],
  providers: [ElectronService],
  bootstrap: [AppComponent]
})
export class AppModule {}
