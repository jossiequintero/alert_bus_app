import { Request, Response } from "express";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const routesCollection = db.collection("rutas");

function serializeRoute(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    route_id: data.route_id || doc.id,
    name: data.name || "",
    descripcion: data.descripcion || "",
    tiempoRecorrido: data.tiempoRecorrido || data.tiempo_recorrido || 0,
    isActive: data.isActive ?? data.estado ?? true,
    stops: data.stops || [],
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export async function crearRuta(req: Request, res: Response) {
  try {
    const { id, name, descripcion, tiempoRecorrido, stops, isActive } = req.body;

    if (!name || !tiempoRecorrido) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: name, tiempoRecorrido",
      });
    }

    const routeId = id || routesCollection.doc().id;
    const normalizedStops = (stops || []).map((stop: any, index: number) => ({
      id: stop.id || `${routeId}-stop-${index + 1}`,
      nombre: stop.nombre || stop.name || `Parada ${index + 1}`,
      descripcion: stop.descripcion || stop.description || "",
      latitud: stop.latitud ?? stop.location?.latitude ?? 0,
      longitud: stop.longitud ?? stop.location?.longitude ?? 0,
      orden: stop.orden ?? stop.order ?? index + 1,
    }));

    const routeData = {
      route_id: routeId,
      name,
      descripcion: descripcion || "",
      tiempoRecorrido,
      isActive: isActive ?? true,
      stops: normalizedStops,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await routesCollection.doc(routeId).set(routeData);
    const storedRoute = await routesCollection.doc(routeId).get();

    return res.status(201).json({
      success: true,
      data: serializeRoute(storedRoute),
    });
  } catch (error: any) {
    console.error("Error al crear ruta:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function obtenerRutas(req: Request, res: Response) {
  try {
    const snapshot = await routesCollection.get();
    const routes = snapshot.docs.map((doc) => serializeRoute(doc));

    return res.status(200).json({
      success: true,
      data: routes,
    });
  } catch (error: any) {
    console.error("Error al obtener rutas:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function actualizarRuta(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, descripcion, tiempoRecorrido, stops, isActive } = req.body;

    const routeRef = routesCollection.doc(id);
    const routeDoc = await routeRef.get();

    if (!routeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Ruta no encontrada",
      });
    }

    const updateData: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (tiempoRecorrido !== undefined) updateData.tiempoRecorrido = tiempoRecorrido;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (Array.isArray(stops)) {
      updateData.stops = stops.map((stop: any, index: number) => ({
        id: stop.id || `${id}-stop-${index + 1}`,
        nombre: stop.nombre || stop.name || `Parada ${index + 1}`,
        descripcion: stop.descripcion || stop.description || "",
        latitud: stop.latitud ?? stop.location?.latitude ?? 0,
        longitud: stop.longitud ?? stop.location?.longitude ?? 0,
        orden: stop.orden ?? stop.order ?? index + 1,
      }));
    }

    await routeRef.update(updateData);
    const updatedDoc = await routeRef.get();

    return res.status(200).json({
      success: true,
      data: serializeRoute(updatedDoc),
    });
  } catch (error: any) {
    console.error("Error al actualizar ruta:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function eliminarRuta(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const routeRef = routesCollection.doc(id);
    const routeDoc = await routeRef.get();

    if (!routeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Ruta no encontrada",
      });
    }

    await routeRef.delete();

    return res.status(200).json({
      success: true,
      message: "Ruta eliminada correctamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar ruta:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

