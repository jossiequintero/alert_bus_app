import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private rolMapping: any = {
    'pasajero': 1,
    'conductor': 2,
    'admin': 3
  };

  // 👇 URL base definida en environment.ts
  private apiUrl = environment.apiUrl; // Ej: 'https://api-unsbbqln3q-uc.a.run.app'

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // 🔹 Login simulado (puedes reemplazarlo con un endpoint real más adelante)
  login(email: string, password: string): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const user = {
          correo: email,
          contraseña: password
        };
        
        this.http.post<any>(`${this.apiUrl}user/login`, user).subscribe({
          next: (response)=>{
            const userData = response.data
           
            const user: User = {
              id: userData.user_id,
              correo: userData.correo,
              nombre: userData.nombre,
              apellldo: userData.apellido,
              roleId: userData.rol_id,
            };
            console.log("login:", user);
            
            this.currentUserSubject.next(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            observer.next(user);
            observer.complete();
          }
        });

      }, 1000);
    });
  }

  // 🔹 Registro usando la API REST de Firebase Functions
  register(email: string, password: string, name: string, lastname: string, role: string): Observable<User> {
    return new Observable(observer => {
      
      const roleId = this.rolMapping[role] || this.rolMapping['pasajero'];
      const uid = uuidv4();

      const userData = {
        user_id: uid,
        nombre: name,
        apellidos: lastname,
        correo: email,
        contraseña: password,
        rol_id: roleId
      };
      /*
      this.http.get<any>(`${this.apiUrl}user/all`).subscribe({
        next: (response) =>{
          if (response.success) {
             const user: User = {
              id: userData.user_id,
              correo,
              nombre,
              apellido,
              roleId,
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
          console.error('❌ Error al registrar usuario:', error);
          observer.error(new Error('Error de conexión con el servidor'));
        
        }
      })

      */

      // 🔥 Llamada HTTP al endpoint de tu API
      this.http.post<any>(`${this.apiUrl}user/registrar`, userData).subscribe({
        next: (response) => {
          if (response.success) {
            const user: User = {
              id: userData.user_id,
              correo: email,
              nombre: name,
              apellldo: lastname,
              roleId,
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
          console.error('❌ Error al registrar usuario:', error);
          observer.error(new Error('Error de conexión con el servidor'));
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
    return Math.random().toString(36).substring(2, 10);
  }
}
