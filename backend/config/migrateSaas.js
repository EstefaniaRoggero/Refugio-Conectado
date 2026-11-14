import pool from './database.js';

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

export async function migrateSaas() {
  if (!(await columnExists('refugios', 'slug'))) {
    await pool.query('ALTER TABLE refugios ADD COLUMN slug VARCHAR(80) NULL UNIQUE AFTER nombre');
  }

  if (!(await columnExists('refugios', 'latitud'))) {
    await pool.query('ALTER TABLE refugios ADD COLUMN latitud DECIMAL(10, 7) NULL AFTER ciudad');
  }

  if (!(await columnExists('refugios', 'longitud'))) {
    await pool.query('ALTER TABLE refugios ADD COLUMN longitud DECIMAL(10, 7) NULL AFTER latitud');
  }

  if (!(await columnExists('usuarios', 'id_refugio'))) {
    await pool.query(
      `ALTER TABLE usuarios
       ADD COLUMN id_refugio INT NULL AFTER id_rol,
       ADD CONSTRAINT fk_usuarios_refugio FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE SET NULL`
    );
  }

  const [[vdr]] = await pool.query("SELECT id_refugio FROM refugios WHERE slug = 'villa-del-rosario' LIMIT 1");
  if (vdr?.id_refugio) {
    await pool.query('UPDATE usuarios SET id_refugio = ? WHERE email = ? AND id_refugio IS NULL', [
      vdr.id_refugio,
      'admin@refugio.com',
    ]);
  }

  console.log('✓ Estructura SaaS multi-refugio verificada');
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  migrateSaas()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
