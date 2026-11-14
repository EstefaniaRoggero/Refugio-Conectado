export const EMPTY_MASCOTA_FORM = {
  nombre: '',
  descripcion: '',
  historia: '',
  edad: 1,
  edad_unidad: 'años',
  tamano: 'mediano',
  energia: 'media',
  sexo: 'macho',
  tipo: 'perro',
  estado: 'disponible',
  vacunas: '',
  estado_medico: '',
  personalidad: '',
  comportamiento: '',
  compatible_ninos: 1,
  compatible_mascotas: 1,
  destacada: 0,
  imagen: '',
};

export const MASCOTA_API_FIELDS = [
  'nombre', 'descripcion', 'historia', 'edad', 'edad_unidad', 'tamano', 'energia', 'sexo',
  'tipo', 'estado', 'vacunas', 'estado_medico', 'personalidad', 'comportamiento',
  'compatible_ninos', 'compatible_mascotas', 'destacada', 'publicada',
];

export const MASCOTA_TIPO_OPTIONS = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
];

export const MASCOTA_ESTADO_OPTIONS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'adoptado', label: 'Adoptado' },
];

export const MASCOTA_TAMANO_OPTIONS = [
  { value: 'pequeño', label: 'Pequeño' },
  { value: 'mediano', label: 'Mediano' },
  { value: 'grande', label: 'Grande' },
];

export const MASCOTA_ENERGIA_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

export const MASCOTA_SEXO_OPTIONS = [
  { value: 'macho', label: 'Macho' },
  { value: 'hembra', label: 'Hembra' },
];

export const MASCOTA_EDAD_UNIDAD_OPTIONS = [
  { value: 'meses', label: 'Meses' },
  { value: 'años', label: 'Años' },
];

export const withFilterAll = (options, allLabel = 'Todos') => [
  { value: '', label: allLabel },
  ...options,
];

export const MASCOTA_BOOLEAN_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Sí' },
  { value: '0', label: 'No' },
];

export const pickMascotaFields = (data) =>
  Object.fromEntries(
    MASCOTA_API_FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])
  );

export const mapMascotaToForm = (m) => ({
  ...m,
  energia: m.energia || m.nivel_energia || 'media',
  edad_unidad: m.edad_unidad || 'años',
  compatible_ninos: m.compatible_ninos ? 1 : 0,
  compatible_mascotas: m.compatible_mascotas ? 1 : 0,
  destacada: m.destacada ? 1 : 0,
});
