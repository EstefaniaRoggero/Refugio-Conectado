import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { REFUGIO_COORDS } from '../../constants/site';

const MARKER_ICON = L.icon({
  iconUrl: '/favicon.svg',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -40],
});

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function toCoord(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza lat/lng desde la API o coordenadas por defecto del slug */
export function withMapCoords(refugios = []) {
  return refugios.map((r) => {
    const fallback = REFUGIO_COORDS[r.slug] || {};
    const lat = toCoord(r.latitud ?? r.lat) ?? toCoord(fallback.latitud);
    const lng = toCoord(r.longitud ?? r.lng) ?? toCoord(fallback.longitud);
    return { ...r, latitud: lat, longitud: lng, lat, lng };
  }).filter((r) => r.lat != null && r.lng != null);
}

function MapFallback({ message }) {
  return (
    <div className="card p-8 text-center border border-dashed border-cream-200">
      <p className="text-brown-soft text-sm">{message}</p>
    </div>
  );
}

function RefugioPopup({ refugio, onSelectRefugio }) {
  return (
    <div className="min-w-[160px] p-1">
      <div className="flex items-center gap-2 mb-1">
        <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-lg" />
        <p className="font-semibold text-sm text-brown-dark leading-tight m-0">{refugio.nombre}</p>
      </div>
      <p className="text-xs text-brown-soft mb-2 m-0">{refugio.direccion || refugio.ciudad}</p>
      {onSelectRefugio ? (
        <button
          type="button"
          className="text-terracotta text-xs font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
          onClick={() => onSelectRefugio(refugio.slug)}
        >
          Ingresar al refugio →
        </button>
      ) : (
        <a
          href={`https://www.openstreetmap.org/?mlat=${refugio.lat}&mlon=${refugio.lng}#map=15/${refugio.lat}/${refugio.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-terracotta text-xs font-semibold hover:underline"
        >
          Ver en mapa →
        </a>
      )}
    </div>
  );
}

export default function RefugiosMap({
  refugios = [],
  onSelectRefugio,
  height = '420px',
  zoom = 9,
}) {
  const markers = useMemo(() => withMapCoords(refugios), [refugios]);

  const center = useMemo(() => {
    if (!markers.length) return [-31.65, -63.7];
    return [
      markers.reduce((s, m) => s + m.lat, 0) / markers.length,
      markers.reduce((s, m) => s + m.lng, 0) / markers.length,
    ];
  }, [markers]);

  if (!markers.length) {
    return (
      <MapFallback message="No hay ubicaciones configuradas para mostrar en el mapa." />
    );
  }

  return (
    <div className="card overflow-hidden rounded-2xl border border-cream-200/60 refugios-map shadow-sm">
      <MapContainer
        key={`map-${markers.map((m) => m.slug).join('-')}`}
        center={center}
        zoom={zoom}
        style={{ width: '100%', height }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((r, index) => (
          <Marker
            key={r.id_refugio ?? r.slug ?? `marker-${index}`}
            position={[r.lat, r.lng]}
            icon={MARKER_ICON}
            title={r.nombre}
          >
            <Popup>
              <RefugioPopup refugio={r} onSelectRefugio={onSelectRefugio} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/** Mapa de un solo refugio (página de contacto) */
export function RefugioMap({ refugio, height = '280px' }) {
  if (!refugio) return null;
  return (
    <RefugiosMap
      refugios={[refugio]}
      height={height}
      zoom={14}
    />
  );
}
