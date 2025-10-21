# 🚀 Configuración de Cloud Functions - AlertBus Guayaquil

## ✅ Estado del Proyecto

Las Cloud Functions han sido configuradas exitosamente con las siguientes características:

### 📁 Estructura Implementada
```
functions/
├── src/
│   ├── index.ts          # Funciones principales (alertas, usuarios)
│   ├── busFunctions.ts   # Funciones específicas de buses
│   └── utils.ts          # Utilidades y tipos TypeScript
├── lib/                  # Archivos JavaScript compilados
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración TypeScript
└── README.md            # Documentación detallada
```

### 🔧 Funciones Implementadas

#### **Alertas (15 funciones)**
- ✅ `getActiveAlerts` - Obtener alertas activas
- ✅ `createAlert` - Crear nueva alerta
- ✅ `updateAlertStatus` - Actualizar estado de alerta
- ✅ `getAlertsByBusLine` - Alertas por línea de bus
- ✅ `getAlertsByLocation` - Alertas por ubicación geográfica
- ✅ `getAlertsByType` - Alertas por tipo (delay, breakdown, etc.)
- ✅ `getUserAlerts` - Alertas de usuario específico
- ✅ `resolveAlert` - Marcar alerta como resuelta
- ✅ `getAlertStats` - Estadísticas de alertas

#### **Usuarios (2 funciones)**
- ✅ `registerUser` - Registrar nuevo usuario
- ✅ `getUserProfile` - Obtener perfil de usuario

#### **Rutas de Buses (2 funciones)**
- ✅ `getBusRoutes` - Obtener todas las rutas
- ✅ `getBusRouteById` - Información de ruta específica

#### **Funciones Automáticas (2 funciones)**
- ✅ `cleanupOldAlerts` - Limpieza automática (diaria)
- ✅ `sendAlertNotification` - Notificaciones push automáticas

### 🛠️ Configuración de Firebase

#### **Archivos de Configuración Creados:**
- ✅ `firebase.json` - Configuración principal
- ✅ `.firebaserc` - Configuración del proyecto
- ✅ `firestore.rules` - Reglas de seguridad
- ✅ `firestore.indexes.json` - Índices optimizados

### 📊 Base de Datos

#### **Colecciones Configuradas:**
- **`alerts`** - Alertas de usuarios
- **`users`** - Perfiles de usuarios
- **`busRoutes`** - Rutas de buses
- **`notifications`** - Notificaciones push
- **`userTokens`** - Tokens FCM para notificaciones

## 🚀 Próximos Pasos

### 1. **Configurar Firebase CLI**
```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Iniciar sesión en Firebase
firebase login

# Inicializar proyecto (si no está configurado)
firebase init
```

### 2. **Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp functions/.env.example functions/.env

# Editar variables de entorno
# Configurar FIREBASE_PROJECT_ID, claves de servicio, etc.
```

### 3. **Desplegar Funciones**
```bash
cd functions

# Compilar TypeScript
npm run build

# Desplegar todas las funciones
npm run deploy

# O desplegar función específica
firebase deploy --only functions:functionName
```

### 4. **Probar Localmente**
```bash
cd functions

# Ejecutar emulador local
npm run serve

# Las funciones estarán disponibles en:
# http://localhost:5001/alertbus-guayaquil/us-central1/[functionName]
```

### 5. **Integrar con Frontend**

#### **URLs de Producción:**
```
https://us-central1-alertbus-guayaquil.cloudfunctions.net/getActiveAlerts
https://us-central1-alertbus-guayaquil.cloudfunctions.net/createAlert
https://us-central1-alertbus-guayaquil.cloudfunctions.net/getAlertsByBusLine
# ... y todas las demás funciones
```

#### **Ejemplo de Uso en Angular/Ionic:**
```typescript
// En tu servicio Angular
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AlertService {
  private baseUrl = 'https://us-central1-alertbus-guayaquil.cloudfunctions.net';
  
  constructor(private http: HttpClient) {}
  
  getActiveAlerts() {
    return this.http.get(`${this.baseUrl}/getActiveAlerts`);
  }
  
  createAlert(alertData: any) {
    return this.http.post(`${this.baseUrl}/createAlert`, alertData);
  }
}
```

## 📋 Características Técnicas

### ✅ **Implementado:**
- **TypeScript** con tipado completo
- **Validación de datos** de entrada
- **Manejo de errores** consistente
- **CORS habilitado** para frontend
- **Reglas de seguridad** en Firestore
- **Índices optimizados** para consultas
- **Notificaciones push** automáticas
- **Limpieza automática** de datos antiguos
- **Compilación exitosa** sin errores

### 🔒 **Seguridad:**
- Reglas de Firestore configuradas
- Validación de tipos de datos
- Autenticación requerida para escritura
- CORS configurado correctamente

### 📈 **Rendimiento:**
- Índices de base de datos optimizados
- Consultas eficientes con filtros
- Limpieza automática de datos antiguos
- Funciones programadas para mantenimiento

## 🎯 URLs de las APIs

Todas las funciones estarán disponibles en:
```
https://us-central1-alertbus-guayaquil.cloudfunctions.net/[functionName]
```

### **Ejemplos de Uso:**

#### **Obtener Alertas Activas:**
```bash
curl https://us-central1-alertbus-guayaquil.cloudfunctions.net/getActiveAlerts
```

#### **Crear Nueva Alerta:**
```bash
curl -X POST https://us-central1-alertbus-guayaquil.cloudfunctions.net/createAlert \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "busLine": "LINEA_1",
    "location": {
      "latitude": -2.1894,
      "longitude": -79.8891
    },
    "description": "Bus retrasado 15 minutos",
    "type": "delay"
  }'
```

#### **Obtener Alertas por Línea:**
```bash
curl "https://us-central1-alertbus-guayaquil.cloudfunctions.net/getAlertsByBusLine?busLine=LINEA_1"
```

## 🎉 ¡Configuración Completada!

Las Cloud Functions están listas para ser desplegadas y utilizadas en tu aplicación AlertBus Guayaquil. Todas las funciones han sido compiladas exitosamente y están listas para producción.

### **Comandos Útiles:**
```bash
# Ver logs de funciones
firebase functions:log

# Ver logs en tiempo real
firebase functions:log --follow

# Ejecutar emulador local
cd functions && npm run serve

# Compilar y desplegar
cd functions && npm run build && npm run deploy
```

¡Tu backend está completamente configurado y listo para manejar todas las funcionalidades de AlertBus! 🚌✨
