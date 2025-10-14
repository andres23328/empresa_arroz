import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import db from '../config/firebase.js';
import { generateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import { Resend } from "resend";



const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').notEmpty().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const { email, password, fullName } = req.body;

    // Check if user already exists
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();
    
    if (!existingUser.empty) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user document
    const userDoc = await usersRef.add({
      email,
      fullName,
      password: hashedPassword, // Store password directly in user document for simplicity
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate token
    const token = generateToken(userDoc.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userDoc.id,
        email,
        fullName
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    

    const { email, password } = req.body;

    // Find user by email
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).get();

    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(userDoc.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userDoc.id,
        email: userData.email,
        fullName: userData.fullName
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    console.log('token', token);
    if (!token) return res.status(401).json({ error: 'Access token required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) return res.status(400).json({ error: 'Invalid token payload' });

    const userDoc = await db.collection('users').doc(decoded.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const userData = userDoc.data();

    res.json({
      user: {
        id: userDoc.id,
        email: userData.email,
        fullName: userData.fullName
      }
    });
  } catch (error) {
    console.error("Error in /auth/me:", error);
    res.status(500).json({ error: 'Internal server error' });
  }

  
});


// 🔹 Enviar correo de recuperación con Resend
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const usersRef = db.collection("users");
    const userQuery = await usersRef.where("email", "==", email).get();

    if (userQuery.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userQuery.docs[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    await userDoc.ref.update({
      resetToken,
      resetTokenExpiry,
    });

    // ✅ Configura Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const resetLink = `https://empresa-arroz.vercel.app/reset-password?token=${resetToken}`;

    // ✅ Envía el correo
    const response = await resend.emails.send({
      from: "Molino de Arroz RH <onboarding@resend.dev>", // puedes usar un dominio verificado más adelante
      to: email,
      subject: "Recuperación de contraseña",
      html: `
        <h3>Recuperar contraseña</h3>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>Este enlace expira en 1 hora.</p>
      `,
    });

    console.log("📩 Resend response:", response);

    res.json({ message: "Correo de recuperación enviado correctamente" });
  } catch (error) {
    console.error("❌ Error en forgot-password:", error);
    next(error);
  }
});


// 🔹 Restablecer contraseña
router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    console.log("Token recibido del frontend:", token);


    if (!token || !newPassword)
      return res.status(400).json({ error: "Invalid data" });

    const usersRef = db.collection("users");
    const userQuery = await usersRef
      .where("resetToken", "==", token)
      .where("resetTokenExpiry", ">", Date.now())
      .get();

    if (userQuery.empty) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const userDoc = userQuery.docs[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await userDoc.ref.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    next(error);
  }
});


export default router;

