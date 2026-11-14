import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Sidebar from '../components/layout/Sidebar';
import useAuthStore from '../context/authStore';

/** Catálogo público con sidebar fijo para usuarios adoptantes autenticados. */
export default function BrowseLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const showSidebar = isAuthenticated && ['usuario', 'voluntario'].includes(user?.rol);

  if (showSidebar) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-brown-dark">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex gap-8">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
