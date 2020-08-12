import { Injectable } from '@angular/core';
import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js"
import {Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userPool: CognitoUserPool;
  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      ClientId: process.env.COGNITO_CLIENT_ID,
    });
  }

  isAuthenticated() {
    return !!this.userPool.getCurrentUser();
  }
  
  getCurrentUser() {
    return this.userPool.getCurrentUser();
  }
  
  logout(){
    const currentUser = this.getCurrentUser()
    if (!currentUser){
      return 
    }
    currentUser.signOut()
  }

  signUp(
    email: string,
    password: string,
    phone?: string
  ){
    return new Observable(subscriber=> {
      this.userPool.signUp(
        email,
        password,
        phone ? [ new CognitoUserAttribute({
          Name: "phone",
          Value: phone as string,
        })] : [],
        [],
        async (err, res) => {
          if (err) {
            return subscriber.error(err.message)
          }
          subscriber.complete()
        }
      );
    })
  }

  signIn(email: string, password: string){
      return new Observable(subscriber=> {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: this.userPool,
        });
        const authenticationDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        })
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: () => {
            subscriber.complete()
          },
          onFailure: (err) => {
            subscriber.error(err.message)
          },
          newPasswordRequired: () => {
            subscriber.error("Please reset your password" )
          },
        });
      })
  }
}
