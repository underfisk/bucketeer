import { Component } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth-service/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);

  isCreating: boolean
  latestError?: string
  constructor(
    private readonly router: Router,
    private readonly cognitoService: AuthService
  ) { 
  }
  async onSubmit(){
    const email = this.emailFormControl.value
    const password = this.passwordFormControl.value
    this.isCreating = true
    this.cognitoService.signUp(email, password)
      .subscribe({
        error: error => {
          setTimeout(() => this.latestError = undefined, 2000)
          this.isCreating = false
          return this.latestError = error
        },
        complete: () => {
          this.cognitoService.signIn(email,password)
            .subscribe({
              error: error => {
                setTimeout(() => this.latestError = undefined, 2000)
                this.isCreating = false
                return this.latestError = error
              },
              complete: () => {
                this.isCreating = false
                return this.router.navigate(['/'])
              }
            })
        }
      })
  }
}
