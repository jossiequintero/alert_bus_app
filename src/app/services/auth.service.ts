import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Cargar usuario desde localStorage si existe
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(email: string, password: string, role: 'usuario' | 'chofer'): Observable<User> {
    // Simulación de login - en producción esto sería una llamada HTTP
    return new Observable(observer => {
      setTimeout(() => {
        const user: User = {
          id: this.generateId(),
          email,
          name: email.split('@')[0],
          role,
          createdAt: new Date()
        };
        
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        observer.next(user);
        observer.complete();
      }, 1000);
    });
  }

  register(email: string, password: string, name: string, role:string ): Observable<User> {
    // Simulación de registro - en producción esto sería una llamada HTTP
    return new Observable(observer => {
      setTimeout(() => {
        const user: User = {
          id: this.generateId(),
          email,
          name,
          role,
          createdAt: new Date()
        };
        
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        observer.next(user);
        observer.complete();
      }, 1000);
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
