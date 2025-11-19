import { Request, Response } from "express";
import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";

if (!admin.apps.length) {
    admin.initializeApp();
  }

  
const db = admin.firestore();

/**
 * Registrar un nuevo usuario
 */
export async function registrarUsuario(req: Request, res: Response) {
  try {
    const { user_id, nombre, apellidos, correo, contraseña, rol_id } = req.body;

    if (!user_id || !nombre || !correo || !contraseña || !rol_id) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: user_id, nombre, correo, contraseña, rol_id",
      });
    }
      // 🔐 Encriptar la contraseña antes de guardarla
    const salt = bcrypt.genSaltSync(10); // nivel de seguridad (10 es un buen punto)
    const hashedPassword = bcrypt.hashSync(contraseña, salt);

    const userQuery = await db.collection("usuarios").where("correo", "==", correo).limit(1).get();
    
    if (!userQuery.empty) {
      return res.status(409).json({
        success: false,
        error: "El Usuario ya se encuentra registrado.",
      });
    }
    const userData:any = {
      user_id,
      nombre,
      apellidos: apellidos || "",
      correo,
      rol_id,
      contraseña: hashedPassword,
      fecha_registro: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("usuarios").doc(user_id).set(userData);

    delete userData.contraseña;
    return res.status(201).json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error("Error al registrar usuario:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

export async function loginUsuario(req: Request, res: Response) {
  try {
    const { correo, contraseña } = req.body;

    // ✅ Validación básica
    if (!correo || !contraseña) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: correo, contraseña",
      });
    }

    // 🔍 Buscar usuario por correo
    const userQuery = await db.collection("usuarios").where("correo", "==", correo).limit(1).get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // 🔐 Comparar contraseñas
    const passwordValida = bcrypt.compareSync(contraseña, userData.contraseña);

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        error: "Contraseña incorrecta",
      });
    }

    // ⚠️ No incluir contraseña en la respuesta
    delete userData.contraseña;

    // (Opcional) Aquí podrías generar un token JWT si quisieras autenticar sesiones
    // const token = jwt.sign({ uid: userDoc.id, rol: userData.rol_id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      data: userData,
      // token, // si implementas JWT
    });

  } catch (error: any) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Listar todos los usuarios
 */
export async function listarUsuarios(req: Request, res: Response) {
  try {
    const snapshot = await db.collection("usuarios").get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.json({
      success: true,
      data: usuarios,
    });
  } catch (error: any) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Guardar token de notificaciones push para un usuario
 */
export async function guardarTokenPush(req: Request, res: Response) {
  try {
    const { userId, token, platform } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        error: "Campos requeridos: userId, token",
      });
    }

    // Verificar que el usuario existe
    const userDoc = await db.collection("usuarios").doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Guardar o actualizar el token en la colección de tokens
    const tokenData: any = {
      userId,
      token,
      platform: platform || "android",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Buscar si ya existe un token para este usuario y plataforma
    const tokenQuery = await db
      .collection("push_tokens")
      .where("userId", "==", userId)
      .where("platform", "==", platform || "android")
      .limit(1)
      .get();

    if (!tokenQuery.empty) {
      // Actualizar token existente
      const tokenDoc = tokenQuery.docs[0];
      await tokenDoc.ref.update(tokenData);
      
      return res.status(200).json({
        success: true,
        message: "Token actualizado exitosamente",
        data: { tokenId: tokenDoc.id, ...tokenData },
      });
    } else {
      // Crear nuevo token
      tokenData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const tokenRef = await db.collection("push_tokens").add(tokenData);
      
      return res.status(201).json({
        success: true,
        message: "Token guardado exitosamente",
        data: { tokenId: tokenRef.id, ...tokenData },
      });
    }
  } catch (error: any) {
    console.error("Error al guardar token push:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}