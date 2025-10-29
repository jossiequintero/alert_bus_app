import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as express from 'express';

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}


const app = express();
app.use(cors({ origin: true }));

// ===== FUNCIONES PARA ALERTAS DE BUSES =====

/**
 * Obtener todas las alertas activas
 */
/*
export const getActiveAlerts = functions.https.onRequest((req, res) => {
  const db = admin.firestore();
  
  db.collection('alerts')
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
      console.error('Error getting alerts:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});

/**
 * Crear una nueva alerta
 */
/*
export const createAlert = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { userId, busLine, route, location, description, type } = req.body;

  if (!userId || !busLine || !location) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: userId, busLine, location' 
    });
    return;
  }

  const db = admin.firestore();
  const alertData = {
    userId,
    busLine,
    route: route || '',
    location,
    description: description || '',
    type: type || 'general',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  db.collection('alerts').add(alertData)
    .then(docRef => {
      res.json({ 
        success: true, 
        data: { id: docRef.id, ...alertData } 
      });
    })
    .catch(error => {
      console.error('Error creating alert:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});
*/
/**
 * Actualizar el estado de una alerta
 */
/*
export const updateAlertStatus = functions.https.onRequest((req, res) => {
  if (req.method !== 'PUT') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { alertId, status } = req.body;

  if (!alertId || !status) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: alertId, status' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('alerts').doc(alertId).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    res.json({ success: true, message: 'Alert updated successfully' });
  })
  .catch(error => {
    console.error('Error updating alert:', error);
    res.status(500).json({ success: false, error: error.message });
  });
});
*/
/**
 * Obtener alertas por línea de bus
 */
/*
export const getAlertsByBusLine = functions.https.onRequest((req, res) => {
  const { busLine } = req.query;

  if (!busLine) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required parameter: busLine' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('alerts')
    .where('busLine', '==', busLine)
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
      console.error('Error getting alerts by bus line:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});
*/
/**
 * Obtener estadísticas de alertas
 */
/*
export const getAlertStats = functions.https.onRequest((req, res) => {
  const db = admin.firestore();
  
  Promise.all([
    db.collection('alerts').where('status', '==', 'active').get(),
    db.collection('alerts').where('status', '==', 'resolved').get(),
    db.collection('alerts').get()
  ])
  .then(([activeSnapshot, resolvedSnapshot, allSnapshot]) => {
    const stats: any = {
      total: allSnapshot.size,
      active: activeSnapshot.size,
      resolved: resolvedSnapshot.size,
      busLines: {}
    };

    // Contar por línea de bus
    allSnapshot.forEach(doc => {
      const data = doc.data();
      const busLine = data.busLine;
      if (!stats.busLines[busLine]) {
        stats.busLines[busLine] = 0;
      }
      stats.busLines[busLine]++;
    });

    res.json({ success: true, data: stats });
  })
  .catch(error => {
    console.error('Error getting alert stats:', error);
    res.status(500).json({ success: false, error: error.message });
  });
});
*/
/**
 * Función para limpiar alertas antiguas (ejecutar diariamente)
 */
/*
export const cleanupOldAlerts = functions.pubsub
  .schedule('0 2 * * *') // Ejecutar a las 2 AM todos los días
  .timeZone('America/Guayaquil')
  .onRun(async (context) => {
    const db = admin.firestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldAlerts = await db.collection('alerts')
      .where('createdAt', '<', thirtyDaysAgo)
      .where('status', '==', 'resolved')
      .get();

    const batch = db.batch();
    oldAlerts.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${oldAlerts.size} old alerts`);
  });
*/

// ===== FUNCIONES PARA USUARIOS =====

/**
 * Registrar un nuevo usuario
 */
/*
export const registerUser = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { user_id, correo, nombre,apellidos, contraseña, rol_id } = req.body;

  if (!user_id || !nombre || !correo || !contraseña || !rol_id) {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: user_id, nombre, correo, contraseña, rol_id' 
    });
    return;
  }

  const db = admin.firestore();
  const userData = {
    user_id,
    correo,
    nombre: nombre || '',
    apellidos: apellidos || '',
    fecha_registro: admin.firestore.FieldValue.serverTimestamp()
  };

  db.collection('usuarios').doc(user_id).set(userData)
    .then(() => {
      res.json({ success: true, data: userData });
    })
    .catch(error => {
      console.error('Error registering user:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});
*/

/**
 * Obtener perfil de usuario
 */
/*export const getUserProfile = functions.https.onRequest((req, res) => {
  const { uid } = req.query;

  if (!uid || typeof uid !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: 'Missing required parameter: uid' 
    });
    return;
  }

  const db = admin.firestore();
  
  db.collection('users').doc(uid).get()
    .then(doc => {
      if (!doc.exists) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }
      res.json({ success: true, data: { id: doc.id, ...doc.data() } });
    })
    .catch(error => {
      console.error('Error getting user profile:', error);
      res.status(500).json({ success: false, error: error.message });
    });
});*/

// Importar funciones específicas de buses
//export * from './busFunctions';
//export * from './userFunctions';
//export * from './userFunctions';

export * from "./user.function";
//Object.assign(exports, userFunctions);


// Exportar la aplicación Express
export const api = functions.https.onRequest(app);
