import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Alert, AlertSettings } from '../models/alert.model';
import { Bus } from '../models/bus.model';
import { BusStop } from '../models/bus.model';
import { GeolocationService } from './geolocation.service';
import { BusService } from './bus.service';
import { AuthService } from './auth.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { environment } from 'src/environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  busFoundNearby?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  private alertSettingsSubject = new BehaviorSubject<AlertSettings | null>(null);
  
  public alerts$ = this.alertsSubject.asObservable();
  public alertSettings$ = this.alertSettingsSubject.asObservable();

  private proximityCheckInterval: any;
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private geolocationService: GeolocationService,
    private busService: BusService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.loadAlertSettings();
    this.startProximityMonitoring();
  }

  /**
   * Cargar configuración de alertas desde Firebase
   */
  loadAlertSettings(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.http.get<ApiResponse<AlertSettings>>(`${this.apiUrl}user/alert-settings/${user.id}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.alertSettingsSubject.next(response.data);
        } else {
          // Si no existe, crear configuración por defecto
          this.initializeDefaultSettings();
        }
      },
      error: (error) => {
        console.error('Error cargando configuración de alertas:', error);
        // En caso de error, usar configuración por defecto
        this.initializeDefaultSettings();
      }
    });
  }

  private initializeDefaultSettings(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const defaultSettings: AlertSettings = {
        userId: user.id,
        proximityRadius: 500, // 500 metros
        advanceTime: 5, // 5 minutos
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true
      };
      this.alertSettingsSubject.next(defaultSettings);
      // Guardar en Firebase
      this.saveAlertSettingsToFirebase(defaultSettings);
    }
  }

  private saveAlertSettingsToFirebase(settings: AlertSettings): void {
    this.http.post<ApiResponse<AlertSettings>>(`${this.apiUrl}user/alert-settings`, settings).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Configuración de alertas guardada en Firebase');
        }
      },
      error: (error) => {
        console.error('Error guardando configuración de alertas:', error);
      }
    });
  }

  private startProximityMonitoring(): void {
    // Verificar proximidad cada 30 segundos
    this.proximityCheckInterval = interval(30000).subscribe(() => {
      this.checkProximityAlerts();
    });
  }

  private async checkProximityAlerts(): Promise<void> {
    const user = this.authService.getCurrentUser();
    const settings = this.alertSettingsSubject.value;
    
    if (!user || !settings || !settings.isEnabled) {
      return;
    }

    try {
      const userLocation = await this.geolocationService.getCurrentPosition();
      const buses = this.busService.getBuses();
      
      buses.subscribe(busList => {
        busList.forEach(bus => {
          if (bus.isActive) {
            const latitude:number =  bus.currentLocation.latitude ?  bus.currentLocation.latitude : 0;
            const distance = this.geolocationService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              bus.currentLocation.latitude,
              latitude
            );

            // Verificar si el bus está dentro del radio de proximidad
            if (distance <= settings.proximityRadius) {
              this.createProximityAlert(user.id, bus, distance);
            }
          }
        });
      });
    } catch (error) {
      console.error('Error verificando alertas de proximidad:', error);
    }
  }

  private createProximityAlert(userId: string, bus: Bus, distance: number): void {
    const existingAlert = this.alertsSubject.value.find(
      alert => alert.userId === userId && 
               alert.busId === bus.id && 
               alert.alertType === 'proximity' &&
               !alert.isRead
    );

    if (!existingAlert) {
      const newAlert: Alert = {
        id: this.generateId(),
        userId,
        busId: bus.id,
        stopId: '', // Se puede determinar basado en la parada más cercana
        routeId: bus.routeId,
        alertType: 'proximity',
        message: `El autobús ${bus.number} está a ${Math.round(distance)} metros de tu ubicación`,
        isRead: false,
        createdAt: new Date(),
        triggeredAt: new Date(),
        distance
      };

      const alerts = this.alertsSubject.value;
      this.alertsSubject.next([...alerts, newAlert]);
      
      this.showLocalNotification(newAlert);
    }
  }

  private async showLocalNotification(alert: Alert): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🚌 Autobús Cercano',
            body: alert.message,
            id: parseInt(alert.id, 36),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              alertId: alert.id
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error mostrando notificación local:', error);
    }
  }

  /**
   * Obtener alertas del usuario desde Firebase
   */
  getAlertsForUser(userId: string): Observable<Alert[]> {
    // Primero cargar desde Firebase
    this.http.get<ApiResponse<Alert[]>>(`${this.apiUrl}user/alerts/${userId}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Convertir fechas de string a Date
          const alerts = response.data.map(alert => ({
            ...alert,
            createdAt: alert.createdAt instanceof Date ? alert.createdAt : new Date(alert.createdAt),
            triggeredAt: alert.triggeredAt ? (alert.triggeredAt instanceof Date ? alert.triggeredAt : new Date(alert.triggeredAt)) : undefined
          }));
          this.alertsSubject.next(alerts);
        }
      },
      error: (error) => {
        console.error('Error cargando alertas:', error);
      }
    });

    // Retornar observable local
    return new Observable(observer => {
      this.alerts$.subscribe(alerts => {
        const userAlerts = alerts.filter(alert => alert.userId === userId);
        observer.next(userAlerts);
      });
    });
  }

  /**
   * Marcar alerta como leída en Firebase
   */
  markAlertAsRead(alertId: string): void {
    this.http.put<ApiResponse<any>>(`${this.apiUrl}user/alerts/${alertId}/read`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          const alerts = this.alertsSubject.value;
          const alertIndex = alerts.findIndex(alert => alert.id === alertId);
          
          if (alertIndex !== -1) {
            alerts[alertIndex].isRead = true;
            this.alertsSubject.next([...alerts]);
          }
        }
      },
      error: (error) => {
        console.error('Error marcando alerta como leída:', error);
        // Actualizar localmente aunque falle
        const alerts = this.alertsSubject.value;
        const alertIndex = alerts.findIndex(alert => alert.id === alertId);
        
        if (alertIndex !== -1) {
          alerts[alertIndex].isRead = true;
          this.alertsSubject.next([...alerts]);
        }
      }
    });
  }

  /**
   * Actualizar configuración de alertas y guardar en Firebase
   */
  updateAlertSettings(settings: AlertSettings): void {
    this.alertSettingsSubject.next(settings);
    this.saveAlertSettingsToFirebase(settings);
  }

  /**
   * Crear alerta para una parada específica
   */
  createStopAlert(
    userId: string, 
    routeId: string, 
    stopId: string, 
    stopName: string,
    userLatitude?: number | null,
    userLongitude?: number | null
  ): Observable<Alert> {
    return new Observable(observer => {
      this.http.post<ApiResponse<Alert>>(`${this.apiUrl}user/alerts/create-stop-alert`, {
        userId,
        routeId,
        stopId,
        stopName,
        userLatitude: userLatitude || null,
        userLongitude: userLongitude || null
      }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const alert = {
              ...response.data,
              createdAt: response.data.createdAt instanceof Date ? response.data.createdAt : new Date(response.data.createdAt)
            };
            // Agregar a la lista local
            const alerts = this.alertsSubject.value;
            this.alertsSubject.next([...alerts, alert]);
            
            // Si se encontró un bus cerca, la notificación ya fue enviada desde el servidor
            // El mensaje de respuesta indica si se encontró un bus
            if (response.busFoundNearby) {
              console.log('Bus encontrado cerca inmediatamente - notificación enviada');
            }
            
            observer.next(alert);
            observer.complete();
          } else {
            observer.error(new Error(response.error || 'Error creando alerta'));
          }
        },
        error: (error) => {
          console.error('Error creando alerta de parada:', error);
          observer.error(error);
        }
      });
    });
  }

  createArrivalAlert(userId: string, busId: string, stopId: string, estimatedArrival: Date): void {
    const newAlert: Alert = {
      id: this.generateId(),
      userId,
      busId,
      stopId,
      routeId: '',
      alertType: 'arrival',
      message: `El autobús llegará a la parada en ${estimatedArrival.toLocaleTimeString()}`,
      isRead: false,
      createdAt: new Date(),
      triggeredAt: estimatedArrival
    };

    const alerts = this.alertsSubject.value;
    this.alertsSubject.next([...alerts, newAlert]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  ngOnDestroy(): void {
    if (this.proximityCheckInterval) {
      this.proximityCheckInterval.unsubscribe();
    }
  }
}
