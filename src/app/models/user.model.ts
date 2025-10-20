export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  deviceToken?: string; // Para notificaciones push
}

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}
