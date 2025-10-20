export interface Alert {
  id: string;
  userId: string;
  busId: string;
  stopId: string;
  routeId: string;
  alertType: 'proximity' | 'arrival' | 'delay';
  message: string;
  isRead: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  distance?: number; // distancia en metros
}

export interface AlertSettings {
  userId: string;
  proximityRadius: number; // radio en metros para alertas de proximidad
  advanceTime: number; // minutos de anticipación para alertas de llegada
  isEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}
