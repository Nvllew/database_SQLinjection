 import app from './app.js';
import pool from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado. Verifica tu archivo .env');
    }

    const [rows] = await pool.query("SELECT 1"); 

    console.log("Conectado a MySQL correctamente");
    console.log(`Entorno: ${env.NODE_ENV}`);

    app.listen(env.PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
    });

  } catch (error) {
    console.error("Error conectando a MySQL:", error);
    process.exit(1);
  }
};

startServer();