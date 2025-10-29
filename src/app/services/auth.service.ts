import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { FirebaseFunctionsService, RegisterUserRequest } from './firebase-functions.service';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private rolMapping: any  = {
    'pasajero': 1,
    'conductor': 2,
    'admin': 3
  };

  constructor(private firebaseFunctions: FirebaseFunctionsService) {
    // Cargar usuario desde localStorage si existe
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string, role: string): Observable<User> {
    // Simulación de login - en producción esto sería una llamada HTTP
    return new Observable(observer => {
      setTimeout(() => {
 

        const user: User = {
          id: this.generateId(),
          email,
          name: 'Usuario',
          lastname: 'Prueba',
          roleId: this.rolMapping[role] || this.rolMapping['pasajero'],
          createdAt: new Date()
        };
        
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        observer.next(user);
        observer.complete();
      }, 1000);
    });
  }

  register(email: string, password: string, name: string, lastname: string, role: string): Observable<User> {
    return new Observable(observer => {
      // Mapear roles a números según la función registerUser
 
      const userData: RegisterUserRequest = {
        nombre: name,
        apellidos: lastname,
        correo: email,
        password: password,
        roleId: this.rolMapping[role] || this.rolMapping['pasajero']
      };

      this.firebaseFunctions.registerUser(userData).subscribe({
        next: (response) => {
          if (response.success) {
            const user: User = {
              id: response.data.user_id,
              email,
              name,
              lastname,
              roleId: this.rolMapping[role] || this.rolMapping['pasajero'],
              createdAt: new Date()
            };
            
            this.currentUserSubject.next(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            observer.next(user);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Error al registrar usuario'));
          }
        },
        error: (error) => {
          console.error('Error en registro:', error);
          observer.error(new Error('Error de conexión al registrar usuario'));
        }
      });
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
