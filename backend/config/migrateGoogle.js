import pool from './database.js';

const steps = [
  ['password nullable', 'ALTER TABLE usuarios MODIFY COLUMN password VARCHAR(255) NULL'],
  ['google_id', 'ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER password'],
  ['auth_provider', "ALTER TABLE usuarios ADD COLUMN auth_provider ENUM('local', 'google') NOT NULL DEFAULT 'local' AFTER google_id"],
];

for (const [name, sql] of steps) {
  try {
    await pool.query(sql);
    console.log(`✅ ${name}`);
  } catch (e) {
    console.log(`⏭️  ${name}: ${e.message}`);
  }
}

process.exit(0);
