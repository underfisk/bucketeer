import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { SignupComponent } from './signup.component'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { AuthService } from '../core/services/auth-service/auth.service'
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../shared/material.module';

@NgModule({
  declarations: [SignupComponent],
  providers: [AuthService],
  imports: [
      CommonModule, 
      SharedModule,
      NgbModule,
      ReactiveFormsModule,
      RouterModule,
      MatFormFieldModule,
      MaterialModule
    ],
})
export class SignupModule {}
