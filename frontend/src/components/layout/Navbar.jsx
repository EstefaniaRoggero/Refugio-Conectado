import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, PawPrint, Moon, Sun, User, LogOut, Siren } from 'lucide-react';
import useAuthStore from '../../context/authStore';
import useThemeStore from '../../context/themeStore';
import useTenantStore from '../../context/tenantStore';
import useTenantPath from '../../hooks/useTenantPath';
import ChangeRefugioLink from './ChangeRefugioLink';
import NotificationBell from './NotificationBell';
import { PUBLIC_NAV_LINKS, USER_SIDEBAR_ITEMS, ADMIN_SIDEBAR_ITEMS } from '../../constants/navigation';

const DESKTOP_QUERY = '(min-width: 1024px)';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const { isAuthenticated, user, logout } = useAuthStore();
  const { refugio } = useTenantStore();
  const { darkMode, toggleDark } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const tenantPath = useTenantPath();

  const isAdminRoute = location.pathname.includes('/admin');
  const isAdmin = isAuthenticated && user?.rol === 'admin';
  const showPublicNav = user?.rol !== 'admin' && !isAdminRoute;
  const handleLogout = () => {
    logout();
    navigate(tenantPath());
  };

  return (
    <header className="sticky top-0 z-40 bg-warm-white/90 dark:bg-brown-dark/90 backdrop-blur-md border-b border-cream-200/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link to={tenantPath()} className="flex items-center gap-2 min-w-0 text-brown-dark dark:text-cream-50">
          <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 text-terracotta shrink-0" />
          <span className="flex flex-col leading-tight min-w-0">
            <span className="font-semibold text-base sm:text-lg truncate">Refugio Conectado</span>
            {refugio?.ciudad && (
              <span className="text-xs sm:text-sm text-brown-soft dark:text-cream-200 truncate">{refugio.ciudad}</span>
            )}
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          <ChangeRefugioLink
            className="flex items-center gap-1.5 text-sm font-medium text-brown-soft hover:text-terracotta transition"
          />
          {showPublicNav && PUBLIC_NAV_LINKS.map((link) => (
            <NavLink
              key={link.segment}
              to={tenantPath(link.segment)}
              className={({ isActive }) =>
                `inline-flex items-center gap-1 text-sm font-medium capitalize transition ${
                  isActive
                    ? 'text-terracotta font-semibold'
                    : link.highlight
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-brown-dark dark:text-cream-100 hover:text-terracotta dark:hover:text-orange-pastel'
                }`
              }
            >
              {link.highlight && <Siren className="w-4 h-4" />}
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button onClick={toggleDark} className="p-2 rounded-xl hover:bg-cream-200 transition" aria-label="Modo oscuro">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {isAuthenticated ? (
            <>
              {isDesktop && <NotificationBell />}
              <Link
                to={tenantPath(user?.rol === 'admin' ? 'admin' : 'panel')}
                className="flex items-center gap-2 text-sm font-medium text-brown-soft hover:text-terracotta"
              >
                <User className="w-4 h-4" />
                {user?.nombre}
              </Link>
              <button onClick={handleLogout} className="p-2 text-brown-soft hover:text-terracotta" aria-label="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link to={tenantPath('login')} className="text-sm font-medium text-brown-soft hover:text-terracotta">Iniciar sesión</Link>
          )}
        </div>

        <div className="lg:hidden flex items-center gap-1">
          {isAuthenticated && !isDesktop && <NotificationBell onOpen={() => setOpen(false)} />}
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menú">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-cream-200 bg-warm-white dark:bg-brown-dark px-4 py-4"
          >
            <ChangeRefugioLink
              className="flex items-center gap-2 py-2 text-terracotta font-medium"
              onNavigate={() => setOpen(false)}
            />
            {showPublicNav && PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.segment}
                to={tenantPath(link.segment)}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 py-2 hover:text-terracotta ${
                  link.highlight ? 'text-red-600 font-medium' : 'text-brown-dark dark:text-cream-100'
                }`}
              >
                {link.highlight && <Siren className="w-4 h-4" />}
                {link.highlight ? 'Perdidos y encontrados' : link.label}
              </Link>
            ))}
            {showPublicNav && (
              <>
                <div className="pt-4 border-t border-cream-200 mt-2" />
                {USER_SIDEBAR_ITEMS.map((item) => (
                  <Link key={item.segment} to={tenantPath(item.segment)} onClick={() => setOpen(false)} className="block py-2 text-brown-dark dark:text-cream-100 hover:text-terracotta">
                    {item.label}
                  </Link>
                ))}
              </>
            )}
            {isAdmin && (
              <div className="pt-2 border-t border-cream-200 mt-2">
                {ADMIN_SIDEBAR_ITEMS.map((item) => (
                  <NavLink
                    key={item.segment}
                    to={tenantPath(item.segment)}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2 ${
                        isActive
                          ? 'text-terracotta font-semibold'
                          : 'text-brown-dark dark:text-cream-100 hover:text-terracotta'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
            <div className={`${showPublicNav || isAdmin ? 'pt-4 border-t border-cream-200 mt-2' : ''} flex flex-col gap-2`}>
              {isAuthenticated ? (
                <>
                  {!showPublicNav && !isAdmin && (
                    <Link to={tenantPath(user?.rol === 'admin' ? 'admin' : 'panel')} onClick={() => setOpen(false)}>Mi panel</Link>
                  )}
                  <button onClick={handleLogout} className="text-left text-red-500">Cerrar sesión</button>
                </>
              ) : (
                <Link to={tenantPath('login')} onClick={() => setOpen(false)}>Iniciar sesión</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
