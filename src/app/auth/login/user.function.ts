import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
//import {UserData, handleAuthError, validateUserData} from './utils';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}
/**
 * Registrar un nuevo usuario
 */
/*
export const registerUserCall = functions.https.onCall(async (data: any, context:any) => {
  try {
    // Validar datos de entrada
     // ✅ Permitir llamadas sin autenticación
     if (!context.auth && !data.correo) {
      throw new functions.https.HttpsError('unauthenticated', 'Debe incluir los datos del usuario');
    }

    const validation = validateUserData(data);
    if (!validation.isValid) {
      throw new functions.https.HttpsError('invalid-argument', validation.errors.join(', '));
    }


    const { nombre, apellidos, correo, password, roleId } = data;
    console.log({depuracion: data});
    
    
    // Crear usuario en Auth
    const userRecord = await admin.auth().createUser({
      email: correo,
      password,
      displayName: `${nombre} ${apellidos}`,
    });

    console.log({depuracion: userRecord});
    
    
    const db = admin.firestore();
    
    const userData: UserData = {
      user_id: userRecord.uid,
      correo,
      nombre: nombre,
      apellidos: apellidos,
      rol: {
        rol_id: roleId,
        descripcion: roleId === 1 ? 'Pasajero' : roleId === 2 ? 'Conductor' : 'Administrador'
      },
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log({depuracion: userData});
    

    // Guardar en Firestore
    await db.collection('usuarios').doc(userRecord.uid).set(userData);
    
    return { success: true, data: userData };
    
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    // Si es un HttpsError, lo re-lanzamos
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Usar utilidad para manejar errores de Auth
    throw handleAuthError(error);
  }
});
*/
export const registerUserRequest = functions.https.onRequest(async (req:any, res:any) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { user_id, correo, nombre, apellidos, contraseña, rol_id } = req.body;

    if (!user_id || !nombre || !correo || !contraseña || !rol_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, nombre, correo, contraseña, rol_id',
      });
    }

    const db = admin.firestore();
    const userData = {
      user_id,
      correo,
      nombre,
      apellidos: apellidos || '',
      fecha_registro: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('usuarios').doc(user_id).set(userData);

    return res.json({ success: true, data: userData });
  } catch (error: any) {
    console.error('Error registering user:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


/*
export const sumar = functions.https.onCall((data: any, context) => {
    const { a, b } = data;
    return { resultado: a + b };
});

export const mensaje  = functions.https.onCall((data: any, context)=>{
    return {mensaje: `Hola ${data.mensaje}`};
});
  */

