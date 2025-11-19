export interface Bus {
  id: string;
  number: string;
  driverId: string;
  routeId: string;
  currentLocation: {
    latitude: number | 0;
    longitude: number | 0;
  } ;
  isActive: boolean;
  lastUpdate: Date | null;
  capacity: number;
  currentPassengers: number;
  placa?: string;
}

export interface BusRoute {
  id: string;
  name: string;
  description: string;
  stops: BusStop[];
  estimatedDuration: number; // en minutos
  isActive: boolean;
}

export interface BusStop {
  id: string;
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  order: number; // orden en la ruta
  estimatedArrival?: Date;
  actualArrival?: Date;
}
