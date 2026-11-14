/** Criterios de adopción — fuente única para matcher, agente IA y conocimiento de dominio. */

export const ADOPTION_CRITERIA = {
  tipo_vivienda: ['departamento', 'casa', 'finca'],
  tiempo_disponible: ['poco', 'medio', 'mucho'],
  actividad_fisica: ['baja', 'media', 'alta'],
  experiencia: ['ninguna', 'poca', 'mucha'],
  espacio: ['pequeño', 'mediano', 'grande'],
  ninos: ['si', 'no', 'tal_vez'],
  otras_mascotas: ['si', 'no'],
  preferencia_tipo: ['perro', 'gato', 'cualquiera'],
};

export const CRITERIA_DESCRIPTIONS = {
  tipo_vivienda: 'Tipo de hogar del adoptante',
  tiempo_disponible: 'Horas diarias para cuidar a la mascota',
  actividad_fisica: 'Nivel de actividad del adoptante',
  experiencia: 'Experiencia previa con mascotas',
  espacio: 'Espacio interior/exterior disponible',
  ninos: 'Presencia de niños en el hogar',
  otras_mascotas: 'Si ya tiene otras mascotas',
  preferencia_tipo: 'Preferencia de especie',
};

export const CRITERIA_DEFAULTS = {
  actividad_fisica: 'media',
  experiencia: 'poca',
  espacio: 'mediano',
  ninos: 'no',
  otras_mascotas: 'no',
  preferencia_tipo: 'cualquiera',
};

export const TOOL_REQUIRED_CRITERIA = [
  'tipo_vivienda',
  'tiempo_disponible',
  'actividad_fisica',
  'experiencia',
  'espacio',
  'ninos',
  'otras_mascotas',
];

export function buildCriteriosPerfil() {
  return Object.fromEntries(
    Object.entries(ADOPTION_CRITERIA).map(([key, valores]) => [
      key,
      { valores, descripcion: CRITERIA_DESCRIPTIONS[key] },
    ])
  );
}

export function normalizeCriterios(raw = {}) {
  const pick = (val, allowed, fallback = null) => {
    if (!val) return fallback;
    const v = String(val).toLowerCase().trim();
    return allowed.includes(v) ? v : fallback;
  };

  return {
    tipo_vivienda: pick(raw.tipo_vivienda, ADOPTION_CRITERIA.tipo_vivienda),
    tiempo_disponible: pick(raw.tiempo_disponible, ADOPTION_CRITERIA.tiempo_disponible),
    actividad_fisica: pick(raw.actividad_fisica, ADOPTION_CRITERIA.actividad_fisica, CRITERIA_DEFAULTS.actividad_fisica),
    experiencia: pick(raw.experiencia, ADOPTION_CRITERIA.experiencia, CRITERIA_DEFAULTS.experiencia),
    espacio: pick(raw.espacio, ADOPTION_CRITERIA.espacio, CRITERIA_DEFAULTS.espacio),
    ninos: pick(raw.ninos, ADOPTION_CRITERIA.ninos, CRITERIA_DEFAULTS.ninos),
    otras_mascotas: pick(raw.otras_mascotas, ADOPTION_CRITERIA.otras_mascotas, CRITERIA_DEFAULTS.otras_mascotas),
    preferencia_tipo: pick(raw.preferencia_tipo, ADOPTION_CRITERIA.preferencia_tipo, CRITERIA_DEFAULTS.preferencia_tipo),
  };
}

export function buildAgentTools() {
  const properties = Object.fromEntries(
    Object.entries(ADOPTION_CRITERIA).map(([key, values]) => [
      key,
      { type: 'string', enum: values },
    ])
  );

  return [
    {
      type: 'function',
      function: {
        name: 'buscar_mascotas_compatibles',
        description:
          'Busca mascotas disponibles compatibles con el perfil del adoptante. Usar cuando tengas criterios suficientes.',
        parameters: {
          type: 'object',
          properties,
          required: TOOL_REQUIRED_CRITERIA,
        },
      },
    },
  ];
}
