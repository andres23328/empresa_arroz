import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { authenticateToken } from './middleware/auth.js';
import employeeRoutes from './routes/employees.js';
import contractRoutes from './routes/contracts.js';
import { errorHandler } from './middleware/errorHandler.js';
import { db } from './config/firebase.js';

// Ejemplo de prueba (opcional)
const testConnection = async () => {
  try {
    const snapshot = await db.collection('test').get();
    console.log(`✅ Firestore conectado. Documentos: ${snapshot.size}`);
  } catch (error) {
    console.error('❌ Error al probar conexión con Firestore:', error);
  }
};

testConnection();

dotenv.config();

console.log("✅ FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("✅ Tiene service key:", !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000','http://192.168.1.70:5173', 'http://192.168.1.70:8080','https://empresa-arroz.vercel.app','https://empresa-arroz.onrender.com'
  ],
  credentials: true
}));
app.use(limiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contratos', contractRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({ message: "Ruta protegida", user: req.user });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;

