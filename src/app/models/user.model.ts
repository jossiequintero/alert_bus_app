export interface User {
  id: string;
  email: string;
  name: string;
  lastname?: string;
  roleId: number;
  createdAt: Date;
  deviceToken?: string; // Para notificaciones push
}

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}
