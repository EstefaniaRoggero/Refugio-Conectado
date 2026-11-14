import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileCheck2,
  Handshake,
  Landmark,
  LogOut,
  MapPinned,
  Menu,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import useAuthStore from "../context/authStore";

const items = [
  { to: "/backoffice", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/backoffice/zonas", label: "Gestión de Zonas", icon: MapPinned },
  { to: "/backoffice/refugios", label: "Gestión de Refugios", icon: Building2 },
  { to: "/backoffice/usuarios", label: "Gestión de Usuarios", icon: Users },
  { to: "/backoffice/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/backoffice/auditoria", label: "Auditoría", icon: ClipboardList },
  { to: "/backoffice/configuracion", label: "Configuración", icon: Settings },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate("/backoffice/login");
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-40 border-b border-cream-200 bg-warm-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-1 text-brown-dark"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu />
            </button>
            <span className="w-9 h-9 rounded-xl bg-terracotta text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">
                Backoffice global
              </p>
              <p className="text-xs text-brown-soft truncate">
                {user?.nombre} {user?.apellido}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 text-sm text-brown-soft hover:text-terracotta"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-8 lg:flex lg:gap-6">
        {menuOpen && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-[min(19rem,88vw)] lg:w-72 shrink-0 bg-warm-white lg:bg-transparent p-3 lg:p-0 transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-2 py-3 lg:hidden">
            <p className="font-bold">Menú global</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
            >
              <X />
            </button>
          </div>
          <nav className="lg:sticky lg:top-24 card p-2 flex flex-col gap-1 max-h-[calc(100dvh-2rem)] lg:max-h-[calc(100dvh-7rem)] overflow-y-auto">
            {items.map((item) => (
              <NavLink
                onClick={() => setMenuOpen(false)}
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "bg-terracotta text-white" : "hover:bg-cream-100 text-brown-dark"}`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
