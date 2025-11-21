import { Router } from "express";
import {
  crearRuta,
  obtenerRutas,
  actualizarRuta,
  eliminarRuta,
} from "../controllers/route.controller";

const router = Router();

router.get("/", obtenerRutas);
router.post("/", crearRuta);
router.put("/:id", actualizarRuta);
router.delete("/:id", eliminarRuta);

export default router;

