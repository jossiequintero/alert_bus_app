import { Router } from "express";
import { registrarUsuario, listarUsuarios, loginUsuario, guardarTokenPush } from "../controllers/user.controller";

const router = Router();

// POST /usuarios/registrar
router.post("/registrar", registrarUsuario);
// POST /user/login
router.post("/login", loginUsuario);

// GET /usuarios
router.get("/all", listarUsuarios);

// POST /user/save-token
router.post("/save-token", guardarTokenPush);

export default router;
