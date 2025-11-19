import { Component, OnInit } from '@angular/core';
import { PushNotificationService } from './services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private pushNotificationService: PushNotificationService) {}

  async ngOnInit() {
    // Inicializar notificaciones push cuando la app se inicia
    await this.pushNotificationService.initialize();
    
    // Suscribirse a las notificaciones recibidas
    this.pushNotificationService.getNotificationsObservable().subscribe(notification => {
      if (notification) {
        console.log('📬 Nueva notificación recibida:', notification);
        // Aquí puedes mostrar un toast o actualizar la UI
      }
    });
  }
}
