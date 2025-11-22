import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private currentLocationSubject = new BehaviorSubject<Location | null>(null);
  public currentLocation$ = this.currentLocationSubject.asObservable();

  constructor() {}

  async getCurrentPosition(): Promise<Location> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000, // 30 segundos
        maximumAge: 60000 // 1 minuto
      });
      console.log({coordinates});
      const location: Location = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: new Date(coordinates.timestamp)
      };

      this.currentLocationSubject.next(location);
      return location;
    } catch (error:any) {
      console.error('Error obteniendo ubicación:', error);
      let errorMessage = 'Error desconocido';
      
      if (error.code === 1) {
        errorMessage = "Debes habilitar la ubicación para usar esta función.";
      } else if (error.code === 2) {
        errorMessage = '📡 Posición no disponible (sin GPS o simulador).';
      } else if (error.code === 3) {
        errorMessage = '⏰ Tiempo de espera agotado. Intenta nuevamente.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = '❌ Error desconocido: ' + JSON.stringify(error);
      }
      
      // Solo mostrar alerta si no es un error de timeout común
      if (!errorMessage.includes('timeout') && !errorMessage.includes('time')) {
        alert(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  }

  watchPosition(): Observable<Location> {
    return new Observable(observer => {
      const watchId = Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 segundos - aumentado para dar más tiempo
          maximumAge: 60000 // 1 minuto
        },
        (position, err) => {
          if (err) {
            console.error('Error en watchPosition:', err);
            // No emitir error inmediatamente, solo loguear
            // Esto permite que el seguimiento continúe intentando
            return;
          }
          
          if (!position) {
            console.warn('Posición no disponible en watchPosition');
            return;
          }

          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          };

          this.currentLocationSubject.next(location);
          observer.next(location);
        }
      );

      return () => {
        if (watchId) {
          Geolocation.clearWatch({ id: watchId.toString() });
        }
      };
    });
  }

  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  }

  isWithinRadius(
    userLat: number,
    userLon: number,
    targetLat: number,
    targetLon: number,
    radius: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radius;
  }
  async requestPermissions() {
    try {
      const permResult = await Geolocation.requestPermissions();
      console.log('🔐 Permisos solicitados:', permResult);
      
      if (permResult.location === 'denied') {
        throw new Error('Permisos de ubicación denegados');
      }
      
      return permResult;
    } catch (err) {
      console.error('❌ Error solicitando permisos:', err);
      throw err;
    }
  }
  
}
