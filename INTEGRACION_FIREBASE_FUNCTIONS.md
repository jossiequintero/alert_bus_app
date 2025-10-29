# Integración con Firebase Functions - registerUser

## Descripción
Se ha integrado la función `registerUser` de Firebase Functions con el componente de login para permitir el registro de usuarios en Firebase Firestore.

## Archivos Modificados

### 1. `src/app/services/firebase-functions.service.ts` (NUEVO)
Servicio HTTP para comunicarse con Firebase Functions:
- Método `registerUser()` que llama a la función `registerUser` de Firebase
- Manejo de errores y respuestas
- Configuración de headers HTTP

### 2. `src/app/services/auth.service.ts`
Actualizado para usar Firebase Functions:
- Inyección del `FirebaseFunctionsService`
- Método `register()` ahora hace llamadas reales a Firebase Functions
- Mapeo de roles de texto a números según la función backend
- Manejo de errores de la API

### 3. `src/app/auth/login/login.page.ts`
Mejorado con validaciones:
- Agregado campo `confirmPassword` al formulario
- Validador personalizado `passwordMatchValidator()` para verificar que las contraseñas coincidan
- Mejor manejo de errores con mensajes específicos

### 4. `src/app/auth/login/login.page.html`
Interfaz actualizada:
- Campo de confirmación de contraseña (solo visible en modo registro)
- Mensaje de error visual cuando las contraseñas no coinciden
- Validación en tiempo real

### 5. `src/app/app.module.ts`
Configuración de módulos:
- Agregado `HttpClientModule` para realizar llamadas HTTP

### 6. `src/environments/environment.ts`
Configuración de entorno:
- URL de Firebase Functions
- Configuración de Google Maps
- Configuración específica para Guayaquil

## Configuración Requerida

### 1. URL de Firebase Functions
Actualiza la URL en `src/environments/environment.ts`:
```typescript
firebaseFunctionsUrl: 'https://us-central1-TU-PROYECTO-ID.cloudfunctions.net'
```

### 2. Despliegue de Firebase Functions
Asegúrate de que las funciones estén desplegadas:
```bash
cd functions
npm run deploy
```

## Flujo de Registro

1. **Usuario llena el formulario** con email, contraseña, confirmación de contraseña y rol
2. **Validación local** verifica que las contraseñas coincidan
3. **Llamada a Firebase Functions** envía los datos a la función `registerUser`
4. **Respuesta del servidor** confirma el registro o muestra error
5. **Almacenamiento local** guarda la sesión del usuario
6. **Redirección** según el rol del usuario

## Estructura de Datos

### Request a Firebase Functions:
```typescript
{
  user_id: string,
  correo: string,
  nombre: string,
  apellidos?: string,
  contraseña: string,
  rol_id: number // 1: Pasajero, 2: Chofer, 3: Admin
}
```

### Response de Firebase Functions:
```typescript
{
  success: boolean,
  data?: any,
  error?: string
}
```

## Mapeo de Roles

| Rol en Frontend | ID en Backend | Descripción |
|----------------|---------------|-------------|
| pasajero       | 1            | Usuario regular |
| chofer         | 2            | Conductor de bus |
| admin          | 3            | Administrador |

## Manejo de Errores

- **Error de conexión**: "Error de conexión al registrar usuario"
- **Error del servidor**: Muestra el mensaje específico del servidor
- **Validación local**: "Las contraseñas no coinciden"

## Próximos Pasos

1. **Configurar la URL real** de Firebase Functions
2. **Implementar autenticación real** con Firebase Auth
3. **Agregar validación de email único** en el backend
4. **Implementar recuperación de contraseña**
5. **Agregar verificación de email**

## Testing

Para probar la integración:

1. Asegúrate de que Firebase Functions esté desplegado
2. Configura la URL correcta en environment.ts
3. Ejecuta la aplicación: `ionic serve`
4. Ve a la página de login
5. Cambia a modo registro
6. Llena el formulario y verifica que se guarde en Firestore
