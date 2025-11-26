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
import { GOOGLE_MAPS_CONFIG } from 'src/environments/google-maps.config';

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
  center: google.maps.LatLngLiteral = { lat: -2.1894, lng: -79.8890 }; //  por defecto
  markerPosition: google.maps.LatLngLiteral = { lat: -2.1894, lng: -79.8890 };
  markerTitle = 'Mi ubicación actual';
  isTrackingLocation = false;
  
  // Opciones del marcador
  markerOptions: google.maps.MarkerOptions = {};
  
  busForm: FormGroup;
  private subscriptions: Subscription[] = [];
  private locationWatchSubscription?: Subscription;
  private apiKey: string = GOOGLE_MAPS_CONFIG.apiKey;

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
    this.loadGoogleMaps();
    this.loadCurrentLocation();
    this.initializeMarkerOptions();
    this.startLocationTracking();
    this.subscribeToNotifications();
  }

  /**
   * Cargar script de Google Maps
   */
  loadGoogleMaps() {
    if (!document.querySelector('#google-maps-script')) {
      console.log('Loading Google Maps script');
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  /**
   * Inicializar opciones del marcador
   */
  private initializeMarkerOptions() {
    // Esperar a que Google Maps esté cargado
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.maps) {
        this.markerOptions = {
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width='32' height='32' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <!-- Fondo circular brillante naranja/rojo -->
                <circle cx='32' cy='32' r='30' fill='%23FF6B35' stroke='white' stroke-width='4'/>
                <circle cx='32' cy='32' r='28' fill='%23FF8C42' opacity='0.95'/>
                <circle cx='32' cy='32' r='26' fill='%23FFA500' opacity='0.9'/>
                
                <!-- Icono de bus -->
                <g transform='translate(8, 12)'>
                  <!-- Cuerpo del bus -->
                  <rect x='4' y='8' width='40' height='20' rx='3' fill='white' stroke='%23FF4500' stroke-width='2'/>
                  <!-- Ventanas -->
                  <rect x='8' y='12' width='8' height='6' rx='1' fill='%23FF4500'/>
                  <rect x='20' y='12' width='8' height='6' rx='1' fill='%23FF4500'/>
                  <rect x='32' y='12' width='8' height='6' rx='1' fill='%23FF4500'/>
                  <!-- Ruedas -->
                  <circle cx='12' cy='32' r='4' fill='%23333'/>
                  <circle cx='36' cy='32' r='4' fill='%23333'/>
                  <!-- Detalles de las ruedas -->
                  <circle cx='12' cy='32' r='2' fill='white'/>
                  <circle cx='36' cy='32' r='2' fill='white'/>
                </g>
                
                <!-- Borde exterior brillante para máxima visibilidad -->
                <circle cx='32' cy='32' r='31' fill='none' stroke='%23FFFFFF' stroke-width='3' opacity='0.8'/>
                <circle cx='32' cy='32' r='30' fill='none' stroke='%23FF4500' stroke-width='1' opacity='0.6'/>
              </svg>
            `),
            scaledSize: new google.maps.Size(64, 64),
            anchor: new google.maps.Point(32, 32)
          },
          animation: google.maps.Animation.DROP,
          optimized: false
        };
      }
    }, 1000);
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
        console.log('Center:', this.center);
        console.log('Marker position:', this.markerPosition);
      }
    } catch (error: any) {
      console.error('Error obteniendo ubicación:', error);
      const errorMessage = error.message || 'Error obteniendo ubicación';
      
      // Si es un error de timeout, usar ubicación por defecto
      if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
        console.warn('Usando ubicación por defecto (Milagro)');
        this.center = { lat: -2.1894, lng: -79.8890 };
        this.markerPosition = { lat: -2.1894, lng: -79.8890 };
        await this.showToast('Tiempo de espera agotado. Usando ubicación por defecto.', 'warning');
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
   * NOTA: Los conductores NO deben recibir notificaciones de "bus cerca"
   * Solo reciben notificaciones específicas para conductores
   */
  private subscribeToNotifications() {
    const notificationSub = this.pushNotificationService.getNotificationsObservable().subscribe({
      next: (notification) => {
        if (notification && notification.data?.type) {
          // Filtrar notificaciones que NO son para conductores
          const notificationType = notification.data.type;
          
          // Ignorar notificaciones de "bus_near_stop" que son solo para usuarios
          if (notificationType === 'bus_near_stop') {
            console.log('Notificación de bus cercano ignorada (solo para usuarios)');
            return;
          }
          
          // Solo procesar notificaciones específicas para conductores
          if (notificationType === 'stop_alert' || notificationType === 'driver_notification') {
            this.handleDriverNotification(notification);
          }
        }
      },
      error: (error) => {
        console.error('Error en notificaciones:', error);
      }
    });
    this.subscriptions.push(notificationSub);
  }

  /**
   * Manejar notificaciones específicas para conductores
   */
  private async handleDriverNotification(notification: any) {
    const notificationType = notification.data?.type;
    
    if (notificationType === 'stop_alert') {
      const stopName = notification.data?.stopName || 'una parada';
      await this.showToast(
        `🚌 Nueva alerta en ${stopName}`,
        'primary'
      );
    } else {
      // Otras notificaciones para conductores
      const title = notification.title || 'Notificación';
      await this.showToast(title, 'primary');
    }
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
