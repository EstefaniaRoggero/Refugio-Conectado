import { useState, useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [-31.42, -64.18];
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const GEOCODING_URL = import.meta.env.VITE_GEOCODING_URL || 'https://nominatim.openstreetmap.org';
let lastGeocodingRequest = 0;
const MARKER_ICON = L.icon({
  iconUrl: '/favicon.svg',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
});

const toNumber = (value) => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

function MapView({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (lat == null || lng == null) return;
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);

  return null;
}

function LocationMarker({ lat, lng, onChange }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  if (lat == null || lng == null) return null;

  return (
    <Marker
      position={[lat, lng]}
      icon={MARKER_ICON}
      draggable
      eventHandlers={{
        dragend(event) {
          const point = event.target.getLatLng();
          onChange(point.lat, point.lng);
        },
      }}
    />
  );
}

export default function LocationPickerMap({ latitud, longitud, searchHint, onChange }) {
  const lat = toNumber(latitud);
  const lng = toNumber(longitud);
  const hasPosition = lat != null && lng != null;
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');

  const updatePosition = (nextLat, nextLng) => {
    onChange(Number(nextLat).toFixed(7), Number(nextLng).toFixed(7));
    setMessage('Ubicación seleccionada. Podés ajustar el marcador arrastrándolo.');
  };

  const search = async () => {
    const text = query.trim() || searchHint?.trim();
    if (!text) {
      setMessage('Escribí una dirección o completá primero la ciudad.');
      return;
    }

    const cacheKey = `refugio-geocode:${text.toLowerCase()}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const result = JSON.parse(cached);
        updatePosition(result.lat, result.lon);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    if (Date.now() - lastGeocodingRequest < 1000) {
      setMessage('Esperá un segundo antes de realizar otra búsqueda.');
      return;
    }

    setSearching(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'ar', q: text });
      lastGeocodingRequest = Date.now();
      const response = await fetch(`${GEOCODING_URL}/search?${params}`);
      if (!response.ok) throw new Error('No se pudo consultar el mapa');
      const [result] = await response.json();
      if (!result) {
        setMessage('No encontramos ese lugar. Probá agregando provincia y país.');
        return;
      }
      sessionStorage.setItem(cacheKey, JSON.stringify({ lat: result.lat, lon: result.lon }));
      updatePosition(result.lat, result.lon);
    } catch {
      setMessage('No se pudo buscar ahora. Igualmente podés seleccionar el lugar haciendo clic en el mapa.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="mt-5">
      <div className="flex items-start gap-2 mb-3">
        <MapPin className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-brown-dark">Ubicación en el mapa</h3>
          <p className="text-xs text-brown-soft">Buscá el lugar y después hacé clic en el punto exacto. También podés arrastrar el marcador.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          className="input-field flex-1"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              search();
            }
          }}
          placeholder={searchHint || 'Ej.: San Martín 123, Pilar, Córdoba'}
          aria-label="Buscar dirección en el mapa"
        />
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="btn-secondary inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
        >
          <Search className="w-4 h-4" /> {searching ? 'Buscando…' : 'Buscar en mapa'}
        </button>
      </div>

      <div className="refugios-map overflow-hidden rounded-2xl border border-cream-200 bg-cream-50">
        <MapContainer
          center={hasPosition ? [lat, lng] : DEFAULT_CENTER}
          zoom={hasPosition ? 15 : 7}
          style={{ width: '100%', height: '300px' }}
          scrollWheelZoom
        >
          <TileLayer attribution={OSM_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapView lat={lat} lng={lng} />
          <LocationMarker lat={lat} lng={lng} onChange={updatePosition} />
        </MapContainer>
      </div>
      <p className={`mt-2 text-xs ${message.startsWith('No ') ? 'text-red-600' : 'text-brown-soft'}`} aria-live="polite">
        {message || (hasPosition ? `Punto actual: ${latitud}, ${longitud}` : 'Todavía no seleccionaste una ubicación.')}
      </p>
    </section>
  );
}
