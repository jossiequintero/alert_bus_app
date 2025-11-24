import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { PushNotificationService, PushNotificationData } from './services/push-notification.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private pushNotificationService: PushNotificationService,
    private toastController: ToastController,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // Si el usuario ya está autenticado (sesión guardada), inicializar push notifications
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && (currentUser.roleId === 1 || currentUser.roleId === 2)) {
      try {
        await this.pushNotificationService.initialize();
        console.log('Push notifications inicializadas para usuario autenticado');
      } catch (error) {
        console.error('Error inicializando push notifications:', error);
      }
    }
    
    // Suscribirse a las notificaciones recibidas
    this.pushNotificationService.getNotificationsObservable().subscribe(notification => {
      if (notification) {
        console.log('📬 Nueva notificación recibida:', notification);
        this.showNotificationToast(notification);
      }
    });
  }

  /**
   * Mostrar un toast amigable para las notificaciones recibidas
   */
  private async showNotificationToast(notification: PushNotificationData) {
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
