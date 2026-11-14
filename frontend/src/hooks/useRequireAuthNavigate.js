import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';

export default function useRequireAuthNavigate() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();

  return (path) => {
    const fullPath = path.startsWith('/') ? `/${slug}${path}` : `/${slug}/${path}`;
    if (isAuthenticated) {
      navigate(fullPath);
      return;
    }
    navigate(`/${slug}/login`, { state: { from: { pathname: fullPath } } });
  };
}
