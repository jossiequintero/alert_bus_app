import { Router } from "express";
import { registrarBus, getBusByID, getAllBuses } from "../controllers/bus.controller";

const router = Router();

// POST /buses/registrar
router.post("/registrar", registrarBus);

// GET /buses/:id
router.get("/:id", getBusByID);

// GET /buses
router.get("/", getAllBuses);

export default router;
