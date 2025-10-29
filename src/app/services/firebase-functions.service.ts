import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { Observable } from 'rxjs';

export interface RegisterUserRequest {
  nombre: string;
  apellidos?: string;
  correo: string;
  password: string;
  roleId: number;
}

export interface RegisterUserResponse {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseFunctionsService {

  constructor(private functions: AngularFireFunctions) {}

  /**
   * Registrar un nuevo usuario usando la función registerUser
   */
  registerUser(userData: RegisterUserRequest): Observable<RegisterUserResponse> {
    console.log(userData);
    
    const registerUserFunction = this.functions.httpsCallable('registerUser');
    console.log(registerUserFunction);
    
    return registerUserFunction(userData);
  }
  
  registerUser2(userData: RegisterUserRequest): Observable<RegisterUserResponse> {
    console.log(userData);
    
    const registerUserFunction = this.functions.httpsCallable('registerUser');
    console.log(registerUserFunction);
    
    return registerUserFunction(userData);
  }
}
