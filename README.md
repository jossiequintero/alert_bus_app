# AlertBus App - Guayaquil

Una aplicación móvil desarrollada con Ionic y Angular que permite a los usuarios de Guayaquil, Ecuador recibir alertas cuando un autobús esté cerca de su parada.

## Características

### Para Usuarios
- **Dashboard personalizado**: Visualiza autobuses cercanos y tu ubicación actual
- **Explorar rutas**: Ve todas las rutas disponibles con mapas interactivos
- **Alertas de proximidad**: Recibe notificaciones cuando un autobús esté cerca
- **Geolocalización**: Seguimiento en tiempo real de tu ubicación

### Para Choferes
- **Registro de autobús**: Registra tu autobús y asigna una ruta
- **Actualización de ubicación**: Actualiza tu ubicación en tiempo real
- **Control de servicio**: Inicia/detén el servicio de tu autobús
- **Gestión de paradas**: Marca llegadas a paradas específicas

## Tecnologías Utilizadas

- **Ionic 8**: Framework para aplicaciones móviles híbridas
- **Angular 20**: Framework web para la lógica de la aplicación
- **Google Maps API**: Para mapas y geolocalización
- **Capacitor**: Para acceso a funcionalidades nativas del dispositivo
- **TypeScript**: Lenguaje de programación principal

## Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <repository-url>
   cd alert_bus_app
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```

3. **Configura Google Maps API**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la API de Google Maps JavaScript
   - Crea una clave de API
   - Reemplaza `YOUR_API_KEY` en `src/index.html` con tu clave real

4. **Ejecuta la aplicación**:
   ```bash
   ionic serve
   npx cap run android
   ionic build
   ionic capacitor run android -l --external --target=YXCI5XRCEMLBKJZD

   ```

## Configuración de Google Maps

1. Obtén una clave de API de Google Maps:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Habilita las siguientes APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Crea una clave de API
   - Configura las restricciones de la clave según tus necesidades

2. Actualiza la configuración:
   - Reemplaza `YOUR_API_KEY` en `src/index.html`
   - Actualiza `src/environments/google-maps.config.ts` si es necesario

## Estructura del Proyecto

```
src/
├── app/
│   ├── models/           # Modelos de datos (User, Bus, Alert)
│   ├── services/         # Servicios (Auth, Geolocation, Bus, Alert)
│   ├── auth/            # Páginas de autenticación
│   ├── user/            # Páginas para usuarios
│   ├── driver/          # Páginas para choferes
│   └── home/            # Página principal
├── assets/              # Recursos estáticos
└── environments/        # Configuraciones de entorno
```

## Funcionalidades Principales

### Sistema de Autenticación
- Login/Registro con selección de rol (Usuario/Chofer)
- Gestión de sesiones
- Redirección automática basada en rol

### Geolocalización
- Obtención de ubicación actual
- Seguimiento continuo de ubicación
- Cálculo de distancias entre puntos
- Verificación de proximidad

### Sistema de Alertas
- Alertas de proximidad automáticas
- Notificaciones push locales
- Configuración personalizable de alertas
- Historial de alertas

### Gestión de Autobuses
- Registro de autobuses por choferes
- Actualización de ubicación en tiempo real
- Control de estado (activo/inactivo)
- Gestión de rutas y paradas

## Desarrollo

### Comandos Útiles

```bash
# Servidor de desarrollo
ionic serve

# Construir para producción
ionic build

# Ejecutar tests
npm test

# Linting
npm run lint
```

### Datos de Ejemplo - Guayaquil

La aplicación incluye datos de ejemplo específicos de Guayaquil, Ecuador:
- **3 rutas de autobús**:
  - **Ruta Centro - Mall del Sol**: Parque Centenario → Mercado Central → Mall del Sol
  - **Ruta Norte - Sur**: Terminal Terrestre → Hospital Luis Vernaza → Universidad de Guayaquil
  - **Ruta Malecón - Urdesa**: Malecón 2000 → Plaza Lagos → Urdesa Central
- **3 autobuses activos** (G-101, G-102, G-103)
- **9 paradas** distribuidas en las rutas con coordenadas reales de Guayaquil
- **Ubicación por defecto**: Centro de Guayaquil (-2.1894, -79.8890)

### Agregar Nuevas Funcionalidades

1. **Nuevos Modelos**: Agrega en `src/app/models/`
2. **Nuevos Servicios**: Agrega en `src/app/services/`
3. **Nuevas Páginas**: Usa `ionic generate page <name>`
4. **Nuevas Rutas**: Actualiza `src/app/app-routing.module.ts`

## Despliegue

### Para Web
```bash
ionic build --prod
```

### Para Móvil
```bash
# Android
ionic capacitor add android
ionic capacitor run android

# iOS
ionic capacitor add ios
ionic capacitor run ios
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Si tienes preguntas o necesitas ayuda, por favor:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de Ionic y Angular

## Roadmap

- [ ] Integración con backend real
- [ ] Notificaciones push en la nube
- [ ] Sistema de pagos
- [ ] Chat entre usuarios y choferes
- [ ] Análisis de tráfico en tiempo real
- [ ] Integración con sistemas de transporte público existentes
