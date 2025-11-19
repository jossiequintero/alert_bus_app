import { Injectable } from '@angular/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
  id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  private notificationReceivedSubject = new BehaviorSubject<PushNotificationData | null>(null);
  public notificationReceived$ = this.notificationReceivedSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(
    private platform: Platform,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Inicializa las notificaciones push
   */
  async initialize(): Promise<void> {
    if (!this.platform.is('capacitor')) {
      console.log('Push notifications solo están disponibles en dispositivos nativos');
      return;
    }
    console.log('Paso prueba capacitor');
    
    try {
      // Solicitar permisos
      const permissionResult = await PushNotifications.requestPermissions();
      console.log('capacitor: ', permissionResult);
      
      if (permissionResult.receive === 'granted') {
        // Registrar para recibir notificaciones
        await PushNotifications.register();
        console.log('✅ Capacitor: Permisos de notificaciones concedidos');
      } else {
        console.warn('⚠️ Capacitor: Permisos de notificaciones denegados');
        return;
      }

      // Escuchar cuando se registra el token
      PushNotifications.addListener('registration', (token: Token) => {
        
        console.log('📱 Token de notificaciones push:', token.value);
        // alert('Token: ' + token.value);
        this.tokenSubject.next(token.value);
        this.saveTokenToServer(token.value);
      });

      // Escuchar errores de registro
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('❌ Error al registrar notificaciones push:', error);
      });

      // Escuchar cuando se recibe una notificación
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('📬 Notificación recibida:', notification);
        this.handleNotificationReceived(notification);
      });

      // Escuchar cuando se hace clic en una notificación
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('👆 Notificación tocada:', action);
        this.handleNotificationAction(action);
      });

    } catch (error) {
      console.error('❌ Error al inicializar notificaciones push:', error);
    }
  }

  /**
   * Guarda el token en el servidor
   */
  private async saveTokenToServer(token: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      console.warn('⚠️ No hay usuario autenticado para guardar el token');
      return;
    }

    try {
      const response = await this.http.post<any>(`${this.apiUrl}user/save-token`, {
        userId: user.id,
        token: token,
        platform: 'android'
      }).toPromise();

      if (response?.success) {
        console.log('✅ Token guardado en el servidor');
      } else {
        console.warn('⚠️ Error al guardar token:', response?.error);
      }
    } catch (error) {
      console.error('❌ Error al guardar token en el servidor:', error);
    }
  }

  /**
   * Maneja cuando se recibe una notificación
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    const notificationData: PushNotificationData = {
      title: notification.title || 'Nueva notificación',
      body: notification.body || '',
      data: notification.data,
      id: notification.id?.toString()
    };

    this.notificationReceivedSubject.next(notificationData);
  }

  /**
   * Maneja cuando se hace clic en una notificación
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const notification = action.notification;
    const notificationData: PushNotificationData = {
      title: notification.title || 'Notificación',
      body: notification.body || '',
      data: notification.data,
      id: notification.id?.toString()
    };

    // Aquí puedes navegar a una página específica basada en los datos de la notificación
    if (notificationData.data?.route) {
      // Ejemplo: this.router.navigate([notificationData.data.route]);
      console.log('Navegar a:', notificationData.data.route);
    }
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Obtiene el token como Observable
   */
  getTokenObservable(): Observable<string | null> {
    return this.token$;
  }

  /**
   * Obtiene las notificaciones recibidas como Observable
   */
  getNotificationsObservable(): Observable<PushNotificationData | null> {
    return this.notificationReceived$;
  }

  /**
   * Elimina todos los listeners (útil para limpiar al destruir el servicio)
   */
  async removeAllListeners(): Promise<void> {
    await PushNotifications.removeAllListeners();
  }
}

