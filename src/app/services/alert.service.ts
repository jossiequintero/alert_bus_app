import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Alert, AlertSettings } from '../models/alert.model';
import { Bus } from '../models/bus.model';
import { BusStop } from '../models/bus.model';
import { GeolocationService } from './geolocation.service';
import { BusService } from './bus.service';
import { AuthService } from './auth.service';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  private alertSettingsSubject = new BehaviorSubject<AlertSettings | null>(null);
  
  public alerts$ = this.alertsSubject.asObservable();
  public alertSettings$ = this.alertSettingsSubject.asObservable();

  private proximityCheckInterval: any;

  constructor(
    private geolocationService: GeolocationService,
    private busService: BusService,
    private authService: AuthService
  ) {
    this.initializeDefaultSettings();
    this.startProximityMonitoring();
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
    }
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
            const distance = this.geolocationService.calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              bus.currentLocation.latitude,
              bus.currentLocation.longitude
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

  getAlertsForUser(userId: string): Observable<Alert[]> {
    return new Observable(observer => {
      this.alerts$.subscribe(alerts => {
        const userAlerts = alerts.filter(alert => alert.userId === userId);
        observer.next(userAlerts);
      });
    });
  }

  markAlertAsRead(alertId: string): void {
    const alerts = this.alertsSubject.value;
    const alertIndex = alerts.findIndex(alert => alert.id === alertId);
    
    if (alertIndex !== -1) {
      alerts[alertIndex].isRead = true;
      this.alertsSubject.next([...alerts]);
    }
  }

  updateAlertSettings(settings: AlertSettings): void {
    this.alertSettingsSubject.next(settings);
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
