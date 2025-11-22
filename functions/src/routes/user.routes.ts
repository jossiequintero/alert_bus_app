import { Router } from "express";
import { 
  registrarUsuario, 
  listarUsuarios, 
  loginUsuario, 
  guardarTokenPush,
  guardarConfiguracionAlertas,
  obtenerConfiguracionAlertas,
  obtenerAlertasUsuario,
  marcarAlertaLeida,
  crearAlertaParada,
  verificarAlertasParadas
} from "../controllers/user.controller";

const router = Router();

// POST /usuarios/registrar
router.post("/registrar", registrarUsuario);
// POST /user/login
router.post("/login", loginUsuario);

// GET /usuarios
router.get("/all", listarUsuarios);

// POST /user/save-token
router.post("/save-token", guardarTokenPush);

// POST /user/alert-settings - Guardar/actualizar configuración de alertas
router.post("/alert-settings", guardarConfiguracionAlertas);

// GET /user/alert-settings/:userId - Obtener configuración de alertas
router.get("/alert-settings/:userId", obtenerConfiguracionAlertas);

// GET /user/alerts/:userId - Obtener alertas del usuario
router.get("/alerts/:userId", obtenerAlertasUsuario);

// PUT /user/alerts/:alertId/read - Marcar alerta como leída
router.put("/alerts/:alertId/read", marcarAlertaLeida);

// POST /user/alerts/create-stop-alert - Crear alerta de parada
router.post("/alerts/create-stop-alert", crearAlertaParada);

// POST /user/alerts/check-stop-alerts - Verificar alertas de paradas cuando bus se mueve
router.post("/alerts/check-stop-alerts", verificarAlertasParadas);

export default router;
