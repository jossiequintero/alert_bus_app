import { Router } from "express";
import {
  registrarBus,
  getBusByID,
  getAllBuses,
  actualizarBus,
  eliminarBus,
  asignarConductor,
  iniciarSimulacion,
} from "../controllers/bus.controller";

const router = Router();

router.get("/", getAllBuses);
router.post("/registrar", registrarBus);
router.post("/assign-driver", asignarConductor);
router.post("/start-simulation", iniciarSimulacion);
router.get("/:id", getBusByID);
router.put("/:id", actualizarBus);
router.delete("/:id", eliminarBus);

export default router;
