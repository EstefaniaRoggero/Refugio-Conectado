/**
 * Crea (o actualiza) el administrador de un refugio.
 *
 * Uso: npm run create-admin -- <slug> <email> <contraseña> [nombre] [apellido]
 * Ej.: npm run create-admin -- pilar admin@example.com clave_de_ejemplo Admin Ejemplo
 *
 * Usa las variables DB_* del entorno (o de .env). Para apuntar a Railway,
 * definirlas en la terminal antes de ejecutar.
 */
import bcrypt from 'bcryptjs';
import pool from './database.js';

async function createAdmin() {
  const [slug, email, password, nombre = 'Admin', apellido] = process.argv.slice(2);

  if (!slug || !email || !password) {
    throw new Error('Uso: npm run create-admin -- <slug> <email> <contraseña> [nombre] [apellido]');
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres');
  }

  const [[refugio]] = await pool.query('SELECT id_refugio, nombre FROM refugios WHERE slug = ?', [slug]);
  if (!refugio) throw new Error(`No existe un refugio con slug "${slug}"`);

  const [[rol]] = await pool.query("SELECT id_rol FROM roles WHERE nombre_rol = 'admin'");
  const hashed = await bcrypt.hash(password, 12);
  const apellidoFinal = apellido || refugio.nombre.replace(/^Refugio Conectado\s*/i, '') || 'Refugio';

  const [[existente]] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existente) {
    await pool.query(
      `UPDATE usuarios SET password = ?, id_rol = ?, id_refugio = ?, auth_provider = 'local' WHERE id = ?`,
      [hashed, rol.id_rol, refugio.id_refugio, existente.id]
    );
    console.log(`✓ Administrador actualizado: ${email} → ${refugio.nombre}`);
  } else {
    await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, id_rol, id_refugio, auth_provider)
       VALUES (?, ?, ?, ?, ?, ?, 'local')`,
      [nombre, apellidoFinal, email, hashed, rol.id_rol, refugio.id_refugio]
    );
    console.log(`✓ Administrador creado: ${email} → ${refugio.nombre}`);
  }
}

createAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗', err.message);
    process.exit(1);
  });
