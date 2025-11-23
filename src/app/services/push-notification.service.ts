import { Injectable } from '@angular/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Platform, ToastController } from '@ionic/angular';
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
    private authService: AuthService,
    private toastController: ToastController
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
        await this.showToast('Permisos de notificaciones concedidos', 'success', 2000);
      } else {
        await this.showToast('Permisos de notificaciones denegados', 'warning', 3000);
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
      PushNotifications.addListener('registrationError', async (error: any) => {
        console.error('❌ Error al registrar notificaciones push:', error);
        await this.showToast('Error al registrar notificaciones push', 'danger', 3000);
      });

      // Escuchar cuando se recibe una notificación
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('📬 Notificación recibida:', notification);
        this.handleNotificationReceived(notification);
        // El toast se mostrará desde app.component.ts que escucha notificationReceived$
      });

      // Escuchar cuando se hace clic en una notificación
      PushNotifications.addListener('pushNotificationActionPerformed', async (action: ActionPerformed) => {
        console.log('👆 Notificación tocada:', action);
        this.handleNotificationAction(action);
        // Mostrar toast cuando se toca la notificación
        const notification = action.notification;
        if (notification.title || notification.body) {
          await this.showNotificationToast({
            title: notification.title || 'Notificación',
            body: notification.body || '',
            data: notification.data,
            id: notification.id?.toString()
          });
        }
      });

    } catch (error) {
      console.error('❌ Error al inicializar notificaciones push:', error);
      await this.showToast('Error al inicializar notificaciones push', 'danger', 3000);
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
        // No mostrar toast para esto, es un proceso interno
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

  /**
   * Mostrar un toast genérico
   */
  private async showToast(message: string, color: string = 'primary', duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      color: color,
      position: 'top',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ],
      cssClass: 'notification-toast'
    });

    await toast.present();
  }

  /**
   * Mostrar un toast formateado para notificaciones push
   */
  private async showNotificationToast(notification: PushNotificationData): Promise<void> {
    let message = '';
    let color = 'primary';
    let duration = 4000;

    // Formatear el mensaje según el tipo de notificación
    if (notification.data?.type === 'bus_near_stop') {
      // Notificación de bus cercano a una parada
      const busNumber = notification.data?.busId ? 'el autobús' : 'un autobús';
      const stopName = notification.data?.stopName || 'la parada';
      const distance = notification.data?.distance 
        ? `${Math.round(parseFloat(notification.data.distance))}m` 
        : '';
      
      message = notification.body || 
        `🚌 ${busNumber} está cerca de ${stopName}${distance ? ` (${distance})` : ''}`;
      color = 'success';
      duration = 5000; // Más tiempo para notificaciones importantes
    } else if (notification.title && notification.body) {
      // Notificación genérica con título y cuerpo
      message = `${notification.title}\n${notification.body}`;
      color = 'primary';
    } else if (notification.body) {
      // Solo cuerpo disponible
      message = notification.body;
      color = 'primary';
    } else {
      // Fallback
      message = 'Nueva notificación recibida';
      color = 'primary';
    }

    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      color: color,
      position: 'top',
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
          handler: () => {
            console.log('Toast cerrado');
          }
        }
      ],
      cssClass: 'notification-toast'
    });

    await toast.present();
  }
}

