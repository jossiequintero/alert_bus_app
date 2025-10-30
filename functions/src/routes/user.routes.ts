import { Router } from "express";
import { registrarUsuario, listarUsuarios, loginUsuario } from "../controllers/user.controller";

const router = Router();

// POST /usuarios/registrar
router.post("/registrar", registrarUsuario);
// POST /user/login
router.post("/login", loginUsuario);

// GET /usuarios
router.get("/all", listarUsuarios);

export default router;
