import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AddBusComponent } from './modals/add-bus/add-bus.component';
import { AddRouteComponent } from './modals/add-route/add-route.component';
import { AssignDriverComponent } from './modals/assign-driver/assign-driver.component';
import { Bus, BusRoute } from '../../models/bus.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { BusService } from '../../services/bus.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  buses: Bus[] = [];
  routes: BusRoute[] = [];
  drivers: User[] = [];

  selectedSection: 'buses' | 'routes' | 'drivers' = 'buses';
  loadingBuses = false;
  loadingRoutes = false;
  loadingDrivers = false;
  startingSimulation: Record<string, boolean> = {};
  deletingBus: Record<string, boolean> = {};
  deletingRoute: Record<string, boolean> = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private busService: BusService,
    private userService: UserService,
    private router: Router,
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.observeBuses();
    this.observeRoutes();
    this.loadDrivers();
    this.refreshBuses();
    this.refreshRoutes();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private observeBuses() {
    const busesSub = this.busService.getBuses().subscribe(buses => {
      this.buses = buses;
    });
    this.subscriptions.push(busesSub);
  }

  private observeRoutes() {
    const routesSub = this.busService.getRoutes().subscribe(routes => {
      this.routes = routes;
    });
    this.subscriptions.push(routesSub);
  }

  private loadDrivers() {
    this.loadingDrivers = true;
    const driversSub = this.userService.getDrivers().subscribe({
      next: drivers => {
        this.drivers = drivers;
        this.loadingDrivers = false;
      },
      error: async () => {
        this.loadingDrivers = false;
        await this.showToast('No se pudieron cargar los conductores', 'danger');
      }
    });
    this.subscriptions.push(driversSub);
  }

  refreshBuses() {
    if (this.loadingBuses) {
      return;
    }
    this.loadingBuses = true;
    this.busService.refreshBuses().subscribe({
      next: () => {
        this.loadingBuses = false;
      },
      error: async () => {
        this.loadingBuses = false;
        await this.showToast('No se pudieron cargar los buses', 'danger');
      }
    });
  }

  refreshRoutes() {
    if (this.loadingRoutes) {
      return;
    }
    this.loadingRoutes = true;
    this.busService.refreshRoutes().subscribe({
      next: () => {
        this.loadingRoutes = false;
      },
      error: async () => {
        this.loadingRoutes = false;
        await this.showToast('No se pudieron cargar las rutas', 'danger');
      }
    });
  }

  async openAddBusModal(mode: 'create' | 'edit' = 'create', bus?: Bus) {
    const modal = await this.modalCtrl.create({
      component: AddBusComponent,
      componentProps: {
        routes: this.routes,
        mode,
        busToEdit: bus
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.refreshBuses();
    }
  }

  async openAddRouteModal(mode: 'create' | 'edit' = 'create', route?: BusRoute) {
    const modal = await this.modalCtrl.create({
      component: AddRouteComponent,
      componentProps: {
        mode,
        routeToEdit: route
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data) {
      this.refreshRoutes();
    }
  }

  async openAssignDriverModal() {
    if (!this.buses.length || !this.drivers.length) {
      await this.showToast('Necesitas buses y conductores para asignar', 'warning');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: AssignDriverComponent,
      componentProps: {
        buses: this.buses,
        drivers: this.drivers
      }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.refresh) {
      this.refreshBuses();
    }
  }

  async deleteBus(bus: Bus) {
    const alert = await this.alertController.create({
      header: 'Eliminar bus',
      message: `¿Seguro deseas eliminar el bus ${bus.number}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            this.deletingBus[bus.id] = true;
            this.busService.deleteBus(bus.id).subscribe({
              next: async () => {
                delete this.deletingBus[bus.id];
                await this.showToast('Bus eliminado correctamente', 'success');
              },
              error: async () => {
                delete this.deletingBus[bus.id];
                await this.showToast('No se pudo eliminar el bus', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteRoute(route: BusRoute) {
    const alert = await this.alertController.create({
      header: 'Eliminar ruta',
      message: `¿Seguro deseas eliminar la ruta ${route.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: () => {
            this.deletingRoute[route.id] = true;
            this.busService.deleteRoute(route.id).subscribe({
              next: async () => {
                delete this.deletingRoute[route.id];
                await this.showToast('Ruta eliminada correctamente', 'success');
              },
              error: async () => {
                delete this.deletingRoute[route.id];
                await this.showToast('No se pudo eliminar la ruta', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async startSimulation(bus: Bus) {
    if (!bus.routeId) {
      await this.showToast('El bus no tiene una ruta asignada', 'warning');
      return;
    }

    this.startingSimulation[bus.id] = true;
    this.busService.startSimulation(bus.id, bus.routeId, this.currentUser?.id ?? '').subscribe({
      next: async () => {
        this.startingSimulation[bus.id] = false;
        await this.showToast('Simulación iniciada correctamente', 'success');
      },
      error: async () => {
        this.startingSimulation[bus.id] = false;
        await this.showToast('No se pudo iniciar la simulación', 'danger');
      }
    });
  }

  getRouteName(routeId: string): string {
    const route = this.routes.find(r => r.id === routeId);
    return route ? route.name : 'Sin ruta';
  }

  getDriverName(driverId?: string | null): string {
    if (!driverId) {
      return 'Sin asignar';
    }
    const driver = this.drivers.find(d => d.id === driverId);
    return driver ? driver.nombre || driver.correo : 'Sin asignar';
  }

  async openSimulationPrompt() {
    if (!this.buses.length) {
      await this.showToast('No hay buses disponibles para simular', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Iniciar simulación',
      inputs: this.buses.map(bus => ({
        type: 'radio',
        label: `${bus.number} · ${this.getRouteName(bus.routeId)}`,
        value: bus.id
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Iniciar',
          handler: (busId: string) => {
            const bus = this.buses.find(item => item.id === busId);
            if (bus) {
              this.startSimulation(bus);
            }
          }
        }
      ]
    });

    await alert.present();
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
  public getBusAsignado(driverId: string) {
    return this.buses.find(bus => bus.driverId === driverId)?.number || 'Sin asignar';
}
}
