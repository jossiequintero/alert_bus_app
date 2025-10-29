import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * Utilidades para las Cloud Functions
 */

export interface AlertData {
  id?: string;
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
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  resolvedBy?: string;
  resolvedAt?: admin.firestore.Timestamp;
}

export interface UserData {
  user_id: string;
  correo: string;
  nombre: string;
  apellidos?: string;
  rol?: RolData;
  fechaRegistro: admin.firestore.FieldValue | admin.firestore.Timestamp;
  fechaModificacion?: admin.firestore.FieldValue | admin.firestore.Timestamp;
}

export enum Rol {
  PASAJERO = 1,
  CONDUCTOR = 2,
  ADMIN = 3
}

export interface RolData{
  rol_id: number;
  descripcion: string;
}

export interface BusRoute {
  id?: string;
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
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'alert' | 'system' | 'promotion';
  data?: any;
  read: boolean;
  createdAt: admin.firestore.Timestamp;
}

/**
 * Validar datos de alerta
 */
export function validateAlertData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.userId) errors.push('userId is required');
  if (!data.busLine) errors.push('busLine is required');
  if (!data.location || !data.location.latitude || !data.location.longitude) {
    errors.push('location with latitude and longitude is required');
  }
  if (!data.type || !['delay', 'breakdown', 'crowded', 'safety', 'general'].includes(data.type)) {
    errors.push('type must be one of: delay, breakdown, crowded, safety, general');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validar datos de usuario para registro
 */
export function validateUserData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.nombre) errors.push('Nombre es requerido');
  if (!data.correo) errors.push('Correo es requerido');
  if (!data.correo.includes('@')) errors.push('Correo debe ser válido');
  if (!data.password) errors.push('Contraseña es requerida');
  if (data.password && data.password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calcular distancia entre dos puntos geográficos (en kilómetros)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Formatear respuesta de error
 */
export function formatErrorResponse(message: string, statusCode: number = 400) {
  return {
    success: false,
    error: message,
    statusCode
  };
}

/**
 * Manejar errores de Firebase Auth
 */
export function handleAuthError(error: any): functions.https.HttpsError {
  switch (error.code) {
    case 'auth/email-already-exists':
      return new functions.https.HttpsError('already-exists', 'El email ya está registrado');
    case 'auth/invalid-email':
      return new functions.https.HttpsError('invalid-argument', 'Email inválido');
    case 'auth/weak-password':
      return new functions.https.HttpsError('invalid-argument', 'La contraseña es muy débil');
    case 'auth/user-not-found':
      return new functions.https.HttpsError('not-found', 'Usuario no encontrado');
    case 'auth/wrong-password':
      return new functions.https.HttpsError('permission-denied', 'Contraseña incorrecta');
    case 'auth/too-many-requests':
      return new functions.https.HttpsError('resource-exhausted', 'Demasiados intentos, intenta más tarde');
    default:
      return new functions.https.HttpsError('internal', 'Error de autenticación');
  }
}

/**
 * Manejar errores de Firestore
 */
export function handleFirestoreError(error: any): functions.https.HttpsError {
  switch (error.code) {
    case 'permission-denied':
      return new functions.https.HttpsError('permission-denied', 'No tienes permisos para realizar esta acción');
    case 'not-found':
      return new functions.https.HttpsError('not-found', 'Documento no encontrado');
    case 'already-exists':
      return new functions.https.HttpsError('already-exists', 'El documento ya existe');
    case 'invalid-argument':
      return new functions.https.HttpsError('invalid-argument', 'Argumentos inválidos');
    default:
      return new functions.https.HttpsError('internal', 'Error de base de datos');
  }
}

/**
 * Formatear respuesta exitosa
 */
export function formatSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    data,
    message
  };
}

/**
 * Obtener timestamp actual
 */
export function getCurrentTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * Generar ID único para documentos
 */
export function generateId(): string {
  return admin.firestore().collection('temp').doc().id;
}

/**
 * Validar token de autenticación
 */
export async function validateAuthToken(token: string): Promise<{ isValid: boolean; uid?: string }> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      isValid: true,
      uid: decodedToken.uid
    };
  } catch (error) {
    console.error('Error validating token:', error);
    return {
      isValid: false
    };
  }
}

/**
 * Obtener configuración de la aplicación
 */
export async function getAppConfig(): Promise<any> {
  const db = admin.firestore();
  const configDoc = await db.collection('config').doc('app').get();
  
  if (!configDoc.exists) {
    // Crear configuración por defecto
    const defaultConfig = {
      appName: 'AlertBus Guayaquil',
      version: '1.0.0',
      maintenanceMode: false,
      maxAlertsPerUser: 10,
      alertExpirationHours: 24,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };
    
    await db.collection('config').doc('app').set(defaultConfig);
    return defaultConfig;
  }
  
  return configDoc.data();
}
