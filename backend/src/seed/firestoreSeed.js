import { db } from "../config/firebase.js";

// Empleados de ejemplo
const empleados = [
  {
    nro_documento: "1001",
    nombre: "Andrés",
    apellido: "Ardila",
    edad: 25,
    genero: "Masculino",
    cargo: "Operario de Planta",
    correo: "ardila23328@gmail.com",
    nro_contacto: "3216549870",
    estado: "Activo",
    observaciones: "Empleado responsable y puntual",
  },
  {
    nro_documento: "1002",
    nombre: "Laura",
    apellido: "Gómez",
    edad: 29,
    genero: "Femenino",
    cargo: "Supervisora de Calidad",
    correo: "laura.gomez@empresa.com",
    nro_contacto: "3109876543",
    estado: "Activo",
    observaciones: "Lidera equipo de control de producción",
  },
  {
    nro_documento: "1003",
    nombre: "Carlos",
    apellido: "Pérez",
    edad: 31,
    genero: "Masculino",
    cargo: "Técnico de Mantenimiento",
    correo: "carlos.perez@empresa.com",
    nro_contacto: "3134456777",
    estado: "Activo",
    observaciones: "Especialista en maquinaria de molienda",
  },
  {
    nro_documento: "1004",
    nombre: "María",
    apellido: "Suárez",
    edad: 27,
    genero: "Femenino",
    cargo: "Contadora",
    correo: "maria.suarez@empresa.com",
    nro_contacto: "3207788990",
    estado: "Activo",
    observaciones: "Encargada del área financiera y nómina",
  },
  {
    nro_documento: "1005",
    nombre: "David",
    apellido: "Rodríguez",
    edad: 34,
    genero: "Masculino",
    cargo: "Jefe de Logística",
    correo: "david.rodriguez@empresa.com",
    nro_contacto: "3115566778",
    estado: "Activo",
    observaciones: "Coordina transporte y recepción de granos",
  },
  {
    nro_documento: "1006",
    nombre: "Valentina",
    apellido: "López",
    edad: 24,
    genero: "Femenino",
    cargo: "Auxiliar de Recursos Humanos",
    correo: "valentina.lopez@empresa.com",
    nro_contacto: "3123344556",
    estado: "Activo",
    observaciones: "Apoya procesos de contratación y capacitación",
  },
];

const contratosBase = [
  {
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-06-30",
    valor_contrato: 2500000,
    tipo_contrato: "Temporal",
  },
  {
    fecha_inicio: "2024-07-01",
    fecha_fin: "2024-12-31",
    valor_contrato: 2700000,
    tipo_contrato: "Fijo",
  },
  {
    fecha_inicio: "2025-01-01",
    fecha_fin: "2025-12-31",
    valor_contrato: 3000000,
    tipo_contrato: "Indefinido",
  },
];

export const poblarFirestore = async () => {
  console.log("🚀 Iniciando carga de empleados...");

  for (const empleado of empleados) {
    // Crear empleado
    const empleadoRef = await db.collection("empleados").add({
      ...empleado,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generar entre 2 y 3 contratos por empleado
    const numContratos = Math.floor(Math.random() * 2) + 2; // 2 o 3
    const contratos = contratosBase.slice(0, numContratos);

    for (const contrato of contratos) {
      await empleadoRef.collection("contratos").add({
        ...contrato,
        empleado_nombre: `${empleado.nombre} ${empleado.apellido}`,
        fecha_creacion: new Date(),
      });
    }

    console.log(`✅ Empleado ${empleado.nombre} creado con ${numContratos} contratos`);
  }

  console.log("🎉 Carga de datos completada exitosamente.");
};

// Ejecutar script
poblarFirestore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error al poblar Firestore:", err);
    process.exit(1);
  });
