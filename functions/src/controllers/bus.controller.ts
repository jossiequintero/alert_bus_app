import { Request, Response } from "express";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const busesCollection = db.collection("buses");
const usersCollection = db.collection("usuarios");
const routesCollection = db.collection("rutas");

function serializeBus(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    bus_id: data.bus_id || doc.id,
    number: data.numero || "",
    placa: data.placa || "",
    routeId: data.ruta_id || "",
    capacity: data.capacidad || 0,
    isActive: data.estado ?? true,
    driverId: data.conductor_id || null,
    createdAt: data.fecha_registro || null,
    updatedAt: data.fecha_actualizacion || null,
    simulationId: data.simulacion_id || null,
    simulationActive: data.simulacion_activa || false,
  };
}

/**
 * Registrar un nuevo bus
 */
export async function registrarBus(req: Request, res: Response) {
  try {
    const { id, placa, number, routeId, capacity, driverId } = req.body;

    if (!id || !placa || !number || !routeId || !capacity) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: id, placa, number, routeId, capacity",
      });
    }

    const busQuery = await busesCollection.where("bus_id", "==", id).limit(1).get();

    if (!busQuery.empty) {
      return res.status(409).json({
        success: false,
        error: "El bus ya se encuentra registrado.",
      });
    }

    const busData = {
      bus_id: id,
      placa,
      numero: number,
      estado: true,
      ruta_id: routeId,
      capacidad: capacity,
      fecha_registro: admin.firestore.FieldValue.serverTimestamp(),
      fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
      conductor_id: driverId || null,
    };

    await busesCollection.doc(id).set(busData);
    const storedBus = await busesCollection.doc(id).get();

    return res.status(201).json({
      success: true,
      data: serializeBus(storedBus),
    });
  } catch (error: any) {
    console.error("Error al registrar bus:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function getBusByID(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const busQuery = await busesCollection.doc(id).get();

    if (!busQuery.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeBus(busQuery),
    });
  } catch (error: any) {
    console.error("Error al obtener bus:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Obtener todos los buses
 **/
export async function getAllBuses(req: Request, res: Response) {
  try {
    const snapshot = await busesCollection.get();
    const buses = snapshot.docs.map((doc) => serializeBus(doc));

    return res.status(200).json({
      success: true,
      data: buses,
    });
  } catch (error: any) {
    console.error("Error al obtener buses:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function actualizarBus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { placa, number, routeId, capacity, isActive } = req.body;

    const busRef = busesCollection.doc(id);
    const busDoc = await busRef.get();

    if (!busDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    const updateData: Record<string, any> = {
      fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (placa !== undefined) updateData.placa = placa;
    if (number !== undefined) updateData.numero = number;
    if (routeId !== undefined) updateData.ruta_id = routeId;
    if (capacity !== undefined) updateData.capacidad = capacity;
    if (isActive !== undefined) updateData.estado = isActive;

    await busRef.update(updateData);
    const updatedDoc = await busRef.get();

    return res.status(200).json({
      success: true,
      data: serializeBus(updatedDoc),
    });
  } catch (error: any) {
    console.error("Error al actualizar bus:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function eliminarBus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const busRef = busesCollection.doc(id);
    const busDoc = await busRef.get();

    if (!busDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    await busRef.delete();

    return res.status(200).json({
      success: true,
      message: "Bus eliminado correctamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar bus:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function asignarConductor(req: Request, res: Response) {
  try {
    const { busId, driverId } = req.body;

    if (!busId || !driverId) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: busId, driverId",
      });
    }

    const [busDoc, driverDoc] = await Promise.all([
      busesCollection.doc(busId).get(),
      usersCollection.doc(driverId).get(),
    ]);

    if (!busDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    if (!driverDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Conductor no encontrado",
      });
    }

    await busDoc.ref.update({
      conductor_id: driverId,
      fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await busDoc.ref.get();

    return res.status(200).json({
      success: true,
      data: serializeBus(updatedDoc),
    });
  } catch (error: any) {
    console.error("Error al asignar conductor:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function iniciarSimulacion(req: Request, res: Response) {
  try {
    const { busId, routeId, adminId } = req.body;

    if (!busId || !routeId) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: busId, routeId",
      });
    }

    const [busDoc, routeDoc] = await Promise.all([
      busesCollection.doc(busId).get(),
      routesCollection.doc(routeId).get(),
    ]);

    if (!busDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    if (!routeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Ruta no encontrada",
      });
    }

    const simulationData = {
      busId,
      routeId,
      adminId: adminId || null,
      status: "running",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const simulationRef = await db.collection("simulaciones").add(simulationData);

    await busDoc.ref.update({
      simulacion_activa: true,
      simulacion_id: simulationRef.id,
      fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      data: {
        simulationId: simulationRef.id,
        ...simulationData,
      },
    });
  } catch (error: any) {
    console.error("Error al iniciar simulación:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Actualizar ubicación del bus y verificar alertas de paradas
 */
export async function actualizarUbicacionBus(req: Request, res: Response) {
  try {
    const { busId, latitude, longitude } = req.body;

    if (!busId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: busId, latitude, longitude",
      });
    }

    const busRef = busesCollection.doc(busId);
    const busDoc = await busRef.get();

    if (!busDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    const busData = busDoc.data();
    const routeId = busData?.ruta_id;

    // Actualizar ubicación del bus
    await busRef.update({
      currentLocation: {
        latitude,
        longitude,
      },
      fecha_actualizacion: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Verificar alertas de paradas si el bus está activo y tiene ruta
    let notifiedCount = 0;
    if (routeId && busData?.estado) {
      notifiedCount = await verificarAlertasParadasInterno(busId, latitude, longitude, routeId);
    }

    const updatedDoc = await busRef.get();

    return res.status(200).json({
      success: true,
      message: "Ubicación actualizada exitosamente",
      data: serializeBus(updatedDoc),
      notifiedUsers: notifiedCount,
    });
  } catch (error: any) {
    console.error("Error al actualizar ubicación del bus:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Función auxiliar para verificar alertas de paradas (reutilizable)
 */
async function verificarAlertasParadasInterno(
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
    const busDoc = await busesCollection.doc(busId).get();
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