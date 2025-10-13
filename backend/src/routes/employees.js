import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all employees
router.get('/', async (req, res, next) => {
  try {
    const employeesRef = db.collection('empleados');
    const snapshot = await employeesRef.orderBy('createdAt', 'desc').get();
    
    const employees = [];
    snapshot.forEach(doc => {
      employees.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(employees);
  } catch (error) {
    next(error);
  }
});

// Get employee by ID
router.get('/:id', async (req, res, next) => {
  try {
    const employeeDoc = await db.collection('empleados').doc(req.params.id).get();
    
    if (!employeeDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      id: employeeDoc.id,
      ...employeeDoc.data()
    });
  } catch (error) {
    next(error);
  }
});

// Create employee
router.post('/', [
  body('nro_documento').notEmpty().trim(),
  body('nombre').notEmpty().trim(),
  body('apellido').notEmpty().trim(),
  body('edad').isInt({ min: 18, max: 100 }),
  body('genero').isIn(['Masculino', 'Femenino', 'Otro']),
  body('cargo').notEmpty().trim(),
  body('correo').isEmail().normalizeEmail(),
  body('nro_contacto').notEmpty().trim(),
  body('estado').isIn(['Activo', 'Inactivo', 'Vacaciones', 'Incapacitado'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const employeeData = {
      ...req.body,
      createdBy: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('empleados').add(employeeData);

    res.status(201).json({
      id: docRef.id,
      ...employeeData
    });
  } catch (error) {
    next(error);
  }
});

// Update employee
router.put('/:id', [
  body('nro_documento').optional().notEmpty().trim(),
  body('nombre').optional().notEmpty().trim(),
  body('apellido').optional().notEmpty().trim(),
  body('edad').optional().isInt({ min: 18, max: 100 }),
  body('genero').optional().isIn(['Masculino', 'Femenino', 'Otro']),
  body('cargo').optional().notEmpty().trim(),
  body('correo').optional().isEmail().normalizeEmail(),
  body('nro_contacto').optional().notEmpty().trim(),
  body('estado').optional().isIn(['Activo', 'Inactivo', 'Vacaciones', 'Incapacitado'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    const employeeRef = db.collection('empleados').doc(req.params.id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    await employeeRef.update(updateData);

    const updatedDoc = await employeeRef.get();
    res.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    next(error);
  }
});

// Delete employee
router.delete('/:id', async (req, res, next) => {
  try {
    const employeeRef = db.collection('empleados').doc(req.params.id);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete employee and all related contracts
    const batch = db.batch();
    
    // Delete employee
    batch.delete(employeeRef);
    
    // Delete related contracts
    const contractsRef = db.collection('contratos');
    const contractsQuery = await contractsRef.where('employeeId', '==', req.params.id).get();
    
    contractsQuery.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({ message: 'Employee and related contracts deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ✅ Buscar empleados por nombre o documento
router.get('/buscar', async (req, res) => {
  try {
    const { query } = req.query;
    console.log('🔎 Búsqueda recibida:', query);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Debe ingresar un valor de búsqueda' });
    }

    const empleadosRef = db.collection('empleados');
    const snapshot = await empleadosRef.get();

    const resultados = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const nombreCompleto = `${data.nombre} ${data.apellido}`.toLowerCase();
      const criterio = query.toLowerCase();

      if (
        data.documento?.toString().includes(criterio) ||
        data.nombre?.toLowerCase().includes(criterio) ||
        data.apellido?.toLowerCase().includes(criterio) ||
        nombreCompleto.includes(criterio)
      ) {
        resultados.push({ id: doc.id, ...data });
      }
    });

    if (resultados.length === 0) {
      return res.status(404).json({ message: 'No se encontró ningún empleado con ese criterio' });
    }

    res.json(resultados);
  } catch (error) {
    console.error('Error al buscar empleado:', error);
    res.status(500).json({ error: 'Error al buscar empleado' });
  }
});


export default router;

