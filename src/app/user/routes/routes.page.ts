import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { BusService } from '../../services/bus.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { GeolocationService } from '../../services/geolocation.service';
import { BusRoute, Bus, BusStop } from '../../models/bus.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.page.html',
  styleUrls: ['./routes.page.scss'],
  standalone: false,
})
export class RoutesPage implements OnInit, OnDestroy {
  routes: BusRoute[] = [];
  buses: Bus[] = [];
  selectedRoute: BusRoute | null = null;
  currentUser: User | null = null;
  private subscriptions: Subscription[] = [];

  // Configuración del mapa
  mapCenter = { lat: -2.1894, lng: -79.8890 }; // Guayaquil, Ecuador por defecto
  mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 3,
  };

  stopMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#3880ff" stroke="white" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">P</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24)
    }
  };

  busMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="6" width="16" height="10" rx="2" fill="#10dc60" stroke="white" stroke-width="2"/>
          <circle cx="7" cy="16" r="2" fill="#333"/>
          <circle cx="17" cy="16" r="2" fill="#333"/>
          <text x="12" y="12" text-anchor="middle" fill="white" font-size="10" font-weight="bold">🚌</text>
        </svg>
      `),
      scaledSize: new google.maps.Size(24, 24)
    }
  };

  constructor(
    private busService: BusService,
    private alertService: AlertService,
    private authService: AuthService,
    private geolocationService: GeolocationService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadRoutes();
    this.loadBuses();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadRoutes() {
    const routesSub = this.busService.getRoutes().subscribe(routes => {
      this.routes = routes.filter(route => route.isActive);
    });
    this.subscriptions.push(routesSub);
  }

  private loadBuses() {
    const busesSub = this.busService.getBuses().subscribe(buses => {
      this.buses = buses;
    });
    this.subscriptions.push(busesSub);
  }

  selectRoute(route: BusRoute) {
    this.selectedRoute = route;
    
    // Centrar el mapa en la primera parada de la ruta
    if (route.stops.length > 0) {
      const firstStop = route.stops[0];
      this.mapCenter = {
        lat: firstStop.location.latitude,
        lng: firstStop.location.longitude
      };
    }
  }

  getBusesForRoute(routeId: string): Bus[] {
    return this.buses.filter(bus => bus.routeId === routeId && bus.isActive);
  }

  async setAlertForStop(stop: BusStop) {
    if (!this.currentUser || !this.selectedRoute) return;

    try {
      // Obtener ubicación actual del usuario
      let userLocation = null;
      
      try {
        userLocation = await this.geolocationService.getCurrentPosition();
      } catch (error) {
        console.warn('No se pudo obtener ubicación del usuario:', error);
      }

      // Crear una alerta de parada usando el servicio
      this.alertService.createStopAlert(
        this.currentUser.id,
        this.selectedRoute.id,
        stop.id,
        stop.name,
        userLocation?.latitude,
        userLocation?.longitude
      ).subscribe({
        next: (alert) => {
          this.showToast(`Alerta configurada para ${stop.name}. Serás notificado cuando un bus esté cerca.`, 'success');
        },
        error: (error) => {
          console.error('Error configurando alerta:', error);
          this.showToast('Error configurando alerta', 'danger');
        }
      });
    } catch (error) {
      console.error('Error configurando alerta:', error);
      await this.showToast('Error configurando alerta', 'danger');
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
