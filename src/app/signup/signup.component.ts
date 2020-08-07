import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth-service/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);

  constructor(
    private readonly router: Router,
    private readonly cognitoService: AuthService,
    private readonly formBuilder: FormBuilder
  ) { 
  }

  ngOnInit(): void {
  }

  async onSubmit(){

    const email = this.emailFormControl.value
    const password = this.passwordFormControl.value
    const result = await this.cognitoService.signUp(email, password)
    if (!result.success){
      return console.error(result.error)
    }
    
    const authResult = await this.cognitoService.signIn(email, password)
    console.log("Authenticated?")
    console.log(authResult)
    if (authResult.success){
        this.router.navigate(['/'])
    } else {
        console.error("No auth")
    }
  }
}
