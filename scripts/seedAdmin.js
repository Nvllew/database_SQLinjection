import pool from '../src/config/db.js';
import { hashPassword } from '../src/utils/hash.js';

const seedAdmin = async () => {
  try {
    console.log('Iniciando inserción de usuario administrador...');

    const adminData = {
      nombre: 'Administrador Principal',
      telefono: '5551234567',
      correo: 'admin@scynara.com',
      contrasenaPlain: 'aAdmin1234!', 
      rol: 'INVITADO',
      estado: 'ACTIVO'
    };

    console.log('Hasheando contraseña...');
    const hashedPass = await hashPassword(adminData.contrasenaPlain);

    console.log('Ejecutando query en la base de datos...');
    const query = `
      INSERT INTO Usuarios (nombre, telefono, correo, contrasena, rol, estado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      adminData.nombre,
      adminData.telefono,
      adminData.correo,
      hashedPass,
      adminData.rol,
      adminData.estado
    ];

    const [result] = await pool.execute(query, values);    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('El usuario ya existe en la base de datos.');
    } else {
      console.error('Error insertando el usuario administrador:', error);
    }
  } finally {
    await pool.end();
  }
};

seedAdmin();