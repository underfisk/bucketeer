import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth-service/auth.service'
import {FormControl, FormGroupDirective, NgForm, Validators, FormGroup, FormBuilder} from '@angular/forms';
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
export class SigninComponent implements OnInit {
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);
  matcher = new MyErrorStateMatcher();
  constructor(
    private readonly router: Router,
    private readonly cognitoService: AuthService,
    private readonly formBuilder: FormBuilder
  ) { 

  }

  ngOnInit(): void {
  }

  async onSubmit(){
    const result = await this.cognitoService.signIn( this.emailFormControl.value, this.passwordFormControl.value)
    if (!result.success){
      return console.error(result.error)
    }
    
    this.router.navigate(['/'])
  }

}
