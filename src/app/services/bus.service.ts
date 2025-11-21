import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { Bus, BusRoute, BusStop } from '../models/bus.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BusService {
  private readonly apiUrl = environment.apiUrl;

  private busesSubject = new BehaviorSubject<Bus[]>([]);
  private routesSubject = new BehaviorSubject<BusRoute[]>([]);
  private stopsSubject = new BehaviorSubject<BusStop[]>([]);

  public buses$ = this.busesSubject.asObservable();
  public routes$ = this.routesSubject.asObservable();
  public stops$ = this.stopsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshRoutes().subscribe();
    this.refreshBuses().subscribe();
  }

  getRoutes(): Observable<BusRoute[]> {
    return this.routes$;
  }

  getBuses(): Observable<Bus[]> {
    return this.buses$;
  }

  getRouteById(id: string): BusRoute | undefined {
    return this.routesSubject.value.find(route => route.id === id);
  }

  getStopsByRoute(routeId: string): BusStop[] {
    const route = this.getRouteById(routeId);
    return route ? route.stops : [];
  }

  updateBusLocation(busId: string, latitude: number, longitude: number): void {
    const buses = [...this.busesSubject.value];
    const busIndex = buses.findIndex(bus => bus.id === busId);
    if (busIndex !== -1) {
      buses[busIndex] = {
        ...buses[busIndex],
        currentLocation: { latitude, longitude },
        lastUpdate: new Date()
      };
      this.busesSubject.next(buses);
    }
  }

  refreshBuses(): Observable<Bus[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}buses`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener buses');
        }
        return response.data.map(bus => this.mapBus(bus));
      }),
      tap(buses => this.busesSubject.next(buses)),
      catchError(error => {
        console.error('Error al refrescar buses', error);
        return throwError(() => error);
      })
    );
  }

  refreshRoutes(): Observable<BusRoute[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}routes`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al obtener rutas');
        }
        return response.data.map((route: any) => this.mapRoute(route)) as BusRoute[];
      }),
      tap((routes: BusRoute[]) => {
        this.routesSubject.next(routes);
  
        const stops = routes.flatMap((route: BusRoute) => route.stops);
        this.stopsSubject.next(stops);
      }),
      catchError(error => {
        console.error('Error al refrescar rutas', error);
        return throwError(() => error);
      })
    );
  }
  

  registerBus(bus: Omit<Bus, 'id' | 'lastUpdate' | 'currentPassengers'> & { placa: string }): Observable<Bus> {
    const id = uuidv4();
    const payload = {
      id,
      placa: bus.placa,
      number: bus.number,
      routeId: bus.routeId,
      capacity: bus.capacity,
      driverId: bus.driverId
    };

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}buses/registrar`, payload).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al registrar el bus');
        }
        return this.mapBus(response.data);
      }),
      tap(newBus => {
        const buses = [...this.busesSubject.value, { ...newBus, currentPassengers: newBus.currentPassengers ?? 0 }];
        this.busesSubject.next(buses);
      })
    );
  }

  updateBus(busId: string, data: Partial<Bus>): Observable<Bus> {
    const payload: Record<string, any> = {};
    if (data.placa !== undefined) payload['placa'] = data.placa;
    if (data.number !== undefined) payload['number'] = data.number;
    if (data.routeId !== undefined) payload['routeId'] = data.routeId;
    if (data.capacity !== undefined) payload['capacity'] = data.capacity;
    if (data.isActive !== undefined) payload['isActive'] = data.isActive;

    return this.http.put<ApiResponse<any>>(`${this.apiUrl}buses/${busId}`, payload).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al actualizar el bus');
        }
        return this.mapBus(response.data);
      }),
      tap(updatedBus => {
        const buses = this.busesSubject.value.map(bus => bus.id === updatedBus.id ? { ...updatedBus, currentPassengers: bus.currentPassengers } : bus);
        this.busesSubject.next(buses);
      })
    );
  }

  deleteBus(busId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}buses/${busId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al eliminar el bus');
        }
        return true;
      }),
      tap(() => {
        const buses = this.busesSubject.value.filter(bus => bus.id !== busId);
        this.busesSubject.next(buses);
      })
    );
  }

  addRoute(route: {
    name: string;
    descripcion?: string;
    tiempoRecorrido: number;
    stops: Array<{
      id?: string;
      nombre: string;
      descripcion?: string;
      latitud: number;
      longitud: number;
      order?: number;
    }>;
    isActive?: boolean;
  }): Observable<BusRoute> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}routes`, route).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al registrar la ruta');
        }
        return this.mapRoute(response.data);
      }),
      tap(newRoute => {
        this.routesSubject.next([...this.routesSubject.value, newRoute]);
      })
    );
  }

  updateRoute(
    routeId: string,
    route: Partial<Omit<BusRoute, 'stops' | 'estimatedDuration'>> & { stops?: any[]; estimatedDuration?: number }
  ): Observable<BusRoute> {
    const payload: Record<string, any> = {};
    if (route.name !== undefined) payload['name'] = route.name;
    if (route.description !== undefined) payload['descripcion'] = route.description;
    if (route.estimatedDuration !== undefined) payload['tiempoRecorrido'] = route.estimatedDuration;
    if (typeof route.isActive === 'boolean') payload['isActive'] = route.isActive;
    if (route.stops !== undefined) payload['stops'] = route.stops;

    return this.http.put<ApiResponse<any>>(`${this.apiUrl}routes/${routeId}`, payload).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al actualizar la ruta');
        }
        return this.mapRoute(response.data);
      }),
      tap(updatedRoute => {
        const routes = this.routesSubject.value.map(routeItem => routeItem.id === updatedRoute.id ? updatedRoute : routeItem);
        this.routesSubject.next(routes);
      })
    );
  }

  deleteRoute(routeId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}routes/${routeId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al eliminar la ruta');
        }
        return true;
      }),
      tap(() => {
        const routes = this.routesSubject.value.filter(route => route.id !== routeId);
        this.routesSubject.next(routes);
      })
    );
  }

  assignDriver(busId: string, driverId: string): Observable<Bus> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}buses/assign-driver`, { busId, driverId }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al asignar conductor');
        }
        return this.mapBus(response.data);
      }),
      tap(updatedBus => {
        const buses = this.busesSubject.value.map(bus => bus.id === updatedBus.id ? { ...updatedBus, currentPassengers: bus.currentPassengers } : bus);
        this.busesSubject.next(buses);
      })
    );
  }

  startSimulation(busId: string, routeId: string, adminId?: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}buses/start-simulation`, {
      busId,
      routeId,
      adminId
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Error al iniciar la simulación');
        }
        return response.data;
      })
    );
  }

  private mapBus(data: any): Bus {
    const lastUpdate = this.toDate(data.updatedAt || data.fecha_actualizacion);

    return {
      id: data.id || data.bus_id,
      number: data.number || data.numero || '',
      driverId: data.driverId ?? data.conductor_id ?? null,
      routeId: data.routeId || data.ruta_id || '',
      currentLocation: data.currentLocation || {
        latitude: data.currentLocation?.latitude ?? 0,
        longitude: data.currentLocation?.longitude ?? 0
      },
      isActive: data.isActive ?? data.estado ?? false,
      lastUpdate,
      capacity: data.capacity ?? data.capacidad ?? 0,
      currentPassengers: data.currentPassengers ?? data.current_passengers ?? 0,
      placa: data.placa,
      simulationId: data.simulationId ?? data.simulacion_id ?? null
    };
  }

  private mapRoute(data: any): BusRoute {
    const stops = (data.stops || []).map((stop: any, index: number) => ({
      id: stop.id || `${data.id || data.route_id}-stop-${index + 1}`,
      name: stop.name || stop.nombre || `Parada ${index + 1}`,
      description: stop.description || stop.descripcion || '',
      location: {
        latitude: stop.location?.latitude ?? stop.latitud ?? 0,
        longitude: stop.location?.longitude ?? stop.longitud ?? 0
      },
      order: stop.order ?? stop.orden ?? index + 1
    }));

    return {
      id: data.id || data.route_id,
      name: data.name || '',
      description: data.description || data.descripcion || '',
      estimatedDuration: data.estimatedDuration ?? data.tiempoRecorrido ?? data.tiempo_recorrido ?? 0,
      isActive: data.isActive ?? data.estado ?? true,
      stops
    };
  }

  private toDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value.toDate === 'function') {
      return value.toDate();
    }

    if (typeof value === 'object' && (value.seconds || value._seconds)) {
      const seconds = value.seconds ?? value._seconds;
      return new Date(seconds * 1000);
    }

    return new Date(value);
  }
}
