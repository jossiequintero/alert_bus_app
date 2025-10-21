import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Obtener todas las rutas de buses disponibles
 */
export const getBusRoutes = functions.https.onRequest((req, res) => {
  const db = admin.firestore();
  
  db.collection('busRoutes')
    .orderBy('lineNumber', 'asc')
    .get()
    .then(snapshot => {
      const routes: any[] = [];
      snapshot.forEach(doc => {
        routes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      res.json({ success: true, data: routes });
    })
    .catch(error => {
      console.error('Error getting bus routes:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});

/**
 * Obtener información de una ruta específica
 */
export const getBusRouteById = functions.https.onRequest((req, res) => {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required parameter: routeId' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('busRoutes').doc(routeId).get()
    .then(doc => {
      if (!doc.exists) {
        res.status(404).json({ 
          success: false, 
          error: 'Route not found' 
        });
        return;
      }
      res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    })
    .catch(error => {
      console.error('Error getting bus route:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});

/**
 * Obtener alertas por ubicación geográfica
 */
export const getAlertsByLocation = functions.https.onRequest((req, res) => {
  const { latitude, longitude, radius } = req.query;

  if (!latitude || !longitude) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required parameters: latitude, longitude' 
    });
    return;
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const searchRadius = radius ? parseFloat(radius as string) : 5; // 5km por defecto

  const db = admin.firestore();
  
  // Obtener todas las alertas activas y filtrar por distancia
  db.collection('alerts')
    .where('status', '==', 'active')
    .get()
    .then(snapshot => {
      const alerts: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.location && data.location.latitude && data.location.longitude) {
          const distance = calculateDistance(
            lat, lng, 
            data.location.latitude, 
            data.location.longitude
          );
          
          if (distance <= searchRadius) {
            alerts.push({
              id: doc.id,
              ...data,
              distance: distance
            });
          }
        }
      });
      
      // Ordenar por distancia
      alerts.sort((a, b) => a.distance - b.distance);
      
      res.json({ success: true, data: alerts });
    })
    .catch(error => {
      console.error('Error getting alerts by location:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});

/**
 * Función para calcular distancia entre dos puntos geográficos
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Obtener alertas por usuario
 */
export const getUserAlerts = functions.https.onRequest((req, res) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required parameter: userId' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('alerts')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()
    .then(snapshot => {
      const alerts: any[] = [];
      snapshot.forEach(doc => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      res.json({ success: true, data: alerts });
    })
    .catch(error => {
      console.error('Error getting user alerts:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});

/**
 * Marcar alerta como resuelta
 */
export const resolveAlert = functions.https.onRequest((req, res) => {
  if (req.method !== 'PUT') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { alertId, resolvedBy } = req.body;

  if (!alertId) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required field: alertId' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('alerts').doc(alertId).update({
    status: 'resolved',
    resolvedBy: resolvedBy || null,
    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    res.json({ success: true, message: 'Alert resolved successfully' });
  })
  .catch(error => {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: error.message });
  });
});

/**
 * Obtener alertas por tipo
 */
export const getAlertsByType = functions.https.onRequest((req, res) => {
  const { type } = req.query;

  if (!type || typeof type !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required parameter: type' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('alerts')
    .where('type', '==', type)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .get()
    .then(snapshot => {
      const alerts: any[] = [];
      snapshot.forEach(doc => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      res.json({ success: true, data: alerts });
    })
    .catch(error => {
      console.error('Error getting alerts by type:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});

/**
 * Función para enviar notificaciones push cuando se crea una alerta
 */
export const sendAlertNotification = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alertData = snap.data();
    
    // Obtener tokens de usuarios que siguen esta línea de bus
    const db = admin.firestore();
    const userTokens = await db.collection('userTokens')
      .where('busLines', 'array-contains', alertData.busLine)
      .get();

    if (userTokens.empty) {
      console.log('No users subscribed to this bus line');
      return;
    }

    const tokens: string[] = [];
    userTokens.forEach(doc => {
      tokens.push(doc.data().token);
    });

    const message = {
      notification: {
        title: `Alerta en línea ${alertData.busLine}`,
        body: alertData.description || 'Nueva alerta reportada',
      },
      data: {
        alertId: context.params.alertId,
        busLine: alertData.busLine,
        type: alertData.type
      },
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`Successfully sent notification to ${response.successCount} devices`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });
