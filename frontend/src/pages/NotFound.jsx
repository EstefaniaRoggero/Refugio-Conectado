import { Link, useParams } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import Button from '../components/ui/Button';
import useTenantPath from '../hooks/useTenantPath';

export default function NotFound() {
  const tenantPath = useTenantPath();
  const { slug } = useParams();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <PawPrint className="w-20 h-20 text-terracotta/30 mb-6" />
      <h1 className="text-6xl font-bold text-brown-dark mb-2">404</h1>
      <p className="text-brown-soft text-lg mb-8">Esta página se ha perdido como un cachorro curioso</p>
      <Link to={slug ? tenantPath() : '/'}><Button>Volver al inicio</Button></Link>
    </div>
  );
}
