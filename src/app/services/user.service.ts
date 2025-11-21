import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}user/all`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener usuarios');
        }

        return response.data.map(user => this.mapUser(user));
      })
    );
  }

  getDrivers(): Observable<User[]> {
    return this.getAllUsers().pipe(
      map(users => users.filter(user => user.roleId === 2))
    );
  }

  private mapUser(data: any): User {
    let createdAt: Date | undefined;
    const timestamp = data.fecha_registro || data.createdAt;

    if (timestamp?.toDate) {
      createdAt = timestamp.toDate();
    } else if (timestamp?.seconds) {
      createdAt = new Date(timestamp.seconds * 1000);
    }

    return {
      id: data.user_id || data.id,
      correo: data.correo,
      nombre: data.nombre,
      apellldo: data.apellidos,
      roleId: data.rol_id,
      createdAt,
    };
  }
}

