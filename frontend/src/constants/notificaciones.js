import { Camera, Heart, DollarSign, HandHeart, Bell } from 'lucide-react';

export const NOTIFICACION_TIPO_ICON = {
  adopcion: Heart,
  seguimiento: Camera,
  donacion: DollarSign,
  voluntariado: HandHeart,
  sistema: Bell,
};

/** Ruta relativa al slug según tipo y rol */
export function notificacionDestino(tipo, rol) {
  const admin = rol === 'admin';
  switch (tipo) {
    case 'adopcion':
      return admin ? 'admin/solicitudes' : 'panel/solicitudes';
    case 'seguimiento':
      return admin ? 'admin/seguimiento' : 'panel/seguimiento';
    case 'donacion':
      return admin ? 'admin/donaciones' : 'donar?vista=historial';
    case 'voluntariado':
      return admin ? 'admin/voluntarios' : 'voluntariado';
    default:
      return admin ? 'admin' : 'panel';
  }
}
