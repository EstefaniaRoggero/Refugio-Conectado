import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import pool from './database.js';

dotenv.config();

const mascotasSeed = [
  { nombre: 'Luna', tipo: 'perro', raza: 'mestizo_perro', sexo: 'hembra', edad: 2, tamano: 'mediano', energia: 'media', descripcion: 'Luna es una perrita dulce y cariñosa que adora las caricias.', historia: 'Rescatada de la calle hace 8 meses.', personalidad: 'Cariñosa, tranquila', comportamiento: 'Se lleva bien con niños', vacunas: 'Completa', estado_medico: 'Saludable', compatible_ninos: 1, compatible_mascotas: 1, destacada: 1, imagen: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600' },
  { nombre: 'Max', tipo: 'perro', raza: 'golden', sexo: 'macho', edad: 3, tamano: 'grande', energia: 'alta', descripcion: 'Golden retriever lleno de energía.', historia: 'Su dueño anterior no podía cuidarlo.', personalidad: 'Juguetón, leal', comportamiento: 'Necesita ejercicio diario', vacunas: 'Al día', estado_medico: 'Excelente', compatible_ninos: 1, compatible_mascotas: 1, destacada: 1, imagen: 'https://images.unsplash.com/photo-1633722712983-1b2b97c38b66?w=600' },
  { nombre: 'Michi', tipo: 'gato', raza: 'mestizo_gato', sexo: 'hembra', edad: 1, tamano: 'pequeño', energia: 'baja', descripcion: 'Gatita tranquila ideal para departamentos.', historia: 'Encontrada en un parque.', personalidad: 'Independiente', comportamiento: 'Le gusta dormir al sol', vacunas: 'Triple felina', estado_medico: 'Esterilizada', compatible_ninos: 1, compatible_mascotas: 0, destacada: 1, imagen: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600' },
  { nombre: 'Rocky', tipo: 'perro', raza: 'labrador', sexo: 'macho', edad: 4, tamano: 'mediano', energia: 'media', descripcion: 'Mezcla de labrador muy obediente.', historia: 'Ex perro de compañía.', personalidad: 'Obediente', comportamiento: 'Sabe comandos básicos', vacunas: 'Completa', estado_medico: 'Saludable', compatible_ninos: 1, compatible_mascotas: 1, destacada: 0, imagen: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600' },
  { nombre: 'Nala', tipo: 'gato', raza: 'atigrado', sexo: 'hembra', edad: 2, tamano: 'pequeño', energia: 'media', descripcion: 'Gata atigrada curiosa.', historia: 'Rescatada de edificio abandonado.', personalidad: 'Curiosa', comportamiento: 'Exploradora', vacunas: 'Al día', estado_medico: 'Saludable', compatible_ninos: 1, compatible_mascotas: 1, destacada: 1, imagen: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600' },
  { nombre: 'Toby', tipo: 'perro', raza: 'beagle', sexo: 'macho', edad: 1, tamano: 'pequeño', energia: 'alta', descripcion: 'Cachorro ideal para familias con patio.', historia: 'Abandonado en una caja.', personalidad: 'Travieso', comportamiento: 'En socialización', vacunas: 'Primera dosis', estado_medico: 'En crecimiento', compatible_ninos: 1, compatible_mascotas: 1, destacada: 0, imagen: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600' },
  { nombre: 'Coco', tipo: 'perro', raza: 'poodle', sexo: 'hembra', edad: 5, tamano: 'pequeño', energia: 'baja', descripcion: 'Perrita senior tranquila.', historia: 'Dueños emigraron.', personalidad: 'Tranquila', comportamiento: 'Ambientes calmados', vacunas: 'Completa', estado_medico: 'Control geriátrico', compatible_ninos: 0, compatible_mascotas: 1, destacada: 0, imagen: 'https://images.unsplash.com/photo-1537151626617-e349673bb0f6?w=600' },
  { nombre: 'Simba', tipo: 'gato', raza: 'mestizo_gato', sexo: 'macho', edad: 3, tamano: 'mediano', energia: 'media', descripcion: 'Gato naranja sociable.', historia: 'Abandono.', personalidad: 'Vocal, cariñoso', comportamiento: 'Busca atención', vacunas: 'Completa', estado_medico: 'Saludable', compatible_ninos: 1, compatible_mascotas: 1, destacada: 1, imagen: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600' },
  { nombre: 'Bella', tipo: 'perro', raza: 'pastor_aleman', sexo: 'hembra', edad: 2, tamano: 'grande', energia: 'alta', descripcion: 'Pastor alemán inteligente.', historia: 'Rescatada de maltrato.', personalidad: 'Protectora', comportamiento: 'Requiere entrenamiento', vacunas: 'Completa', estado_medico: 'Recuperada', compatible_ninos: 0, compatible_mascotas: 0, destacada: 0, imagen: 'https://images.unsplash.com/photo-1568640347029-a616a30bc3eb?w=600' },
  { nombre: 'Pelusa', tipo: 'gato', raza: 'persa', sexo: 'hembra', edad: 4, tamano: 'pequeño', energia: 'baja', descripcion: 'Gata persa elegante.', historia: 'Entrega voluntaria.', personalidad: 'Tranquila', comportamiento: 'Cepillado frecuente', vacunas: 'Al día', estado_medico: 'Saludable', compatible_ninos: 1, compatible_mascotas: 0, destacada: 0, imagen: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600' },
];

const historialEjemplo = [
  { mascota: 'Luna', registros: [
    { tipo: 'vacuna', procedimiento: 'Rabia', fecha: '2025-01-15', veterinario: 'Dr. Gómez', proxima_dosis: '2026-01-15', lote: 'RB-2025-01' },
    { tipo: 'vacuna', procedimiento: 'Parvovirus + Moquillo', fecha: '2025-02-10', veterinario: 'Dr. Gómez', proxima_dosis: '2026-02-10' },
    { tipo: 'desparasitacion', procedimiento: 'Desparasitación interna', fecha: '2025-03-01', veterinario: 'Dr. Ruiz' },
  ]},
  { mascota: 'Max', registros: [
    { tipo: 'esterilizacion', procedimiento: 'Castración', fecha: '2024-11-20', veterinario: 'Dr. Martínez', descripcion: 'Recuperación exitosa' },
    { tipo: 'vacuna', procedimiento: 'Rabia', fecha: '2025-01-05', proxima_dosis: '2026-01-05' },
  ]},
  { mascota: 'Michi', registros: [
    { tipo: 'esterilizacion', procedimiento: 'Esterilización', fecha: '2025-02-28', veterinario: 'Dra. López' },
    { tipo: 'vacuna', procedimiento: 'Triple felina', fecha: '2025-03-15', proxima_dosis: '2026-03-15', lote: 'TF-8821' },
  ]},
  { mascota: 'Bella', registros: [
    { tipo: 'cirugia', procedimiento: 'Reparación de pata', fecha: '2024-12-10', veterinario: 'Dr. Sánchez', descripcion: 'Fractura recuperada' },
    { tipo: 'consulta', procedimiento: 'Control post-operatorio', fecha: '2025-01-20', veterinario: 'Dr. Sánchez' },
    { tipo: 'vacuna', procedimiento: 'Rabia', fecha: '2025-02-01', proxima_dosis: '2026-02-01' },
  ]},
];

async function getIds() {
  const [[rolAdmin]] = await pool.query("SELECT id_rol FROM roles WHERE nombre_rol = 'admin'");
  const [[rolUser]] = await pool.query("SELECT id_rol FROM roles WHERE nombre_rol = 'usuario'");
  const [[tvCasa]] = await pool.query("SELECT id_tipo_vivienda FROM tipos_vivienda WHERE tipo = 'Casa'");
  const [[tvDepto]] = await pool.query("SELECT id_tipo_vivienda FROM tipos_vivienda WHERE tipo = 'Departamento'");
  const [[estDisp]] = await pool.query("SELECT id_estado_mascota FROM estados_mascota WHERE codigo = 'disponible'");
  const [[refugio]] = await pool.query('SELECT id_refugio FROM refugios ORDER BY id_refugio LIMIT 1');
  const [[tipoUnica]] = await pool.query("SELECT id_tipo_donacion FROM tipos_donacion WHERE codigo = 'unica'");
  const [[tipoMensual]] = await pool.query("SELECT id_tipo_donacion FROM tipos_donacion WHERE codigo = 'mensual'");
  const [[mpMP]] = await pool.query("SELECT id_metodo_pago FROM metodos_pago WHERE codigo = 'mercadopago'");
  const [[mpTrans]] = await pool.query("SELECT id_metodo_pago FROM metodos_pago WHERE codigo = 'transferencia'");
  const [[mpTarjeta]] = await pool.query("SELECT id_metodo_pago FROM metodos_pago WHERE codigo = 'tarjeta'");

  const [tiposMascota] = await pool.query('SELECT id_tipo_mascota, codigo FROM tipos_mascota');
  const tipoMap = Object.fromEntries(tiposMascota.map((t) => [t.codigo, t.id_tipo_mascota]));

  const [razas] = await pool.query('SELECT id_raza, codigo FROM razas');
  const razaMap = Object.fromEntries(razas.map((r) => [r.codigo, r.id_raza]));

  return {
    rolAdmin: rolAdmin.id_rol, rolUser: rolUser.id_rol,
    tvCasa: tvCasa.id_tipo_vivienda, tvDepto: tvDepto.id_tipo_vivienda,
    estDisp: estDisp.id_estado_mascota, refugio: refugio.id_refugio,
    tipoUnica: tipoUnica.id_tipo_donacion, tipoMensual: tipoMensual.id_tipo_donacion,
    mpMP: mpMP.id_metodo_pago, mpTrans: mpTrans.id_metodo_pago, mpTarjeta: mpTarjeta.id_metodo_pago,
    tipoMap, razaMap,
  };
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de demostración está deshabilitado en producción');
  }
  console.log('🌱 Iniciando seed (esquema ERD + razas + historial médico)...');

  const ids = await getIds();
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const userPassword = process.env.DEMO_USER_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const adminPass = await bcrypt.hash(adminPassword, 12);
  const userPass = await bcrypt.hash(userPassword, 12);

  await pool.query('DELETE FROM favoritos');
  try {
    await pool.query('DELETE FROM invitaciones_admin');
    await pool.query('DELETE FROM registros_actividad');
  } catch {
    /* tablas creadas por la migración de backoffice */
  }
  await pool.query('DELETE FROM reportes_seguimiento_imagenes');
  await pool.query('DELETE FROM reportes_seguimiento');
  await pool.query('DELETE FROM seguimientos_adopcion');
  await pool.query('DELETE FROM historial_medico_mascota');
  await pool.query('DELETE FROM citas_visita');
  await pool.query('DELETE FROM notificaciones');
  await pool.query('DELETE FROM solicitudes_adopcion');
  await pool.query('DELETE FROM donaciones');
  try {
    await pool.query('DELETE FROM voluntario_turnos');
  } catch {
    /* tabla puede no existir aún */
  }
  await pool.query('DELETE FROM voluntarios');
  await pool.query('DELETE FROM perfiles_adoptante');
  await pool.query('DELETE FROM mascota_imagenes');
  await pool.query('DELETE FROM mascotas');
  await pool.query('DELETE FROM mensajes');
  await pool.query('DELETE FROM password_resets');
  await pool.query('DELETE FROM usuarios');

  const [adminRes] = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, email, password, id_rol, id_refugio, telefono, direccion, id_tipo_vivienda, experiencia_mascotas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Admin', 'Refugio', 'admin@refugio.com', adminPass, ids.rolAdmin, ids.refugio, '3001234567', 'Calle Refugio 123', ids.tvCasa, 'Más de 10 años cuidando animales']
  );

  try {
    await pool.query(
      'INSERT INTO usuarios_refugios (id_usuario, id_refugio, es_principal) VALUES (?, ?, 1)',
      [adminRes.insertId, ids.refugio]
    );
  } catch {
    /* tabla creada por la migración de backoffice */
  }

  const [userRes] = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, email, password, id_rol, telefono, direccion, id_tipo_vivienda, experiencia_mascotas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['María', 'García', 'user@refugio.com', userPass, ids.rolUser, '3009876543', 'Av. Principal 456', ids.tvDepto, 'Tuve un perro durante 5 años']
  );

  await pool.query(
    `INSERT INTO perfiles_adoptante (id_usuario, id_tipo_vivienda, tiempo_disponible, experiencia, actividad_fisica, espacio_disponible, tiene_ninos, otras_mascotas)
     VALUES (?, ?, '3-4 horas', 'Tuve perro 5 años', 'media', 'mediano', 'no', 'no')`,
    [userRes.insertId, ids.tvDepto]
  );

  const mascotaIds = {};

  for (const m of mascotasSeed) {
    const idRaza = m.raza ? ids.razaMap[m.raza] : null;
    const [result] = await pool.query(
      `INSERT INTO mascotas (nombre, id_tipo_mascota, id_raza, id_estado_mascota, id_refugio, descripcion, historia, edad, tamano, nivel_energia, sexo, imagen,
        vacunas, estado_medico, personalidad, comportamiento, compatible_ninos, compatible_mascotas, destacada, publicada)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      [m.nombre, ids.tipoMap[m.tipo], idRaza, ids.estDisp, ids.refugio, m.descripcion, m.historia, m.edad, m.tamano, m.energia, m.sexo, m.imagen,
        m.vacunas, m.estado_medico, m.personalidad, m.comportamiento, m.compatible_ninos, m.compatible_mascotas, m.destacada]
    );
    mascotaIds[m.nombre] = result.insertId;
  }

  for (const grupo of historialEjemplo) {
    const idMascota = mascotaIds[grupo.mascota];
    if (!idMascota) continue;
    for (const h of grupo.registros) {
      await pool.query(
        `INSERT INTO historial_medico_mascota (id_mascota, tipo, procedimiento, descripcion, fecha, veterinario, proxima_dosis, lote)
         VALUES (?,?,?,?,?,?,?,?)`,
        [idMascota, h.tipo, h.procedimiento, h.descripcion || null, h.fecha, h.veterinario || null, h.proxima_dosis || null, h.lote || null]
      );
    }
  }

  await pool.query(
    `INSERT INTO donaciones (id_usuario, id_refugio, id_tipo_donacion, id_metodo_pago, nombre_donante, email_donante, monto, estado) VALUES
     (?, ?, ?, ?, 'María García', 'user@refugio.com', 50000, 'completada'),
     (NULL, ?, ?, ?, 'Carlos Pérez', 'carlos@email.com', 100000, 'completada'),
     (NULL, ?, ?, ?, 'Ana López', 'ana@email.com', 25000, 'completada')`,
    [userRes.insertId, ids.refugio, ids.tipoUnica, ids.mpMP, ids.refugio, ids.tipoUnica, ids.mpTrans, ids.refugio, ids.tipoMensual, ids.mpTarjeta]
  );

  await pool.query(
    `INSERT INTO mensajes (nombre, email, asunto, mensaje, id_refugio) VALUES
     ('Pedro Ruiz', 'pedro@email.com', 'Consulta adopción', 'Hola, me gustaría saber el proceso para adoptar un gato.', ?),
     ('Laura Díaz', 'laura@email.com', 'Voluntariado fines de semana', 'Quisiera ayudar los sábados por la mañana.', ?)`,
    [ids.refugio, ids.refugio]
  );

  try {
    const [volRes] = await pool.query(
      `INSERT INTO voluntarios (id_usuario, id_refugio, disponibilidad, tarea, experiencia, habilidades, transporte, estado)
       VALUES (?, ?, 'Sábados 9-13h, Domingos tarde', 'Paseo y limpieza', 'Experiencia con perros', 'Transporte propio', 1, 'aprobado')`,
      [userRes.insertId, ids.refugio]
    );

    await pool.query(
      `INSERT INTO voluntario_turnos (id_voluntario, id_refugio, dia_semana, hora_inicio, hora_fin, notas) VALUES
       (?, ?, 6, '09:00:00', '13:00:00', 'Paseo matutino'),
       (?, ?, 7, '15:00:00', '18:00:00', 'Apoyo tarde')`,
      [volRes.insertId, ids.refugio, volRes.insertId, ids.refugio]
    );
  } catch {
    /* calendario voluntarios no migrado aún */
  }

  console.log('✅ Seed completado (10 mascotas, razas asignadas, historial médico de ejemplo)');
  console.log(`   Admin de desarrollo: admin@refugio.com / ${adminPassword}`);
  console.log(`   Usuario local de desarrollo: user@refugio.com / ${userPassword}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
