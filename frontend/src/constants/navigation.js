import {
  LayoutDashboard, PawPrint, Users, Heart, DollarSign, HandHeart, Mail, FileText, Camera, Siren, Megaphone,
} from 'lucide-react';

/** segment = ruta relativa al slug del refugio (ej. /:slug/mascotas) */
export const ZONE_SELECTOR_LABEL = 'Cambiar refugio';

export const PUBLIC_NAV_LINKS = [
  { segment: 'mascotas', label: 'Mascotas' },
  { segment: 'perdidos', label: 'Perdidos', highlight: true },
  { segment: 'novedades', label: 'Novedades' },
  { segment: 'recomendador', label: 'Recomendador' },
  { segment: 'donar', label: 'Donar' },
  { segment: 'voluntariado', label: 'Voluntariado' },
  { segment: 'contacto', label: 'Contacto' },
];

export const FOOTER_LINKS = [
  { segment: 'mascotas', label: 'Adoptar' },
  { segment: 'perdidos', label: 'Perdidos y encontrados' },
  { segment: 'novedades', label: 'Novedades' },
  { segment: 'donar', label: 'Donar' },
  { segment: 'voluntariado', label: 'Voluntariado' },
  { segment: 'recomendador', label: 'Recomendador IA' },
];

export const ADMIN_SIDEBAR_ITEMS = [
  { segment: 'admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { segment: 'admin/mascotas', icon: PawPrint, label: 'Mascotas' },
  { segment: 'admin/solicitudes', icon: FileText, label: 'Solicitudes' },
  { segment: 'admin/seguimiento', icon: Camera, label: 'Seguimiento' },
  { segment: 'admin/perdidos', icon: Siren, label: 'Perdidos' },
  { segment: 'admin/novedades', icon: Megaphone, label: 'Novedades' },
  { segment: 'admin/usuarios', icon: Users, label: 'Usuarios' },
  { segment: 'admin/donaciones', icon: DollarSign, label: 'Donaciones' },
  { segment: 'admin/voluntarios', icon: HandHeart, label: 'Voluntarios' },
  { segment: 'admin/mensajes', icon: Mail, label: 'Mensajes' },
];

export const USER_SIDEBAR_ITEMS = [
  { segment: 'panel', icon: LayoutDashboard, label: 'Mi panel', end: true },
  { segment: 'panel/solicitudes', icon: FileText, label: 'Mis solicitudes' },
  { segment: 'panel/seguimiento', icon: Camera, label: 'Seguimiento' },
  { segment: 'panel/favoritos', icon: Heart, label: 'Favoritos' },
  { segment: 'panel/perfil', icon: Users, label: 'Mi perfil' },
];
