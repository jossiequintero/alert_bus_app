# Configuración para Guayaquil, Ecuador

## 🚌 AlertBus Guayaquil - Configuración Local

Esta aplicación está específicamente configurada para funcionar Ecuador con datos reales de la ciudad.

### 📍 Ubicaciones Configuradas

#### **Rutas de Autobús**

1. **Ruta Centro - Mall del Sol**
   - Parque Centenario (-2.1894, -79.8890)
   - Mercado Central (-2.1920, -79.8850)
   - Mall del Sol (-2.1700, -79.9000)

2. **Ruta Norte - Sur**
   - Terminal Terrestre (-2.1400, -79.9200)
   - Hospital Luis Vernaza (-2.1900, -79.8900)
   - Universidad de Guayaquil (-2.2200, -79.8700)

3. **Ruta Malecón - Urdesa**
   - Malecón 2000 (-2.1960, -79.8800)
   - Plaza Lagos (-2.1800, -79.8900)
   - Urdesa Central (-2.1600, -79.9100)

#### **Autobuses Activos**
- **G-101**: Ruta Centro - Mall del Sol
- **G-102**: Ruta Norte - Sur  
- **G-103**: Ruta Malecón - Urdesa

### 🗺️ Configuración de Google Maps

#### **Ubicación Central**
- **Latitud**: -2.1894
- **Longitud**: -79.8890
- **Ciudad**: Guayaquil, Ecuador
- **Zoom por defecto**: 13

#### **Límites Geográficos**
- **Norte**: -2.1000
- **Sur**: -2.2500
- **Este**: -79.8000
- **Oeste**: -79.9500

### 🔧 Configuración Requerida

#### **1. Google Maps API Key**
```html
<!-- En src/index.html -->
<script async defer src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&libraries=places,geometry"></script>
```

#### **2. APIs Habilitadas**
- Maps JavaScript API
- Places API
- Geocoding API
- Geolocation API

#### **3. Restricciones de API (Recomendado)**
- **HTTP referrers**: `localhost:8100/*`, `127.0.0.1:8100/*`
- **IP addresses**: Tu IP de desarrollo
- **Android apps**: Para compilación móvil
- **iOS apps**: Para compilación móvil

### 📱 Funcionalidades Específicas de Guayaquil

#### **Para Usuarios**
- Visualización de rutas reales de Guayaquil
- Alertas de proximidad basadas en ubicaciones reales
- Mapas centrados en la ciudad
- Paradas con nombres reconocibles

#### **Para Choferes**
- Registro de autobuses con numeración local (G-XXX)
- Rutas predefinidas de la ciudad
- Actualización de ubicación en tiempo real
- Gestión de paradas conocidas

### 🚀 Cómo Probar la Aplicación

1. **Configurar API Key**:
   ```bash
   # Editar src/index.html
   # Reemplazar YOUR_API_KEY con tu clave real
   ```

2. **Ejecutar la aplicación**:
   ```bash
   ionic serve
   ```

3. **Probar funcionalidades**:
   - Registrarse como usuario o chofer
   - Explorar las rutas de Guayaquil
   - Configurar alertas de proximidad
   - Ver autobuses en tiempo real

### 📊 Datos de Ejemplo

#### **Paradas Principales**
- **Parque Centenario**: Centro histórico de Guayaquil
- **Mercado Central**: Mercado principal de la ciudad
- **Mall del Sol**: Centro comercial más grande
- **Terminal Terrestre**: Terminal de buses interprovinciales
- **Hospital Luis Vernaza**: Hospital principal
- **Universidad de Guayaquil**: Universidad pública
- **Malecón 2000**: Paseo turístico del río Guayas
- **Plaza Lagos**: Centro comercial en el norte
- **Urdesa Central**: Zona comercial y residencial

#### **Características de las Rutas**
- **Duración estimada**: 25-50 minutos
- **Capacidad de buses**: 40-50 pasajeros
- **Frecuencia**: Cada 15-30 minutos
- **Horario**: 5:00 AM - 10:00 PM

### 🔍 Pruebas Recomendadas

1. **Geolocalización**:
   - Permitir acceso a ubicación
   - Verificar que detecte Guayaquil
   - Probar actualización de ubicación

2. **Mapas**:
   - Verificar que se centre en Guayaquil
   - Comprobar marcadores de paradas
   - Probar zoom y navegación

3. **Alertas**:
   - Configurar radio de proximidad
   - Simular llegada de autobús
   - Verificar notificaciones

4. **Rutas**:
   - Seleccionar diferentes rutas
   - Ver paradas en el mapa
   - Comprobar información de autobuses

### 📞 Soporte Local

Para soporte específico de Guayaquil:
- **Coordenadas**: Verificar con Google Maps
- **Rutas**: Consultar con autoridades de tránsito
- **Paradas**: Validar ubicaciones exactas
- **Horarios**: Confirmar con operadores

### 🌟 Próximas Mejoras

- [ ] Integración con sistema real de Metrovía
- [ ] Datos en tiempo real de buses
- [ ] Información de tráfico local
- [ ] Alertas de clima y eventos
- [ ] Integración con servicios de pago local
- [ ] Soporte para múltiples idiomas (español/inglés)
