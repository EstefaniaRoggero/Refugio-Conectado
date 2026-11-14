import pool from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, error } from '../utils/apiResponse.js';

const normalizeSlug = (value = '') => value.trim().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const asBoolean = (value, fallback = true) => value == null ? fallback : value === true || value === 1 || value === '1';
const nullableNumber = (value) => value === '' || value == null ? null : Number(value);
const pageParams = (req, defaultLimit = 20) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(req.query.limit) || defaultLimit));
  return { page, limit, offset: (page - 1) * limit };
};

export const listZones = asyncHandler(async (req, res) => {
  const [zones] = await pool.query(`
    SELECT z.*, COUNT(DISTINCT r.id_refugio) refugios,
      COUNT(DISTINCT l.id_localidad) localidades_count,
      GROUP_CONCAT(DISTINCT l.nombre ORDER BY l.nombre SEPARATOR ', ') localidades
    FROM zonas z LEFT JOIN refugios r ON r.id_zona=z.id_zona
    LEFT JOIN localidades l ON l.id_zona=z.id_zona AND l.activo=1
    GROUP BY z.id_zona ORDER BY z.activo DESC, z.nombre
  `);
  success(res, { zones });
});

export const createLocality = asyncHandler(async (req, res) => {
  const zoneId = Number(req.params.id);
  const nombre = String(req.body.nombre || '').trim();
  if (!nombre) return error(res, 'El nombre de la localidad es obligatorio', 400);
  const [result] = await pool.query('INSERT INTO localidades (id_zona,nombre,activo) VALUES (?,?,1)', [zoneId, nombre]);
  success(res, { id_localidad: result.insertId }, 'Localidad agregada', 201);
});

export const updateLocality = asyncHandler(async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (!nombre) return error(res, 'El nombre de la localidad es obligatorio', 400);
  const [result] = await pool.query('UPDATE localidades SET nombre=?, activo=? WHERE id_localidad=? AND id_zona=?',
    [nombre, asBoolean(req.body.activo) ? 1 : 0, req.params.localityId, req.params.id]);
  if (!result.affectedRows) return error(res, 'Localidad no encontrada', 404);
  success(res, null, 'Localidad actualizada');
});

export const listLocalities = asyncHandler(async (req, res) => {
  const [localities] = await pool.query('SELECT * FROM localidades WHERE id_zona=? ORDER BY activo DESC,nombre', [req.params.id]);
  success(res, { localities });
});

export const createZone = asyncHandler(async (req, res) => {
  const { nombre, descripcion, provincia } = req.body;
  const slug = normalizeSlug(req.body.slug || nombre);
  if (!nombre?.trim() || !slug) return error(res, 'Nombre y slug son obligatorios', 400);
  const [result] = await pool.query(
    'INSERT INTO zonas (nombre, slug, descripcion, provincia, activo) VALUES (?, ?, ?, ?, ?)',
    [nombre.trim(), slug, descripcion || null, provincia || null, asBoolean(req.body.activo) ? 1 : 0]
  );
  success(res, { id_zona: result.insertId }, 'Zona creada', 201);
});

export const updateZone = asyncHandler(async (req, res) => {
  const { nombre, descripcion, provincia } = req.body;
  const slug = normalizeSlug(req.body.slug || nombre);
  if (!nombre?.trim() || !slug) return error(res, 'Nombre y slug son obligatorios', 400);
  const [before] = await pool.query('SELECT * FROM zonas WHERE id_zona=?', [req.params.id]);
  req.auditBefore = before[0] || null;
  const [result] = await pool.query(
    'UPDATE zonas SET nombre=?, slug=?, descripcion=?, provincia=?, activo=? WHERE id_zona=?',
    [nombre.trim(), slug, descripcion || null, provincia || null, asBoolean(req.body.activo) ? 1 : 0, req.params.id]
  );
  if (!result.affectedRows) return error(res, 'Zona no encontrada', 404);
  success(res, null, 'Zona actualizada');
});

export const listPlatformUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const params = [];
  const conditions = [];
  if (req.query.rol) { conditions.push('ro.nombre_rol=?'); params.push(req.query.rol); }
  if (req.query.estado === 'activo') conditions.push('u.activo=1');
  if (req.query.estado === 'bloqueado') conditions.push('u.activo=0');
  if (req.query.q) { conditions.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)'); const term=`%${req.query.q}%`; params.push(term,term,term); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[count]] = await pool.query(`SELECT COUNT(*) total FROM usuarios u JOIN roles ro ON ro.id_rol=u.id_rol ${where}`, params);
  const [users] = await pool.query(`
    SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.direccion, u.activo, u.auth_provider, u.created_at, u.id_refugio,
      ro.nombre_rol rol, GROUP_CONCAT(DISTINCT r.nombre ORDER BY r.nombre SEPARATOR ', ') refugios
    FROM usuarios u JOIN roles ro ON ro.id_rol=u.id_rol
    LEFT JOIN usuarios_refugios ur ON ur.id_usuario=u.id
    LEFT JOIN refugios r ON r.id_refugio=ur.id_refugio OR r.id_refugio=u.id_refugio
    ${where} GROUP BY u.id, ro.nombre_rol ORDER BY u.created_at DESC LIMIT ? OFFSET ?
  `, [...params, limit, offset]);
  success(res, { users, pagination: { page, limit, total: Number(count.total), pages: Math.ceil(Number(count.total) / limit) } });
});

export const updatePlatformUserStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const activo = asBoolean(req.body.activo, false);
  if (id === req.user.id && !activo) return error(res, 'No podés bloquear tu propio acceso', 400);
  const [before] = await pool.query('SELECT id, nombre, apellido, email, activo FROM usuarios WHERE id=?', [id]);
  req.auditBefore = before[0] || null;
  const [result] = await pool.query('UPDATE usuarios SET activo=? WHERE id=?', [activo ? 1 : 0, id]);
  if (!result.affectedRows) return error(res, 'Usuario no encontrado', 404);
  success(res, null, activo ? 'Usuario activado' : 'Usuario bloqueado');
});

export const updatePlatformUserRole = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const rol = req.body.rol;
  if (!['usuario', 'voluntario'].includes(rol)) return error(res, 'Los roles administrativos se gestionan desde Administrar responsables', 400);
  if (id === req.user.id) return error(res, 'No podés modificar tu propio rol', 400);
  const [[role]] = await pool.query('SELECT id_rol FROM roles WHERE nombre_rol=?', [rol]);
  if (!role) return error(res, 'Rol no configurado', 400);
  const [before] = await pool.query(`SELECT u.id,u.nombre,u.apellido,u.email,r.nombre_rol rol FROM usuarios u JOIN roles r ON r.id_rol=u.id_rol WHERE u.id=?`, [id]);
  if (!before.length) return error(res, 'Usuario no encontrado', 404);
  if (['admin','super_admin'].includes(before[0].rol)) return error(res, 'Usá Administrar responsables para modificar un rol administrativo', 400);
  req.auditBefore = before[0];
  await pool.query('UPDATE usuarios SET id_rol=? WHERE id=?', [role.id_rol, id]);
  req.auditAfter = { ...before[0], rol };
  success(res, null, 'Rol actualizado');
});

export const createRefugeRequest = asyncHandler(async (req, res) => {
  const { nombre_refugio, responsable, email, telefono, ciudad, direccion, descripcion, documentacion_url } = req.body;
  if (!nombre_refugio?.trim() || !responsable?.trim() || !email?.trim() || !ciudad?.trim()) {
    return error(res, 'Refugio, responsable, email y ciudad son obligatorios', 400);
  }
  const [result] = await pool.query(
    `INSERT INTO solicitudes_refugio (nombre_refugio, responsable, email, telefono, ciudad, direccion, descripcion, documentacion_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre_refugio.trim(), responsable.trim(), email.trim().toLowerCase(), telefono || null, ciudad.trim(), direccion || null, descripcion || null, documentacion_url || null]
  );
  success(res, { id: result.insertId }, 'Solicitud recibida', 201);
});

export const listRefugeRequests = asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const params = [];
  const conditions=[];
  if (req.query.estado) { conditions.push('s.estado=?'); params.push(req.query.estado); }
  if (req.query.q) { conditions.push('(s.nombre_refugio LIKE ? OR s.responsable LIKE ? OR s.email LIKE ? OR s.ciudad LIKE ?)'); const term=`%${req.query.q}%`; params.push(term,term,term,term); }
  const where=conditions.length?`WHERE ${conditions.join(' AND ')}`:'';
  const [[count]]=await pool.query(`SELECT COUNT(*) total FROM solicitudes_refugio s ${where}`,params);
  const [requests] = await pool.query(`
    SELECT s.*, CONCAT(u.nombre, ' ', u.apellido) revisor
    FROM solicitudes_refugio s LEFT JOIN usuarios u ON u.id=s.revisado_por
    ${where} ORDER BY FIELD(s.estado,'pendiente','aprobada','rechazada'), s.created_at DESC LIMIT ? OFFSET ?
  `, [...params,limit,offset]);
  success(res, { requests, pagination:{page,limit,total:Number(count.total),pages:Math.ceil(Number(count.total)/limit)} });
});

export const reviewRefugeRequest = asyncHandler(async (req, res) => {
  const { estado, notas_revision } = req.body;
  if (!['pendiente', 'aprobada', 'rechazada'].includes(estado)) return error(res, 'Estado inválido', 400);
  const [before] = await pool.query('SELECT * FROM solicitudes_refugio WHERE id=?', [req.params.id]);
  if (!before.length) return error(res, 'Solicitud no encontrada', 404);
  req.auditBefore = before[0] || null;
  const connection=await pool.getConnection();
  try {
    await connection.beginTransaction();
    let refugeId=before[0].id_refugio_aprobado || null;
    if (estado==='aprobada' && asBoolean(req.body.crear_refugio,false) && !refugeId) {
      const baseSlug=normalizeSlug(before[0].nombre_refugio);
      const [duplicate]=await connection.query('SELECT 1 FROM refugios WHERE slug=? LIMIT 1',[baseSlug]);
      const slug=duplicate.length?`${baseSlug}-${before[0].id}`:baseSlug;
      const [created]=await connection.query(
        `INSERT INTO refugios (nombre,slug,direccion,descripcion,telefono,email,ciudad,id_zona,activo)
         VALUES (?,?,?,?,?,?,?,?,1)`,
        [before[0].nombre_refugio,slug,before[0].direccion,before[0].descripcion,before[0].telefono,before[0].email,before[0].ciudad,nullableNumber(req.body.id_zona)]
      );
      refugeId=created.insertId;
    }
    await connection.query(
      `UPDATE solicitudes_refugio SET estado=?, notas_revision=?, revisado_por=?, id_refugio_aprobado=?,
       reviewed_at=IF(?='pendiente', NULL, NOW()) WHERE id=?`,
      [estado,notas_revision||null,req.user.id,refugeId,estado,req.params.id]
    );
    await connection.commit();
    req.auditAfter={estado,notas_revision,id_refugio_aprobado:refugeId};
    success(res,{id_refugio:refugeId},refugeId?'Solicitud aprobada y refugio habilitado':`Solicitud ${estado}`);
  } catch(err){await connection.rollback();throw err;} finally{connection.release();}
});

const ORGANIZATION_TYPES = ['municipalidad', 'veterinaria', 'organizacion', 'empresa', 'otra'];
export const listOrganizations = asyncHandler(async (req, res) => {
  const params = [];
  const where = req.query.tipo ? 'WHERE o.tipo=?' : '';
  if (req.query.tipo) params.push(req.query.tipo);
  const [organizations] = await pool.query(`
    SELECT o.*, z.nombre zona, COUNT(DISTINCT c.id) convenios
    FROM organizaciones o LEFT JOIN zonas z ON z.id_zona=o.id_zona
    LEFT JOIN convenios c ON c.id_organizacion=o.id
    ${where} GROUP BY o.id,z.nombre ORDER BY o.activo DESC, o.nombre
  `, params);
  success(res, { organizations });
});

export const createOrganization = asyncHandler(async (req, res) => {
  const { tipo, nombre, cuit, email, telefono, direccion, ciudad, contacto, notas } = req.body;
  if (!ORGANIZATION_TYPES.includes(tipo) || !nombre?.trim()) return error(res, 'Tipo y nombre son obligatorios', 400);
  const [result] = await pool.query(
    `INSERT INTO organizaciones (tipo,nombre,cuit,email,telefono,direccion,ciudad,id_zona,contacto,notas,activo)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [tipo, nombre.trim(), cuit || null, email || null, telefono || null, direccion || null, ciudad || null,
      nullableNumber(req.body.id_zona), contacto || null, notas || null, asBoolean(req.body.activo) ? 1 : 0]
  );
  success(res, { id: result.insertId }, 'Organización creada', 201);
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const { tipo, nombre, cuit, email, telefono, direccion, ciudad, contacto, notas } = req.body;
  if (!ORGANIZATION_TYPES.includes(tipo) || !nombre?.trim()) return error(res, 'Tipo y nombre son obligatorios', 400);
  const [before] = await pool.query('SELECT * FROM organizaciones WHERE id=?', [req.params.id]);
  req.auditBefore = before[0] || null;
  const [result] = await pool.query(
    `UPDATE organizaciones SET tipo=?,nombre=?,cuit=?,email=?,telefono=?,direccion=?,ciudad=?,id_zona=?,contacto=?,notas=?,activo=? WHERE id=?`,
    [tipo, nombre.trim(), cuit || null, email || null, telefono || null, direccion || null, ciudad || null,
      nullableNumber(req.body.id_zona), contacto || null, notas || null, asBoolean(req.body.activo) ? 1 : 0, req.params.id]
  );
  if (!result.affectedRows) return error(res, 'Organización no encontrada', 404);
  success(res, null, 'Organización actualizada');
});

export const listAgreements = asyncHandler(async (req, res) => {
  const [agreements] = await pool.query(`
    SELECT c.*, o.nombre organizacion, o.tipo organizacion_tipo, r.nombre refugio, z.nombre zona
    FROM convenios c JOIN organizaciones o ON o.id=c.id_organizacion
    LEFT JOIN refugios r ON r.id_refugio=c.id_refugio LEFT JOIN zonas z ON z.id_zona=c.id_zona
    ORDER BY FIELD(c.estado,'activo','borrador','pausado','finalizado'), c.created_at DESC
  `);
  success(res, { agreements });
});

export const saveAgreement = asyncHandler(async (req, res) => {
  const { titulo, tipo_convenio='colaboracion', descripcion, fecha_inicio, fecha_fin, estado = 'borrador' } = req.body;
  const organizationId = nullableNumber(req.body.id_organizacion);
  if (!titulo?.trim() || !organizationId) return error(res, 'Título y organización son obligatorios', 400);
  if (!['borrador', 'activo', 'pausado', 'finalizado'].includes(estado)) return error(res, 'Estado inválido', 400);
  const values = [titulo.trim(), tipo_convenio, organizationId, nullableNumber(req.body.id_refugio), nullableNumber(req.body.id_zona),
    descripcion || null, fecha_inicio || null, fecha_fin || null, estado];
  if (req.params.id) {
    const [before] = await pool.query('SELECT * FROM convenios WHERE id=?', [req.params.id]);
    req.auditBefore = before[0] || null;
    const [result] = await pool.query(
      'UPDATE convenios SET titulo=?,tipo_convenio=?,id_organizacion=?,id_refugio=?,id_zona=?,descripcion=?,fecha_inicio=?,fecha_fin=?,estado=? WHERE id=?',
      [...values, req.params.id]
    );
    if (!result.affectedRows) return error(res, 'Convenio no encontrado', 404);
    return success(res, null, 'Convenio actualizado');
  }
  const [result] = await pool.query(
    `INSERT INTO convenios (titulo,tipo_convenio,id_organizacion,id_refugio,id_zona,descripcion,fecha_inicio,fecha_fin,estado)
     VALUES (?,?,?,?,?,?,?,?,?)`, values
  );
  success(res, { id: result.insertId }, 'Convenio creado', 201);
});

export const getPlatformStats = asyncHandler(async (req, res) => {
  const [adoptions] = await pool.query(`
    SELECT DATE_FORMAT(s.updated_at,'%Y-%m') periodo, COUNT(*) total
    FROM solicitudes_adopcion s JOIN estados_solicitud_adopcion e ON e.id_estado_solicitud=s.id_estado_solicitud
    WHERE e.codigo='aprobada' AND s.updated_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY periodo ORDER BY periodo
  `);
  const [donations] = await pool.query(`
    SELECT DATE_FORMAT(created_at,'%Y-%m') periodo, COUNT(*) cantidad, COALESCE(SUM(monto),0) monto
    FROM donaciones WHERE estado='completada' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY periodo ORDER BY periodo
  `);
  const [users] = await pool.query(`
    SELECT DATE_FORMAT(created_at,'%Y-%m') periodo, COUNT(*) total FROM usuarios
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY periodo ORDER BY periodo
  `);
  const [refugesByZone] = await pool.query(`
    SELECT COALESCE(z.nombre,'Sin zona') zona, COUNT(r.id_refugio) total
    FROM refugios r LEFT JOIN zonas z ON z.id_zona=r.id_zona GROUP BY z.id_zona,z.nombre ORDER BY total DESC
  `);
  const [[summary]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM zonas WHERE activo=1) zonas,
      (SELECT COUNT(*) FROM refugios) refugios,
      (SELECT COUNT(*) FROM refugios WHERE activo=1) refugios_activos,
      (SELECT COUNT(*) FROM organizaciones WHERE activo=1) organizaciones,
      (SELECT COUNT(*) FROM convenios WHERE estado='activo') convenios,
      (SELECT COUNT(*) FROM usuarios WHERE activo=1) usuarios,
      (SELECT COUNT(*) FROM mascotas WHERE publicada=1) mascotas,
      (SELECT COUNT(*) FROM mascotas m JOIN estados_mascota e ON e.id_estado_mascota=m.id_estado_mascota WHERE e.codigo='adoptado') mascotas_adoptadas,
      (SELECT COUNT(*) FROM voluntarios WHERE estado='aprobado') voluntarios,
      (SELECT COUNT(*) FROM donaciones) donaciones,
      (SELECT COUNT(*) FROM solicitudes_adopcion) solicitudes_adopcion
  `);
  success(res, { summary, adoptions, donations, users, refugesByZone });
});

export const getSystemSettings = asyncHandler(async (req, res) => {
  const [settings] = await pool.query('SELECT clave, valor, grupo, descripcion, updated_at FROM configuraciones_sistema ORDER BY grupo, clave');
  success(res, { settings });
});

const EDITABLE_CATALOG_GROUPS = new Set(['tamanos','niveles_energia','tipos_organizacion','tipos_convenio']);
export const saveCatalogItem = asyncHandler(async (req, res) => {
  const { grupo, codigo, nombre, descripcion, orden=0 }=req.body;
  if (!EDITABLE_CATALOG_GROUPS.has(grupo)) return error(res,'Catálogo no editable',400);
  if (!codigo?.trim() || !nombre?.trim()) return error(res,'Código y nombre son obligatorios',400);
  const normalized=normalizeSlug(codigo).replace(/-/g,'_');
  if(req.params.id){
    const [before]=await pool.query('SELECT * FROM catalogos_sistema WHERE id=?',[req.params.id]);req.auditBefore=before[0]||null;
    const [result]=await pool.query('UPDATE catalogos_sistema SET grupo=?,codigo=?,nombre=?,descripcion=?,orden=?,activo=? WHERE id=?',
      [grupo,normalized,nombre.trim(),descripcion||null,Number(orden)||0,asBoolean(req.body.activo)?1:0,req.params.id]);
    if(!result.affectedRows)return error(res,'Valor no encontrado',404);
    return success(res,null,'Catálogo actualizado');
  }
  const [result]=await pool.query('INSERT INTO catalogos_sistema (grupo,codigo,nombre,descripcion,orden,activo) VALUES (?,?,?,?,?,?)',
    [grupo,normalized,nombre.trim(),descripcion||null,Number(orden)||0,asBoolean(req.body.activo)?1:0]);
  success(res,{id:result.insertId},'Valor agregado',201);
});

export const listPublicSystemCatalogs = asyncHandler(async (req,res)=>{
  const groups=String(req.query.grupos||'tamanos,niveles_energia,tipos_organizacion,tipos_convenio').split(',').filter((group)=>EDITABLE_CATALOG_GROUPS.has(group));
  if(!groups.length)return success(res,{catalogs:[]});
  const [catalogs]=await pool.query(`SELECT grupo,codigo,nombre FROM catalogos_sistema WHERE activo=1 AND grupo IN (${groups.map(()=>'?').join(',')}) ORDER BY grupo,orden,nombre`,groups);
  success(res,{catalogs});
});

export const updateSystemSettings = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.settings) ? req.body.settings : [];
  if (!items.length) return error(res, 'No hay configuraciones para guardar', 400);
  const allowed = new Set(['nombre_plataforma','email_soporte','modo_mantenimiento','solicitudes_refugio_habilitadas','dias_vigencia_invitacion']);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      if (!allowed.has(item.clave)) continue;
      await connection.query('UPDATE configuraciones_sistema SET valor=?, updated_by=? WHERE clave=?', [String(item.valor ?? ''), req.user.id, item.clave]);
    }
    await connection.commit();
    success(res, null, 'Configuración actualizada');
  } catch (err) {
    await connection.rollback(); throw err;
  } finally { connection.release(); }
});
