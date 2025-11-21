import { Request, Response } from "express";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const busesCollection = db.collection("buses");
const usersCollection = db.collection("usuarios");
const routesCollection = db.collection("routes");

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
