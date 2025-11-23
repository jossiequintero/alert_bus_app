import { Request, Response } from "express";
import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";

if (!admin.apps.length) {
    admin.initializeApp();
  }

  
const db = admin.firestore();

/**
 * Registrar un nuevo usuario
 */
export async function registrarUsuario(req: Request, res: Response) {
  try {
    const { user_id, nombre, apellidos, correo, contraseña, rol_id } = req.body;

    if (!user_id || !nombre || !correo || !contraseña || !rol_id) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: user_id, nombre, correo, contraseña, rol_id",
      });
    }
      // 🔐 Encriptar la contraseña antes de guardarla
    const salt = bcrypt.genSaltSync(10); // nivel de seguridad (10 es un buen punto)
    const hashedPassword = bcrypt.hashSync(contraseña, salt);

    const userQuery = await db.collection("usuarios").where("correo", "==", correo).limit(1).get();
    
    if (!userQuery.empty) {
      return res.status(409).json({
        success: false,
        error: "El Usuario ya se encuentra registrado.",
      });
    }
    const userData:any = {
      user_id,
      nombre,
      apellidos: apellidos || "",
      correo,
      rol_id,
      contraseña: hashedPassword,
      fecha_registro: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("usuarios").doc(user_id).set(userData);

    delete userData.contraseña;
    return res.status(201).json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function loginUsuario(req: Request, res: Response) {
  try {
    const { correo, contraseña } = req.body;

    // ✅ Validación básica
    if (!correo || !contraseña) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: correo, contraseña",
      });
    }

    // 🔍 Buscar usuario por correo
    const userQuery = await db.collection("usuarios").where("correo", "==", correo).limit(1).get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // 🔐 Comparar contraseñas
    const passwordValida = bcrypt.compareSync(contraseña, userData.contraseña);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        error: "Contraseña incorrecta",
      });
    }

    // ⚠️ No incluir contraseña en la respuesta
    delete userData.contraseña;

    // (Opcional) Aquí podrías generar un token JWT si quisieras autenticar sesiones
    // const token = jwt.sign({ uid: userDoc.id, rol: userData.rol_id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: userData,
      // token, // si implementas JWT
    });

  } catch (error: any) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Listar todos los usuarios
 */
export async function listarUsuarios(req: Request, res: Response) {
  try {
    const snapshot = await db.collection("usuarios").get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.json({
      success: true,
      data: usuarios,
    });
  } catch (error: any) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Guardar token de notificaciones push para un usuario
 */
export async function guardarTokenPush(req: Request, res: Response) {
  try {
    const { userId, token, platform } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: userId, token",
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("usuarios").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Guardar o actualizar el token en la colección de tokens
    const tokenData: any = {
      userId,
      token,
      platform: platform || "android",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Buscar si ya existe un token para este usuario y plataforma
    const tokenQuery = await db
      .collection("push_tokens")
      .where("userId", "==", userId)
      .where("platform", "==", platform || "android")
      .limit(1)
      .get();

    if (!tokenQuery.empty) {
      // Actualizar token existente
      const tokenDoc = tokenQuery.docs[0];
      await tokenDoc.ref.update(tokenData);
      
      return res.status(200).json({
        success: true,
        message: "Token actualizado exitosamente",
        data: { tokenId: tokenDoc.id, ...tokenData },
      });
    } else {
      // Crear nuevo token
      tokenData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const tokenRef = await db.collection("push_tokens").add(tokenData);
      
      return res.status(201).json({
        success: true,
        message: "Token guardado exitosamente",
        data: { tokenId: tokenRef.id, ...tokenData },
      });
    }
  } catch (error: any) {
    console.error("Error al guardar token push:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Guardar o actualizar configuración de alertas de un usuario
 */
export async function guardarConfiguracionAlertas(req: Request, res: Response) {
  try {
    const { userId, proximityRadius, advanceTime, isEnabled, soundEnabled, vibrationEnabled } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Campo requerido: userId",
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("usuarios").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const alertSettingsData: any = {
      userId,
      proximityRadius: proximityRadius ?? 500,
      advanceTime: advanceTime ?? 5,
      isEnabled: isEnabled ?? true,
      soundEnabled: soundEnabled ?? true,
      vibrationEnabled: vibrationEnabled ?? true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Buscar si ya existe configuración para este usuario
    const settingsQuery = await db
      .collection("alert_settings")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!settingsQuery.empty) {
      // Actualizar configuración existente
      const settingsDoc = settingsQuery.docs[0];
      await settingsDoc.ref.update(alertSettingsData);
      
      return res.status(200).json({
        success: true,
        message: "Configuración actualizada exitosamente",
        data: { id: settingsDoc.id, ...alertSettingsData },
      });
    } else {
      // Crear nueva configuración
      alertSettingsData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const settingsRef = await db.collection("alert_settings").add(alertSettingsData);
      
      return res.status(201).json({
        success: true,
        message: "Configuración guardada exitosamente",
        data: { id: settingsRef.id, ...alertSettingsData },
      });
    }
  } catch (error: any) {
    console.error("Error al guardar configuración de alertas:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Obtener configuración de alertas de un usuario
 */
export async function obtenerConfiguracionAlertas(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Parámetro requerido: userId",
      });
    }

    const settingsQuery = await db
      .collection("alert_settings")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (settingsQuery.empty) {
      // Retornar configuración por defecto
      const defaultSettings = {
        userId,
        proximityRadius: 500,
        advanceTime: 5,
        isEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };
      
      return res.status(200).json({
        success: true,
        data: defaultSettings,
      });
    }

    const settingsDoc = settingsQuery.docs[0];
    const settingsData = settingsDoc.data();

    return res.status(200).json({
      success: true,
      data: { id: settingsDoc.id, ...settingsData },
    });
  } catch (error: any) {
    console.error("Error al obtener configuración de alertas:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Obtener todas las alertas de un usuario
 */
export async function obtenerAlertasUsuario(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Parámetro requerido: userId",
      });
    }

    const alertsQuery = await db
      .collection("alerts")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const alerts = alertsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        triggeredAt: data.triggeredAt?.toDate ? data.triggeredAt.toDate() : data.triggeredAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    console.error("Error al obtener alertas:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Marcar alerta como leída
 */
export async function marcarAlertaLeida(req: Request, res: Response) {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        error: "Parámetro requerido: alertId",
      });
    }

    const alertDoc = await db.collection("alerts").doc(alertId).get();

    if (!alertDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Alerta no encontrada",
      });
    }

    await alertDoc.ref.update({
      isRead: true,
      readAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "Alerta marcada como leída",
    });
  } catch (error: any) {
    console.error("Error al marcar alerta como leída:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Crear alerta de parada (el usuario será notificado cuando un bus esté cerca)
 */
export async function crearAlertaParada(req: Request, res: Response) {
  try {
    const { userId, routeId, stopId, stopName, userLatitude, userLongitude } = req.body;

    if (!userId || !routeId || !stopId || !stopName) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: userId, routeId, stopId, stopName",
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("usuarios").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Obtener la ruta para obtener la ubicación de la parada
    const routeDoc = await db.collection("rutas").doc(routeId).get();
    
    if (!routeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Ruta no encontrada",
      });
    }

    const routeData = routeDoc.data();
    const stops = routeData?.stops || [];
    const stop = stops.find((s: any) => s.id === stopId);

    if (!stop) {
      return res.status(404).json({
        success: false,
        error: "Parada no encontrada en la ruta",
      });
    }

    // Crear la alerta con información de la parada
    const alertData: any = {
      userId,
      routeId,
      stopId,
      stopName,
      stopLatitude: stop.latitud || stop.location?.latitude || 0,
      stopLongitude: stop.longitud || stop.location?.longitude || 0,
      userLatitude: userLatitude || null,
      userLongitude: userLongitude || null,
      busId: "", // Se asignará cuando un bus esté cerca
      alertType: "arrival",
      message: `Alerta configurada para la parada: ${stopName}. Serás notificado cuando un bus esté cerca.`,
      isRead: false,
      isNotified: false, // Para evitar notificaciones duplicadas
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const alertRef = await db.collection("alerts").add(alertData);

    // Función auxiliar para calcular distancia
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Radio de la Tierra en metros
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c; // Distancia en metros
    };

    // Verificar inmediatamente si hay buses cerca de esta parada
    const stopLat = stop.latitud || stop.location?.latitude || 0;
    const stopLon = stop.longitud || stop.location?.longitude || 0;
    const RADIUS_METERS = 500; // Radio de proximidad
    let busFoundNearby = false;
    
    if (stopLat && stopLon) {
      // Buscar buses activos en esta ruta
      const busesQuery = await db
        .collection("buses")
        .where("ruta_id", "==", routeId)
        .where("estado", "==", true)
        .get();

      // Verificar cada bus para ver si está cerca
      for (const busDoc of busesQuery.docs) {
        const busData = busDoc.data();
        const busLocation = busData?.currentLocation;

        if (busLocation && busLocation.latitude && busLocation.longitude) {
          // Calcular distancia entre el bus y la parada
          const distance = calculateDistance(
            busLocation.latitude,
            busLocation.longitude,
            stopLat,
            stopLon
          );

          // Si el bus está cerca, notificar inmediatamente
          if (distance <= RADIUS_METERS) {
            // Verificar que el usuario es del rol User (rol_id = 1)
            const userData = userDoc.data();
            const userRoleId = userData?.rol_id;

            if (userRoleId === 1) {
              // Buscar token push del usuario
              const tokenQuery = await db
                .collection("push_tokens")
                .where("userId", "==", userId)
                .limit(1)
                .get();

              if (!tokenQuery.empty) {
                const tokenData = tokenQuery.docs[0].data();
                const pushToken = tokenData.token;

                try {
                  const message = {
                    notification: {
                      title: "🚌 Autobús Cercano",
                      body: `El autobús ${busData?.numero || 'está'} está cerca de la parada: ${stopName} (${Math.round(distance)}m)`,
                    },
                    data: {
                      type: "bus_near_stop",
                      alertId: alertRef.id,
                      busId: busDoc.id,
                      routeId,
                      stopId,
                      stopName,
                      distance: distance.toString(),
                    },
                    token: pushToken,
                  };

                  await admin.messaging().send(message);
                  console.log(`Notificación inmediata enviada al usuario ${userId} - Bus cerca de parada ${stopName}`);

                  // Marcar alerta como notificada
                  await alertRef.update({
                    isNotified: true,
                    busId: busDoc.id,
                    notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
                    distance,
                  });
                  
                  busFoundNearby = true;
                  // Salir del loop ya que encontramos un bus cerca y notificamos
                  break;
                } catch (pushError: any) {
                  console.error(`Error enviando notificación push al usuario ${userId}:`, pushError);
                }
              }
            }
          }
        }
      }
    }

    const alertDoc = await alertRef.get();
    const alertResult = {
      id: alertDoc.id,
      ...alertDoc.data(),
      createdAt: alertDoc.data()?.createdAt?.toDate ? alertDoc.data()?.createdAt.toDate() : alertDoc.data()?.createdAt,
    };

    const responseMessage = busFoundNearby
      ? "Alerta creada exitosamente. ¡Un autobús está cerca de la parada! Has sido notificado."
      : "Alerta creada exitosamente. Serás notificado cuando un bus esté cerca de la parada.";

    return res.status(201).json({
      success: true,
      message: responseMessage,
      data: alertResult,
      busFoundNearby: busFoundNearby
    });
  } catch (error: any) {
    console.error("Error al crear alerta de parada:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Verificar y notificar alertas de paradas cuando un bus está cerca
 * Esta función puede ser llamada directamente o desde actualizarUbicacionBus
 */
export async function verificarAlertasParadas(req: Request, res: Response) {
  try {
    const { busId, busLatitude, busLongitude } = req.body;

    if (!busId || busLatitude === undefined || busLongitude === undefined) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: busId, busLatitude, busLongitude",
      });
    }

    // Obtener información del bus
    const busDoc = await db.collection("buses").doc(busId).get();
    
    if (!busDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    const busData = busDoc.data();
    const routeId = busData?.ruta_id;

    if (!routeId || !busData?.estado) {
      return res.status(200).json({
        success: true,
        message: "Bus no activo o sin ruta asignada",
        data: { notified: 0 },
      });
    }

    // Importar la función auxiliar desde bus.controller
    // Por ahora, duplicamos la lógica aquí para evitar dependencias circulares
    const notifiedCount = await verificarAlertasParadasDirecto(
      busId,
      busLatitude,
      busLongitude,
      routeId
    );

    return res.status(200).json({
      success: true,
      message: `Verificación completada. ${notifiedCount} usuario(s) notificado(s).`,
      data: { notified: notifiedCount },
    });
  } catch (error: any) {
    console.error("Error verificando alertas de paradas:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Función auxiliar para verificar alertas (duplicada para evitar dependencias)
 */
async function verificarAlertasParadasDirecto(
  busId: string,
  busLatitude: number,
  busLongitude: number,
  routeId: string
): Promise<number> {
  try {
    // Buscar todas las alertas activas de paradas para esta ruta
    const alertsQuery = await db
      .collection("alerts")
      .where("routeId", "==", routeId)
      .where("alertType", "==", "arrival")
      .where("isNotified", "==", false)
      .get();

    let notifiedCount = 0;
    const RADIUS_METERS = 500; // Radio de proximidad en metros

    // Función para calcular distancia entre dos puntos
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Radio de la Tierra en metros
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c; // Distancia en metros
    };

    // Obtener información del bus
    const busDoc = await db.collection("buses").doc(busId).get();
    const busData = busDoc.data();

    // Verificar cada alerta
    for (const alertDoc of alertsQuery.docs) {
      const alertData = alertDoc.data();
      const stopLat = alertData.stopLatitude;
      const stopLon = alertData.stopLongitude;

      if (!stopLat || !stopLon) continue;

      // Calcular distancia entre el bus y la parada
      const distance = calculateDistance(busLatitude, busLongitude, stopLat, stopLon);

      // Si el bus está dentro del radio de proximidad
      if (distance <= RADIUS_METERS) {
        const userId = alertData.userId;

        // Verificar que el usuario es del rol User (rol_id = 1), no Driver
        const userDoc = await db.collection("usuarios").doc(userId).get();
        
        if (!userDoc.exists) {
          console.log(`Usuario ${userId} no encontrado, saltando notificación`);
          continue;
        }

        const userData = userDoc.data();
        const userRoleId = userData?.rol_id;

        // Solo enviar notificación a usuarios con rol_id = 1 (User/Pasajero)
        // No enviar a conductores (rol_id = 2) ni admins (rol_id = 3)
        if (userRoleId !== 1) {
          console.log(`Usuario ${userId} tiene rol_id ${userRoleId}, no es User. Saltando notificación.`);
          continue;
        }

        // Buscar token push del usuario
        const tokenQuery = await db
          .collection("push_tokens")
          .where("userId", "==", userId)
          .limit(1)
          .get();

        if (!tokenQuery.empty) {
          const tokenData = tokenQuery.docs[0].data();
          const pushToken = tokenData.token;

          // Enviar notificación push al usuario
          try {
            const message = {
              notification: {
                title: "🚌 Autobús Cercano",
                body: `El autobús ${busData?.numero || 'está'} está cerca de la parada: ${alertData.stopName} (${Math.round(distance)}m)`,
              },
              data: {
                type: "bus_near_stop",
                alertId: alertDoc.id,
                busId,
                routeId,
                stopId: alertData.stopId,
                stopName: alertData.stopName,
                distance: distance.toString(),
              },
              token: pushToken,
            };

            await admin.messaging().send(message);
            console.log(`Notificación enviada al usuario ${userId} (rol: User) - Bus cerca de parada ${alertData.stopName}`);

            // Marcar alerta como notificada
            await alertDoc.ref.update({
              isNotified: true,
              busId,
              notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              distance,
            });

            notifiedCount++;
          } catch (pushError: any) {
            console.error(`Error enviando notificación push al usuario ${userId}:`, pushError);
          }
        }
      }
    }

    return notifiedCount;
  } catch (error: any) {
    console.error("Error verificando alertas de paradas:", error);
    return 0;
  }
}