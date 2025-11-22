import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GeolocationService, Location } from '../../services/geolocation.service';
import { BusService } from '../../services/bus.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Bus, BusRoute } from '../../models/bus.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  currentUser: User | null = null;
  currentBus: Bus | null = null;
  currentRoute: BusRoute | null = null;
  currentLocation: Location | null = null;
  routes: BusRoute[] = [];
  isUpdating = false;
  isUpdatingLocation = false;
  isRegistering = false;
  
  // Mapa
  zoom = 15;
  center: google.maps.LatLngLiteral = { lat: -2.1894, lng: -79.8890 }; // Guayaquil por defecto
  markerPosition: google.maps.LatLngLiteral = { lat: -2.1894, lng: -79.8890 };
  markerTitle = 'Mi ubicación actual';
  isTrackingLocation = false;
  
  // Opciones del marcador
  markerOptions: google.maps.MarkerOptions = {};
  
  busForm: FormGroup;
  private subscriptions: Subscription[] = [];
  private locationWatchSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private geolocationService: GeolocationService,
    private busService: BusService,
    private pushNotificationService: PushNotificationService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastController: ToastController
  ) {
    this.busForm = this.formBuilder.group({
      number: ['', [Validators.required]],
      routeId: ['', [Validators.required]],
      capacity: [50, [Validators.required, Validators.min(1), Validators.max(100)]]
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadRoutes();
    this.loadCurrentBus();
    this.loadCurrentLocation();
    this.initializeMarkerOptions();
    this.startLocationTracking();
    this.subscribeToNotifications();
  }

  /**
   * Inicializar opciones del marcador
   */
  private initializeMarkerOptions() {
    if (typeof google !== 'undefined' && google.maps) {
      this.markerOptions = {
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <circle cx='16' cy='16' r='12' fill='%2310dc60' stroke='white' stroke-width='3'/>
              <circle cx='16' cy='16' r='6' fill='white'/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      };
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.locationWatchSubscription) {
      this.locationWatchSubscription.unsubscribe();
    }
    this.stopLocationTracking();
  }

  private loadRoutes() {
    const routesSub = this.busService.getRoutes().subscribe(routes => {
      this.routes = routes.filter(route => route.isActive);
    });
    this.subscriptions.push(routesSub);
  }

  private loadCurrentBus() {
    const busesSub = this.busService.getBuses().subscribe(buses => {
      // Buscar el autobús del chofer actual
      this.currentBus = buses.find(bus => bus.driverId === this.currentUser?.id) || null;
      
      if (this.currentBus) {
        this.currentRoute = this.busService.getRouteById(this.currentBus.routeId) || null;
      }
    });
    this.subscriptions.push(busesSub);
  }

  async loadCurrentLocation() {
    try {
      await this.geolocationService.requestPermissions();
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      
      if (this.currentLocation) {
        this.updateMapLocation(this.currentLocation);
      }
    } catch (error: any) {
      console.error('Error obteniendo ubicación:', error);
      const errorMessage = error.message || 'Error obteniendo ubicación';
      
      // Si es un error de timeout, sugerir aumentar el timeout
      if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
        await this.showToast('Tiempo de espera agotado. Intenta nuevamente o verifica tu conexión GPS.', 'warning');
      } else {
        await this.showToast(errorMessage, 'danger');
      }
    }
  }

  /**
   * Iniciar seguimiento de ubicación en tiempo real
   */
  startLocationTracking() {
    if (this.isTrackingLocation) return;
    
    this.isTrackingLocation = true;
    this.locationWatchSubscription = this.geolocationService.watchPosition().subscribe({
      next: (location) => {
        if (location) {
          this.currentLocation = location;
          this.updateMapLocation(location);
          
          // Actualizar ubicación del bus si está activo
          if (this.currentBus && this.currentBus.isActive) {
            this.updateBusLocation();
          }
        }
      },
      error: (error) => {
        console.error('Error en seguimiento de ubicación:', error);
        // No detener el seguimiento por errores temporales
        // El watchPosition continuará intentando
      }
    });
  }

  /**
   * Detener seguimiento de ubicación
   */
  stopLocationTracking() {
    this.isTrackingLocation = false;
    if (this.locationWatchSubscription) {
      this.locationWatchSubscription.unsubscribe();
      this.locationWatchSubscription = undefined;
    }
  }

  /**
   * Actualizar posición del mapa
   */
  private updateMapLocation(location: Location) {
    this.center = {
      lat: location.latitude,
      lng: location.longitude
    };
    this.markerPosition = {
      lat: location.latitude,
      lng: location.longitude
    };
  }

  async updateLocation() {
    this.isUpdatingLocation = true;
    try {
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      if (this.currentBus) {
        this.updateBusLocation();
      }
      await this.showToast('Ubicación actualizada', 'success');
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      await this.showToast('Error actualizando ubicación', 'danger');
    } finally {
      this.isUpdatingLocation = false;
    }
  }

  private updateBusLocation() {
    if (this.currentBus && this.currentLocation) {
      this.busService.updateBusLocation(
        this.currentBus.id,
        this.currentLocation.latitude,
        this.currentLocation.longitude
      );
    }
  }

  async registerBus() {
    if (this.busForm.valid && this.currentUser) {
      this.isRegistering = true;
      const { number, routeId, capacity } = this.busForm.value;

      try {
      //   const newBus = await this.busService.registerBus({
      //     number,
      //     driverId: this.currentUser.id,
      //     routeId,
      //     currentLocation: this.currentLocation || { latitude: 0, longitude: 0 },
      //     isActive: false,
      //     capacity,
      //     currentPassengers: 0,
      //     placa: ''
      //   }).toPromise();

      //   this.currentBus = newBus || null;
      //   this.currentRoute = newBus ? this.busService.getRouteById(newBus.routeId) || null : null;
      //   this.busForm.reset();
        
        await this.showToast('Autobús registrado exitosamente', 'success');
      } catch (error) {
        console.error('Error registrando autobús:', error);
        await this.showToast('Error registrando autobús', 'danger');
      } finally {
        this.isRegistering = false;
      }
    }
  }

  async toggleBusStatus() {
    if (!this.currentBus || !this.currentUser) return;

    this.isUpdating = true;
    try {
      if (!this.currentBus.isActive) {
        // Iniciar servicio - activar bus e iniciar ruta
        await this.busService.updateBus(this.currentBus.id, { isActive: true }).toPromise();
        
        // Iniciar simulación de ruta
        if (this.currentBus.routeId) {
          await this.busService.startSimulation(
            this.currentBus.id,
            this.currentBus.routeId,
            this.currentUser.id
          ).toPromise();
        }
        
        this.currentBus.isActive = true;
        await this.showToast('Servicio iniciado - Ruta activa', 'success');
      } else {
        // Detener servicio
        await this.busService.updateBus(this.currentBus.id, { isActive: false }).toPromise();
        this.currentBus.isActive = false;
        await this.showToast('Servicio detenido', 'success');
      }
    } catch (error) {
      console.error('Error cambiando estado del autobús:', error);
      await this.showToast('Error cambiando estado', 'danger');
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Suscribirse a notificaciones push para recibir alertas de paradas
   */
  private subscribeToNotifications() {
    const notificationSub = this.pushNotificationService.getNotificationsObservable().subscribe({
      next: (notification) => {
        if (notification && notification.data?.type === 'stop_alert') {
          this.handleStopAlertNotification(notification);
        }
      },
      error: (error) => {
        console.error('Error en notificaciones:', error);
      }
    });
    this.subscriptions.push(notificationSub);
  }

  /**
   * Manejar notificación de alerta de parada
   */
  private async handleStopAlertNotification(notification: any) {
    const stopName = notification.data?.stopName || 'una parada';
    await this.showToast(
      `🚌 Nueva alerta en ${stopName}`,
      'primary'
    );
  }

  async markStopArrival(stop: any) {
    try {
      await this.showToast(`Llegada marcada en ${stop.name}`, 'success');
    } catch (error) {
      console.error('Error marcando llegada:', error);
      await this.showToast('Error marcando llegada', 'danger');
    }
  }

  getRouteName(routeId: string): string {
    const route = this.busService.getRouteById(routeId);
    return route ? route.name : 'Ruta desconocida';
  }

  async logout() {
    this.authService.logout();
    await this.showToast('Sesión cerrada', 'success');
    this.router.navigate(['/auth/login']);
  }

  openInfoWindow(marker: MapMarker) {
    if (this.infoWindow) {
      this.infoWindow.open(marker);
    }
  }

  toggleLocationTracking() {
    if (this.isTrackingLocation) {
      this.stopLocationTracking();
    } else {
      this.startLocationTracking();
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
