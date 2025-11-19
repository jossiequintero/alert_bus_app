import { Request, Response } from "express";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp();
  }

  
const db = admin.firestore();

/**
 * Registrar un nuevo bus
 */
export async function registrarBus(req: Request, res: Response) {
  try {
    const { id, placa, number, routeId, capacity } = req.body;

    if (!id || !placa || !number || !routeId || !capacity) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: id, placa, number, routeId, capacity",
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
      conductor_id: null,
    };

    const busQuery = await db.collection("buses").where("bus_id", "==", id).limit(1).get();

    if (!busQuery.empty) {
      return res.status(409).json({
        success: false,
        error: "El bus ya se encuentra registrado.",
      });
    }

    await db.collection("buses").doc(id).set(busData);

    return res.status(201).json({
      success: true,
      data: busData,
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
    const busQuery = await db.collection("buses").doc(id).get();

    if (!busQuery.exists) {
      return res.status(404).json({
        success: false,
        error: "Bus no encontrado",
      });
    }

    const busData = busQuery.data();
    return res.status(200).json({
      success: true,
      data: busData,
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
 * **/
export async function getAllBuses(req: Request, res: Response) {
  try {
    const busesSnapshot = await db.collection("buses").get();
    const buses: any[] = [];  
    busesSnapshot.forEach((doc) => {
      buses.push({ id: doc.id, ...doc.data() });
    });

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
