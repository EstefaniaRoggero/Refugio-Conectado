import { lazy } from 'react';

// Home se carga de inmediato (landing / LCP)
export { default as Home } from '../pages/Home';

export const Mascotas = lazy(() => import('../pages/Mascotas'));
export const MascotaDetalle = lazy(() => import('../pages/MascotaDetalle'));
export const AdopcionForm = lazy(() => import('../pages/AdopcionForm'));
export const Donar = lazy(() => import('../pages/Donar'));
export const Voluntariado = lazy(() => import('../pages/Voluntariado'));
export const Recomendador = lazy(() => import('../pages/Recomendador'));
export const Contacto = lazy(() => import('../pages/Contacto'));
export const PerdidosEncontrados = lazy(() => import('../pages/PerdidosEncontrados'));
export const Novedades = lazy(() => import('../pages/Novedades'));
export const Login = lazy(() => import('../pages/auth/Login'));
export const Register = lazy(() => import('../pages/auth/Register'));
export const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
export const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
export const NotFound = lazy(() => import('../pages/NotFound'));

export const PanelHome = lazy(() => import('../pages/panel/PanelHome'));
export const MisSolicitudes = lazy(() => import('../pages/panel/MisSolicitudes'));
export const MisDonaciones = lazy(() => import('../pages/panel/MisDonaciones'));
export const Favoritos = lazy(() => import('../pages/panel/Favoritos'));
export const Perfil = lazy(() => import('../pages/panel/Perfil'));
export const Seguimiento = lazy(() => import('../pages/panel/Seguimiento'));
export const SeguimientoDetalle = lazy(() => import('../pages/panel/SeguimientoDetalle'));

export const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
export const AdminMascotas = lazy(() => import('../pages/admin/AdminMascotas'));
export const AdminSolicitudes = lazy(() => import('../pages/admin/AdminSolicitudes'));
export const AdminUsuarios = lazy(() => import('../pages/admin/AdminUsuarios'));
export const AdminDonaciones = lazy(() => import('../pages/admin/AdminDonaciones'));
export const AdminVoluntarios = lazy(() => import('../pages/admin/AdminVoluntarios'));
export const AdminMensajes = lazy(() => import('../pages/admin/AdminMensajes'));
export const AdminSeguimiento = lazy(() => import('../pages/admin/AdminSeguimiento'));
export const AdminPerdidos = lazy(() => import('../pages/admin/AdminPerdidos'));
export const AdminNoticias = lazy(() => import('../pages/admin/AdminNoticias'));

export const SuperAdminLogin = lazy(() => import('../pages/backoffice/SuperAdminLogin'));
export const SuperAdminDashboard = lazy(() => import('../pages/backoffice/SuperAdminDashboard'));
export const SuperAdminZones = lazy(() => import('../pages/backoffice/SuperAdminZones'));
export const SuperAdminRefugios = lazy(() => import('../pages/backoffice/SuperAdminRefugios'));
export const SuperAdminAdmins = lazy(() => import('../pages/backoffice/SuperAdminAdmins'));
export const SuperAdminUsers = lazy(() => import('../pages/backoffice/SuperAdminUsers'));
export const SuperAdminRefugeRequests = lazy(() => import('../pages/backoffice/SuperAdminRefugeRequests'));
export const SuperAdminOrganizations = lazy(() => import('../pages/backoffice/SuperAdminOrganizations'));
export const SuperAdminAgreements = lazy(() => import('../pages/backoffice/SuperAdminAgreements'));
export const SuperAdminStats = lazy(() => import('../pages/backoffice/SuperAdminStats'));
export const SuperAdminActivity = lazy(() => import('../pages/backoffice/SuperAdminActivity'));
export const SuperAdminSettings = lazy(() => import('../pages/backoffice/SuperAdminSettings'));
export const ActivateAdmin = lazy(() => import('../pages/backoffice/ActivateAdmin'));
