import pool from '../config/database.js';
import { MASCOTA_SELECT } from '../utils/lookups.js';
import { normalizeCriterios } from '../constants/adoptionCriteria.js';

export { normalizeCriterios };

/**
 * Pre-filtro SQL con restricciones duras + scoring heurístico inicial.
 * La IA recibe candidatos acotados para rankear y explicar.
 */
export async function buscarCandidatos(criteriosRaw, limit = 12, idRefugio = null) {
  const c = normalizeCriterios(criteriosRaw);

  let energiaPreferida = c.actividad_fisica || 'media';
  if (c.tiempo_disponible === 'poco' && energiaPreferida === 'alta') energiaPreferida = 'media';
  if (c.experiencia === 'ninguna' && energiaPreferida === 'alta') energiaPreferida = 'media';

  let tamanoPreferido = null;
  if (c.espacio === 'pequeño') tamanoPreferido = 'pequeño';
  else if (c.espacio === 'grande') tamanoPreferido = 'grande';
  else if (c.espacio === 'mediano') tamanoPreferido = 'mediano';

  const tipoFilter = c.preferencia_tipo !== 'cualquiera' ? c.preferencia_tipo : null;

  const [mascotas] = await pool.query(
    `${MASCOTA_SELECT}
     WHERE em.codigo = 'disponible' AND m.publicada = 1
     AND (CASE WHEN ? IS NOT NULL THEN m.id_refugio = ? ELSE 1 END)
     AND (CASE WHEN ? IN ('si', 'tal_vez') THEN m.compatible_ninos = 1 ELSE 1 END)
     AND (CASE WHEN ? = 'si' THEN m.compatible_mascotas = 1 ELSE 1 END)
     AND (CASE WHEN ? IS NOT NULL THEN tm.codigo = ? ELSE 1 END)
     ORDER BY
       (CASE WHEN m.nivel_energia = ? THEN 4 WHEN m.nivel_energia = 'media' THEN 2 ELSE 0 END) +
       (CASE WHEN m.tamano = ? THEN 4 WHEN ? = 'mediano' AND m.tamano = 'mediano' THEN 3 WHEN ? IS NULL THEN 1 ELSE 0 END) +
       (CASE WHEN ? = 'ninguna' AND m.nivel_energia = 'baja' THEN 2 ELSE 0 END) +
       (CASE WHEN ? = 'ninguna' AND m.edad >= 3 THEN 1 ELSE 0 END) +
       (CASE WHEN ? IN ('casa', 'finca') AND m.nivel_energia = 'alta' THEN 1 ELSE 0 END) +
       (CASE WHEN ? = 'departamento' AND m.tamano = 'grande' AND m.nivel_energia = 'alta' THEN -3 ELSE 0 END) DESC,
       m.destacada DESC
     LIMIT ?`,
    [
      idRefugio, idRefugio,
      c.ninos,
      c.otras_mascotas,
      tipoFilter, tipoFilter,
      energiaPreferida,
      tamanoPreferido, c.espacio, tamanoPreferido,
      c.experiencia,
      c.experiencia,
      c.tipo_vivienda,
      c.tipo_vivienda,
      limit,
    ]
  );

  return { criterios: c, candidatos: mascotas };
}

/**
 * Formato compacto para el contexto del LLM (menos tokens).
 */
export function formatMascotaForAI(m) {
  return {
    id: m.id,
    nombre: m.nombre,
    tipo: m.tipo,
    raza: m.raza_nombre,
    edad: `${m.edad} ${m.edad_unidad || 'años'}`,
    tamano: m.tamano,
    energia: m.nivel_energia || m.energia,
    sexo: m.sexo,
    descripcion: m.descripcion,
    personalidad: m.personalidad,
    comportamiento: m.comportamiento,
    estado_medico: m.estado_medico,
    compatible_ninos: Boolean(m.compatible_ninos),
    compatible_mascotas: Boolean(m.compatible_mascotas),
    historia: m.historia,
  };
}
