import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// ✅ Obtener todos los contratos (de todos los empleados)
router.get('/', async (req, res, next) => {
  try {
    const empleadosSnapshot = await db.collection('empleados').get();
    const contratos = [];

    for (const empDoc of empleadosSnapshot.docs) {
      const empData = empDoc.data();
      const contratosRef = db.collection('empleados').doc(empDoc.id).collection('contratos');
      const contratosSnapshot = await contratosRef.orderBy('fecha_creacion', 'desc').get();

      contratosSnapshot.forEach(doc => {
        contratos.push({
          id: doc.id,
          employeeId: empDoc.id,
          employee: {
            nombre: empData.nombre,
            apellido: empData.apellido,
            cargo: empData.cargo,
          },
          ...doc.data(),
        });
      });
    }

    res.json(contratos);
  } catch (error) {
    next(error);
  }
});

// ✅ Obtener contrato por ID (dentro de un empleado específico)
router.get('/:employeeId/:contractId', async (req, res, next) => {
  try {
    const { employeeId, contractId } = req.params;
    const contratoRef = db.collection('empleados').doc(employeeId).collection('contratos').doc(contractId);
    const contratoDoc = await contratoRef.get();

    if (!contratoDoc.exists) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const empleadoDoc = await db.collection('empleados').doc(employeeId).get();
    const empleadoData = empleadoDoc.exists ? empleadoDoc.data() : null;

    res.json({
      id: contratoDoc.id,
      employeeId,
      ...contratoDoc.data(),
      employee: empleadoData
        ? {
            nombre: empleadoData.nombre,
            apellido: empleadoData.apellido,
            cargo: empleadoData.cargo,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

// ✅ Obtener contratos por empleado
router.get('/empleados/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const contratosRef = db.collection('empleados').doc(employeeId).collection('contratos');
    const snapshot = await contratosRef.orderBy('fecha_creacion', 'desc').get();

    const contratos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(contratos);
  } catch (error) {
    next(error);
  }
});

// ✅ Crear contrato (en subcolección del empleado)
router.post(
  '/',
  [
    body('employeeId').notEmpty().trim(),
    body('fecha_inicio').isISO8601(),
    body('fecha_fin').isISO8601(),
    body('valor_contrato').isFloat({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      const { employeeId, ...data } = req.body;

      // Verificar que el empleado exista
      const empleadoDoc = await db.collection('empleados').doc(employeeId).get();
      if (!empleadoDoc.exists) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const contratoData = {
        ...data,
        createdBy: req.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const contratoRef = await db
        .collection('empleados')
        .doc(employeeId)
        .collection('contratos')
        .add(contratoData);

      res.status(201).json({
        id: contratoRef.id,
        employeeId,
        ...contratoData,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ✅ Actualizar contrato
router.put(
  '/:employeeId/:contractId',
  [
    body('fecha_inicio').optional().isISO8601(),
    body('fecha_fin').optional().isISO8601(),
    body('valor_contrato').optional().isFloat({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const { employeeId, contractId } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Datos inválidos' });
      }

      const contratoRef = db
        .collection('empleados')
        .doc(employeeId)
        .collection('contratos')
        .doc(contractId);
      const contratoDoc = await contratoRef.get();

      if (!contratoDoc.exists) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };

      await contratoRef.update(updateData);

      const updatedDoc = await contratoRef.get();
      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ✅ Eliminar contrato
router.delete('/:employeeId/:contractId', async (req, res, next) => {
  try {
    const { employeeId, contractId } = req.params;
    const contratoRef = db.collection('empleados').doc(employeeId).collection('contratos').doc(contractId);
    const contratoDoc = await contratoRef.get();

    if (!contratoDoc.exists) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    await contratoRef.delete();
    res.json({ message: 'Contrato eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
