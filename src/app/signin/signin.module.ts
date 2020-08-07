import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { SigninComponent } from './signin.component'
import { AuthService } from '../core/services/auth-service/auth.service'
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field'
import { MaterialModule } from 'app/shared/material.module';

@NgModule({
  declarations: [SigninComponent],
  providers: [AuthService],
  imports: [
      CommonModule, 
      SharedModule,
      ReactiveFormsModule,
      RouterModule,
      MatFormFieldModule,
      MaterialModule
    ],
})
export class SigninModule {}
