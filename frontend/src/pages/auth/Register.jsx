import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import GoogleSignIn from '../../components/auth/GoogleSignIn';

export default function Register() {
  return (
    <div className="min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center px-4 py-6 sm:py-12">
      <div className="card w-full max-w-md p-5 sm:p-8 text-center">
        <Users className="w-10 h-10 sm:w-12 sm:h-12 text-terracotta mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Crear cuenta</h1>
        <p className="text-brown-soft text-sm mb-6 sm:mb-8">
          Los usuarios se registran automáticamente al iniciar sesión con Google por primera vez.
        </p>
        <GoogleSignIn />
        <p className="text-sm text-brown-soft mt-6 sm:mt-8">
          ¿Eres administrador?{' '}
          <Link to="/login" className="text-terracotta font-medium">
            Acceso administrador
          </Link>
        </p>
      </div>
    </div>
  );
}
