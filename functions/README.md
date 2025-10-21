# AlertBus Cloud Functions

Este directorio contiene las Cloud Functions para la aplicación AlertBus Guayaquil.

## Estructura del Proyecto

```
functions/
├── src/
│   ├── index.ts          # Funciones principales
│   ├── busFunctions.ts   # Funciones específicas para buses
│   └── utils.ts          # Utilidades y tipos
├── package.json
├── tsconfig.json
└── README.md
```

## Funciones Disponibles

### Funciones de Alertas

#### `getActiveAlerts`
- **Método**: GET
- **Descripción**: Obtiene todas las alertas activas
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getActiveAlerts`

#### `createAlert`
- **Método**: POST
- **Descripción**: Crea una nueva alerta
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/createAlert`
- **Body**:
```json
{
  "userId": "string",
  "busLine": "string",
  "route": "string (opcional)",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "address": "string (opcional)"
  },
  "description": "string",
  "type": "delay|breakdown|crowded|safety|general"
}
```

#### `updateAlertStatus`
- **Método**: PUT
- **Descripción**: Actualiza el estado de una alerta
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/updateAlertStatus`
- **Body**:
```json
{
  "alertId": "string",
  "status": "active|resolved|cancelled"
}
```

#### `getAlertsByBusLine`
- **Método**: GET
- **Descripción**: Obtiene alertas por línea de bus
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getAlertsByBusLine?busLine=LINEA_1`

#### `getAlertsByLocation`
- **Método**: GET
- **Descripción**: Obtiene alertas por ubicación geográfica
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getAlertsByLocation?latitude=-2.1894&longitude=-79.8891&radius=5`

#### `getAlertsByType`
- **Método**: GET
- **Descripción**: Obtiene alertas por tipo
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getAlertsByType?type=delay`

#### `getUserAlerts`
- **Método**: GET
- **Descripción**: Obtiene alertas de un usuario específico
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getUserAlerts?userId=USER_ID`

#### `resolveAlert`
- **Método**: PUT
- **Descripción**: Marca una alerta como resuelta
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/resolveAlert`
- **Body**:
```json
{
  "alertId": "string",
  "resolvedBy": "string (opcional)"
}
```

### Funciones de Usuarios

#### `registerUser`
- **Método**: POST
- **Descripción**: Registra un nuevo usuario
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/registerUser`
- **Body**:
```json
{
  "uid": "string",
  "email": "string",
  "name": "string",
  "phone": "string (opcional)"
}
```

#### `getUserProfile`
- **Método**: GET
- **Descripción**: Obtiene el perfil de un usuario
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getUserProfile?uid=USER_ID`

### Funciones de Rutas de Buses

#### `getBusRoutes`
- **Método**: GET
- **Descripción**: Obtiene todas las rutas de buses
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getBusRoutes`

#### `getBusRouteById`
- **Método**: GET
- **Descripción**: Obtiene información de una ruta específica
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getBusRouteById?routeId=ROUTE_ID`

### Funciones de Estadísticas

#### `getAlertStats`
- **Método**: GET
- **Descripción**: Obtiene estadísticas de alertas
- **URL**: `https://us-central1-alertbus-guayaquil.cloudfunctions.net/getAlertStats`

### Funciones Automáticas

#### `cleanupOldAlerts`
- **Tipo**: Programada
- **Descripción**: Limpia alertas antiguas (ejecuta diariamente a las 2 AM)
- **Frecuencia**: Diaria

#### `sendAlertNotification`
- **Tipo**: Trigger
- **Descripción**: Envía notificaciones push cuando se crea una alerta
- **Trigger**: Creación de documento en colección 'alerts'

## Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- Firebase CLI
- Cuenta de Firebase

### Instalación
```bash
cd functions
npm install
```

### Desarrollo Local
```bash
# Compilar TypeScript
npm run build

# Ejecutar emulador local
npm run serve

# Ver logs
npm run logs
```

### Despliegue
```bash
# Desplegar todas las funciones
npm run deploy

# Desplegar función específica
firebase deploy --only functions:functionName
```

## Estructura de Base de Datos

### Colección: alerts
```typescript
{
  id: string;
  userId: string;
  busLine: string;
  route?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  description: string;
  type: 'delay' | 'breakdown' | 'crowded' | 'safety' | 'general';
  status: 'active' | 'resolved' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
}
```

### Colección: users
```typescript
{
  uid: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Colección: busRoutes
```typescript
{
  id: string;
  lineNumber: string;
  name: string;
  description?: string;
  stops: Array<{
    name: string;
    location: {
      latitude: number;
      longitude: number;
    };
  }>;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Configuración de Seguridad

Las reglas de Firestore están configuradas en `firestore.rules`:

- **Alertas**: Cualquiera puede leer, solo usuarios autenticados pueden escribir
- **Usuarios**: Solo el propietario puede leer/escribir su perfil
- **Rutas**: Cualquiera puede leer, solo usuarios autenticados pueden escribir
- **Notificaciones**: Solo el propietario puede acceder

## Monitoreo y Logs

Para ver logs de las funciones:
```bash
firebase functions:log
```

Para ver logs en tiempo real:
```bash
firebase functions:log --follow
```

## Notas de Desarrollo

1. Todas las funciones están tipadas con TypeScript
2. Se incluye validación de datos de entrada
3. Manejo de errores consistente
4. Respuestas en formato JSON estandarizado
5. Soporte para CORS habilitado
6. Funciones programadas para mantenimiento automático
