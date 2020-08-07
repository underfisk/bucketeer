import { Injectable } from '@angular/core';
import {
  CognitoUserPool,
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js"

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
    return this.userPool.getCurrentUser() !== null;
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
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
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
            console.error(err);
            return resolve({ success: false, error: err.message });
          }
          console.log(res)
          resolve({ success: true });
        }
      );
    });
  }

  signIn(email: string, password: string): Promise<{ success: boolean, error?: string}>{
    try {
      return new Promise((resolve) => {
        console.log("Authenticating..")
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
            resolve({ success: true });
          },
          onFailure: (err) => {
            resolve({ success: false, error: err });
          },
          newPasswordRequired: () => {
            resolve({ success: false, error: "Please reset your password" });
          },
        });
      })
    }
    catch(ex){

    }
  }
}
