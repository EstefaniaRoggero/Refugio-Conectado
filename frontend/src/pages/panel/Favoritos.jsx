import api from '../../services/api';
import MascotaCard from '../../components/mascotas/MascotaCard';
import Loader from '../../components/ui/Loader';
import useAsyncData from '../../hooks/useAsyncData';

export default function Favoritos() {
  const { data: favoritos = [], loading, reload } = useAsyncData(
    () => api.get('/favoritos').then((res) => res.data.data.favoritos),
    []
  );

  if (loading) return <Loader />;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Mis favoritos</h1>
      {favoritos.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-brown-soft">No tienes favoritos guardados</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {favoritos.map((m, i) => <MascotaCard key={m.id} mascota={m} index={i} onFavoriteToggle={reload} />)}
        </div>
      )}
    </div>
  );
}
