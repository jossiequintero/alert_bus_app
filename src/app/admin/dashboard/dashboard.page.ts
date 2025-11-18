import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GeolocationService, Location } from '../../services/geolocation.service';
import { BusService } from '../../services/bus.service';
import { Bus, BusRoute } from '../../models/bus.model';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { AddBusComponent } from './modals/add-bus/add-bus.component';
import { AddRouteComponent } from './modals/add-route/add-route.component';
import { AssignDriverComponent } from './modals/assign-driver/assign-driver.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentBus: Bus | null = null;
  currentRoute: BusRoute | null = null;
  currentLocation: Location | null = null;
  routes: BusRoute[] = [];
  isUpdating = false;
  isUpdatingLocation = false;
  isRegistering = false;
  
  busForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private geolocationService: GeolocationService,
    private busService: BusService,
    private formBuilder: FormBuilder,
    private router: Router,
    private toastController: ToastController,
    private modalCtrl: ModalController
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
    this.subscribeToLocationUpdates();
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
      this.currentLocation = await this.geolocationService.getCurrentPosition();
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      await this.showToast('Error obteniendo ubicación', 'danger');
    }
  }

  private subscribeToLocationUpdates() {
    const locationSub = this.geolocationService.currentLocation$.subscribe(location => {
      if (location) {
        this.currentLocation = location;
        if (this.currentBus) {
          this.updateBusLocation();
        }
      }
    });
    this.subscriptions.push(locationSub);
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
        const newBus = await this.busService.registerBus({
          number,
          driverId: this.currentUser.id,
          routeId,
          currentLocation: this.currentLocation || { latitude: 0, longitude: 0 },
          isActive: false,
          capacity,
          currentPassengers: 0
        }).toPromise();

        this.currentBus = newBus || null;
        this.currentRoute = newBus ? this.busService.getRouteById(newBus.routeId) || null : null;
        this.busForm.reset();
        
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
    if (!this.currentBus) return;

    this.isUpdating = true;
    try {
      // Simular cambio de estado
      this.currentBus.isActive = !this.currentBus.isActive;
      await this.showToast(
        `Servicio ${this.currentBus.isActive ? 'iniciado' : 'detenido'}`, 
        'success'
      );
    } catch (error) {
      console.error('Error cambiando estado del autobús:', error);
      await this.showToast('Error cambiando estado', 'danger');
    } finally {
      this.isUpdating = false;
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

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
  async openAddBusModal() {
  const modal = await this.modalCtrl.create({
    component: AddBusComponent,
    componentProps: {
      currentUser: this.currentUser,
      routes: this.routes
    }
  });
  await modal.present();
}
async openAddRouteModal() {
  const modal = await this.modalCtrl.create({
    component: AddRouteComponent
  });
  const { data } = await modal.onWillDismiss();

  if (data) {
    //this.busService.addRoute(data);
  }
}

async openAssignDriverModal() {
  const modal = await this.modalCtrl.create({
    component: AssignDriverComponent,
    componentProps: {
      // buses: this.busService.buses,
      // drivers: this.busService.drivers
    }
  });
  const { data } = await modal.onWillDismiss();

  if (data) {
    // await this.busService.updateBus(data.busId, {
    //   driverId: data.driverId
    // });
  }
}
}
