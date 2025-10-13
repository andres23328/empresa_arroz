import admin from "firebase-admin";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error("❌ Faltan las credenciales de Firebase en .env");
}

// 🔍 Lee y repara correctamente las barras dobles (\n)
let serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// 🪄 Si la clave contiene literalmente '\n', cámbiala por saltos de línea reales
if (typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/gm, "\n");
}

// Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

console.log("✅ Firebase conectado correctamente.");

export { db, auth };
export default db;
