export interface User {
  id: string;
  correo: string;
  nombre?: string;
  apellldo?: string;
  roleId?: number;
  createdAt?: Date;
  contraseña?: string;
  deviceToken?: string; // Para notificaciones push
}

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}
