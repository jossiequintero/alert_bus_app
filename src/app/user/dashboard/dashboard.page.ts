import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GeolocationService, Location } from '../../services/geolocation.service';
import { BusService } from '../../services/bus.service';
import { Bus, BusRoute } from '../../models/bus.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';

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
  currentUser: User | null = null;
  currentLocation: Location | null = null;
  nearbyBuses: NearbyBus[] = [];
  isUpdatingLocation = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private geolocationService: GeolocationService,
    private busService: BusService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadCurrentLocation();
    this.subscribeToLocationUpdates();
    this.subscribeToBusUpdates();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadCurrentLocation() {
    try {
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      this.findNearbyBuses();
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      await this.showToast('Error obteniendo ubicación', 'danger');
    }
  }

  async updateLocation() {
    this.isUpdatingLocation = true;
    try {
      this.currentLocation = await this.geolocationService.getCurrentPosition();
      this.findNearbyBuses();
      await this.showToast('Ubicación actualizada', 'success');
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      await this.showToast('Error actualizando ubicación', 'danger');
    } finally {
      this.isUpdatingLocation = false;
    }
  }

  private subscribeToLocationUpdates() {
    const locationSub = this.geolocationService.currentLocation$.subscribe(location => {
      if (location) {
        this.currentLocation = location;
        this.findNearbyBuses();
      }
    });
    this.subscriptions.push(locationSub);
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
      this.nearbyBuses = buses
        .filter(bus => bus.isActive)
        .map(bus => {
          const distance = this.geolocationService.calculateDistance(
            this.currentLocation!.latitude,
            this.currentLocation!.longitude,
            bus.currentLocation.latitude,
            bus.currentLocation.longitude
          );
          return { ...bus, distance };
        })
        .filter(bus => bus.distance <= 1000) // Solo buses dentro de 1km
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5); // Máximo 5 buses cercanos
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
}
