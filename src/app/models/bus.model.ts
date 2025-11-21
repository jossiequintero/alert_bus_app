export interface Bus {
  id: string;
  number: string;
  driverId?: string | null;
  routeId: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  isActive: boolean;
  lastUpdate?: Date | null;
  capacity: number;
  currentPassengers: number;
  placa?: string;
  simulationId?: string | null;
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
