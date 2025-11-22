import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GeolocationService, Location } from '../../services/geolocation.service';
import { BusService } from '../../services/bus.service';
import { Bus, BusRoute } from '../../models/bus.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GOOGLE_MAPS_CONFIG } from 'src/environments/google-maps.config';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';

interface NearbyBus extends Bus {
  distance: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  currentUser: User | null = null;
  currentLocation: Location | null = null;
  nearbyBuses: NearbyBus[] = [];
  isUpdatingLocation = false;
  isTrackingLocation = false;
  zoom = 15;
  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  markerPosition: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  markerTitle = 'Mi ubicación actual';
  
  // Opciones del marcador
  markerOptions: google.maps.MarkerOptions = {};
  
  private subscriptions: Subscription[] = [];
  private locationWatchSubscription?: Subscription;
  private apiKey: string = GOOGLE_MAPS_CONFIG.apiKey;
  
  constructor(
    private authService: AuthService,
    private geolocationService: GeolocationService,
    private busService: BusService,
    private router: Router,
    private toastController: ToastController,
    
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.setCurrentLocation();
    this.loadGoogleMaps();
    this.initializeMarkerOptions();
    this.startLocationTracking();
    this.subscribeToBusUpdates();
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
              <svg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <circle cx='16' cy='16' r='12' fill='%233880ff' stroke='white' stroke-width='3'/>
                <circle cx='16' cy='16' r='6' fill='white'/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
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

  async loadCurrentLocation() {
    try {
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      console.log('Current location:', this.currentLocation);
      //this.findNearbyBuses();
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      await this.showToast('Error obteniendo ubicación', 'danger');
    }
  }

  async updateLocation() {
    this.isUpdatingLocation = true;
    try {
      await this.geolocationService.requestPermissions();
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      if (this.currentLocation) {
        this.updateMapLocation(this.currentLocation);
        this.findNearbyBuses();
      }
      await this.showToast('Ubicación actualizada', 'success');
    } catch (error: any) {
      console.error('Error actualizando ubicación:', error);
      const errorMessage = error.message || 'Error actualizando ubicación';
      
      // Si es un error de timeout, sugerir aumentar el timeout
      if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
        await this.showToast('Tiempo de espera agotado. Intenta nuevamente o verifica tu conexión GPS.', 'warning');
      } else {
        await this.showToast(errorMessage, 'danger');
      }
    } finally {
      this.isUpdatingLocation = false;
    }
  }

  toggleLocationTracking() {
    if (this.isTrackingLocation) {
      this.stopLocationTracking();
    } else {
      this.startLocationTracking();
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
          this.findNearbyBuses();
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

  private subscribeToBusUpdates() {
    const busSub = this.busService.buses$.subscribe(() => {
      this.findNearbyBuses();
    });
    this.subscriptions.push(busSub);
  }

  private findNearbyBuses() {
    if (!this.currentLocation) return;

    this.busService.buses$.subscribe(buses => {
      const busesWithLocation = buses.filter(
        (bus): bus is Bus & { currentLocation: { latitude: number; longitude: number } } =>
          !!bus.currentLocation
      );

      this.nearbyBuses = busesWithLocation
        .filter(bus => bus.isActive)
        .map(bus => {
          const { latitude, longitude } = bus.currentLocation;
          const distance = this.geolocationService.calculateDistance(
            this.currentLocation!.latitude,
            this.currentLocation!.longitude,
            latitude,
            longitude
          );
          return { ...bus, distance };
        })
        .filter(bus => bus.distance <= 1000)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
    });
  }

  getRouteName(routeId: string): string {
    const route = this.busService.getRouteById(routeId);
    return route ? route.name : 'Ruta desconocida';
  }

  navigateToRoutes() {
    this.router.navigate(['/user/routes']);
  }

  navigateToAlerts() {
    this.router.navigate(['/user/alerts']);
  }

  async logout() {
    this.authService.logout();
    await this.showToast('Sesión cerrada', 'success');
    this.router.navigate(['/auth/login']);
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

  // ✅ Obtener la ubicación actual
  async setCurrentLocation() {
    try {
      await this.geolocationService.requestPermissions();
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      
      if (this.currentLocation) {
        this.updateMapLocation(this.currentLocation);
        console.log('Center:', this.center);
        console.log('Marker position:', this.markerPosition);
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo ubicación:', error);
      const errorMessage = error.message || 'Error obteniendo ubicación';
      
      // Si es un error de timeout, usar ubicación por defecto
      if (errorMessage.includes('timeout') || errorMessage.includes('time')) {
        console.warn('Usando ubicación por defecto (Guayaquil)');
        this.center = { lat: -2.1894, lng: -79.8890 };
        this.markerPosition = { lat: -2.1894, lng: -79.8890 };
      }
    }
  }

  openInfoWindow(marker: MapMarker) {
    this.infoWindow.open(marker);
  }
}
