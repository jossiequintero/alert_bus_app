import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bus, BusRoute, BusStop } from '../models/bus.model';

@Injectable({
  providedIn: 'root'
})
export class BusService {
  private busesSubject = new BehaviorSubject<Bus[]>([]);
  private routesSubject = new BehaviorSubject<BusRoute[]>([]);
  private stopsSubject = new BehaviorSubject<BusStop[]>([]);

  public buses$ = this.busesSubject.asObservable();
  public routes$ = this.routesSubject.asObservable();
  public stops$ = this.stopsSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Datos de ejemplo para desarrollo
    const mockRoutes: BusRoute[] = [
      {
        id: '1',
        name: 'Ruta Centro - Mall del Sol',
        description: 'Conecta el centro de Guayaquil con el Mall del Sol',
        estimatedDuration: 35,
        isActive: true,
        stops: [
          {
            id: '1',
            name: 'Parque Centenario',
            description: 'Parada principal en el centro histórico',
            location: { latitude: -2.1894, longitude: -79.8890 },
            order: 1
          },
          {
            id: '2',
            name: 'Mercado Central',
            description: 'Frente al mercado central de Guayaquil',
            location: { latitude: -2.1920, longitude: -79.8850 },
            order: 2
          },
          {
            id: '3',
            name: 'Mall del Sol',
            description: 'Terminal en el Mall del Sol',
            location: { latitude: -2.1700, longitude: -79.9000 },
            order: 3
          }
        ]
      },
      {
        id: '2',
        name: 'Ruta Norte - Sur',
        description: 'Recorre Guayaquil de norte a sur por la vía Perimetral',
        estimatedDuration: 50,
        isActive: true,
        stops: [
          {
            id: '4',
            name: 'Terminal Terrestre',
            description: 'Terminal terrestre de Guayaquil',
            location: { latitude: -2.1400, longitude: -79.9200 },
            order: 1
          },
          {
            id: '5',
            name: 'Hospital Luis Vernaza',
            description: 'Frente al hospital Luis Vernaza',
            location: { latitude: -2.1900, longitude: -79.8900 },
            order: 2
          },
          {
            id: '6',
            name: 'Universidad de Guayaquil',
            description: 'Entrada principal de la Universidad de Guayaquil',
            location: { latitude: -2.2200, longitude: -79.8700 },
            order: 3
          }
        ]
      },
      {
        id: '3',
        name: 'Ruta Malecón - Urdesa',
        description: 'Conecta el Malecón 2000 con Urdesa',
        estimatedDuration: 25,
        isActive: true,
        stops: [
          {
            id: '7',
            name: 'Malecón 2000',
            description: 'Parada en el Malecón 2000',
            location: { latitude: -2.1960, longitude: -79.8800 },
            order: 1
          },
          {
            id: '8',
            name: 'Plaza Lagos',
            description: 'Centro comercial Plaza Lagos',
            location: { latitude: -2.1800, longitude: -79.8900 },
            order: 2
          },
          {
            id: '9',
            name: 'Urdesa Central',
            description: 'Centro de Urdesa',
            location: { latitude: -2.1600, longitude: -79.9100 },
            order: 3
          }
        ]
      }
    ];

    const mockBuses: Bus[] = [
      {
        id: '1',
        number: 'G-101',
        driverId: 'driver1',
        routeId: '1',
        currentLocation: { latitude: -2.1850, longitude: -79.8870 },
        isActive: true,
        lastUpdate: new Date(),
        capacity: 50,
        currentPassengers: 25
      },
      {
        id: '2',
        number: 'G-102',
        driverId: 'driver2',
        routeId: '2',
        currentLocation: { latitude: -2.1750, longitude: -79.8950 },
        isActive: true,
        lastUpdate: new Date(),
        capacity: 50,
        currentPassengers: 30
      },
      {
        id: '3',
        number: 'G-103',
        driverId: 'driver3',
        routeId: '3',
        currentLocation: { latitude: -2.1900, longitude: -79.8850 },
        isActive: true,
        lastUpdate: new Date(),
        capacity: 40,
        currentPassengers: 18
      }
    ];

    this.routesSubject.next(mockRoutes);
    this.busesSubject.next(mockBuses);
    this.stopsSubject.next(mockRoutes.reduce((acc: any[], route: BusRoute) => acc.concat(route.stops), []));
  }

  getRoutes(): Observable<BusRoute[]> {
    return this.routes$;
  }

  getRouteById(id: string): BusRoute | undefined {
    return this.routesSubject.value.find(route => route.id === id);
  }

  getBuses(): Observable<Bus[]> {
    return this.buses$;
  }

  getBusesByRoute(routeId: string): Observable<Bus[]> {
    return new Observable(observer => {
      this.buses$.subscribe(buses => {
        const routeBuses = buses.filter(bus => bus.routeId === routeId);
        observer.next(routeBuses);
      });
    });
  }

  getStops(): Observable<BusStop[]> {
    return this.stops$;
  }

  getStopsByRoute(routeId: string): BusStop[] {
    const route = this.getRouteById(routeId);
    return route ? route.stops : [];
  }

  updateBusLocation(busId: string, latitude: number, longitude: number): void {
    const buses = this.busesSubject.value;
    const busIndex = buses.findIndex(bus => bus.id === busId);
    
    if (busIndex !== -1) {
      buses[busIndex].currentLocation = { latitude, longitude };
      buses[busIndex].lastUpdate = new Date();
      this.busesSubject.next([...buses]);
    }
  }

  registerBus(bus: Omit<Bus, 'id' | 'lastUpdate'>): Observable<Bus> {
    return new Observable(observer => {
      setTimeout(() => {
        const newBus: Bus = {
          ...bus,
          id: this.generateId(),
          lastUpdate: new Date()
        };
        
        const buses = this.busesSubject.value;
        this.busesSubject.next([...buses, newBus]);
        observer.next(newBus);
        observer.complete();
      }, 1000);
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
