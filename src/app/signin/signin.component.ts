import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth-service/auth.service'
import {FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit{
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);
  matcher = new MyErrorStateMatcher();
  latestError?: string
  isAuthenticating?: boolean
  isRememberChecked: boolean = false

  constructor(
    private readonly router: Router,
    private readonly cognitoService: AuthService
  ) {}

  onRememberChange(isChecked: boolean) {
    this.isRememberChecked = isChecked
  }
  ngOnInit() {
    const savedEmail = localStorage.getItem('email-remember')
    this.isRememberChecked = !!savedEmail
    if (savedEmail){
      this.emailFormControl.setValue(savedEmail)
    }
  }

  async onSubmit(){
    this.isAuthenticating = true
    this.cognitoService.signIn( this.emailFormControl.value, this.passwordFormControl.value)
      .subscribe({
          error: error => {
            this.isAuthenticating = false
            setTimeout(() => {
              this.latestError = undefined
            }, 2000)
            return this.latestError = error
          },
          complete: () => {
            if (this.isRememberChecked){
              localStorage.setItem('email-remember', this.emailFormControl.value )
            }
            this.isAuthenticating = false
            return this.router.navigate(['/'])
          }
      })
  }

}
