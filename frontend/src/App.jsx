import { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MainLayout from './layouts/MainLayout';
import BrowseLayout from './layouts/BrowseLayout';
import UserLayout from './layouts/UserLayout';
import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import TenantProvider from './routes/TenantProvider';
import { ProtectedRoute } from './routes/ProtectedRoute';
import useThemeStore from './context/themeStore';
import Loader from './components/ui/Loader';
import SeleccionRefugio from './pages/SeleccionRefugio';

import {
  Home,
  Mascotas,
  MascotaDetalle,
  AdopcionForm,
  Donar,
  Voluntariado,
  Recomendador,
  Contacto,
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  NotFound,
  PanelHome,
  MisSolicitudes,
  MisDonaciones,
  Favoritos,
  Perfil,
  Seguimiento,
  SeguimientoDetalle,
  AdminDashboard,
  AdminMascotas,
  AdminSolicitudes,
  AdminUsuarios,
  AdminDonaciones,
  AdminVoluntarios,
  AdminMensajes,
  AdminSeguimiento,
  SuperAdminLogin,
  SuperAdminDashboard,
  SuperAdminZones,
  SuperAdminRefugios,
  SuperAdminAdmins,
  SuperAdminUsers,
  SuperAdminRefugeRequests,
  SuperAdminOrganizations,
  SuperAdminAgreements,
  SuperAdminStats,
  SuperAdminActivity,
  SuperAdminSettings,
  ActivateAdmin,
  AdminPerdidos,
  PerdidosEncontrados,
  AdminNoticias,
  Novedades,
} from './routes/lazyPages';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => { initTheme(); }, [initTheme]);

  const routes = (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<SeleccionRefugio />} />

        <Route path="/backoffice/login" element={<SuperAdminLogin />} />
        <Route path="/backoffice/activar/:token" element={<ActivateAdmin />} />
        <Route element={<ProtectedRoute roles={['super_admin']} loginPath="/backoffice/login"><SuperAdminLayout /></ProtectedRoute>}>
          <Route path="/backoffice" element={<SuperAdminDashboard />} />
          <Route path="/backoffice/zonas" element={<SuperAdminZones />} />
          <Route path="/backoffice/refugios" element={<SuperAdminRefugios />} />
          <Route path="/backoffice/administradores" element={<SuperAdminAdmins />} />
          <Route path="/backoffice/usuarios" element={<SuperAdminUsers />} />
          <Route path="/backoffice/solicitudes-refugios" element={<SuperAdminRefugeRequests />} />
          <Route path="/backoffice/municipalidades" element={<SuperAdminOrganizations />} />
          <Route path="/backoffice/veterinarias" element={<SuperAdminOrganizations />} />
          <Route path="/backoffice/convenios" element={<SuperAdminAgreements />} />
          <Route path="/backoffice/estadisticas" element={<SuperAdminStats />} />
          <Route path="/backoffice/auditoria" element={<SuperAdminActivity />} />
          <Route path="/backoffice/actividad" element={<SuperAdminActivity />} />
          <Route path="/backoffice/configuracion" element={<SuperAdminSettings />} />
        </Route>

        <Route path="/:slug" element={<TenantProvider />}>
          <Route element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Register />} />
            <Route path="recuperar-password" element={<ForgotPassword />} />
            <Route path="restablecer-password" element={<ResetPassword />} />
          </Route>

          <Route element={<BrowseLayout />}>
            <Route path="mascotas" element={<Mascotas />} />
            <Route path="mascotas/:id" element={<MascotaDetalle />} />
            <Route path="perdidos" element={<PerdidosEncontrados />} />
            <Route path="novedades" element={<Novedades />} />
            <Route
              path="adoptar/:id"
              element={<ProtectedRoute roles={['usuario', 'voluntario']}><AdopcionForm /></ProtectedRoute>}
            />
          </Route>

          <Route element={<ProtectedRoute roles={['usuario', 'voluntario']}><UserLayout /></ProtectedRoute>}>
            <Route path="donar" element={<Donar />} />
            <Route path="voluntariado" element={<Voluntariado />} />
            <Route path="recomendador" element={<Recomendador />} />
            <Route path="contacto" element={<Contacto />} />
            <Route path="panel" element={<PanelHome />} />
            <Route path="panel/solicitudes" element={<MisSolicitudes />} />
            <Route path="panel/donaciones" element={<MisDonaciones />} />
            <Route path="panel/favoritos" element={<Favoritos />} />
            <Route path="panel/perfil" element={<Perfil />} />
            <Route path="panel/seguimiento" element={<Seguimiento />} />
            <Route path="panel/seguimiento/:id" element={<SeguimientoDetalle />} />
          </Route>

          <Route path="admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout admin /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="mascotas" element={<AdminMascotas />} />
            <Route path="solicitudes" element={<AdminSolicitudes />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="donaciones" element={<AdminDonaciones />} />
            <Route path="voluntarios" element={<AdminVoluntarios />} />
            <Route path="mensajes" element={<AdminMensajes />} />
            <Route path="seguimiento" element={<AdminSeguimiento />} />
            <Route path="seguimiento/:id" element={<AdminSeguimiento />} />
            <Route path="perdidos" element={<AdminPerdidos />} />
            <Route path="novedades" element={<AdminNoticias />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );

  if (!googleClientId) return routes;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {routes}
    </GoogleOAuthProvider>
  );
}
