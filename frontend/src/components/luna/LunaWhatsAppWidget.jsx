import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../context/authStore';
import useTenantStore from '../../context/tenantStore';

const SUGERENCIAS = [
  '¿Cómo adopto una mascota?',
  '¿Cuándo es la próxima vacuna de mi mascota?',
  'Quiero ser voluntario',
  '¿Cómo puedo donar?',
];

function mensajeInicial(user) {
  if (user?.nombre) {
    return {
      role: 'assistant',
      content: `¡Hola ${user.nombre}! Soy Luna. ¿En qué te puedo ayudar hoy?`,
    };
  }
  return {
    role: 'assistant',
    content: '¡Hola! Soy Luna. ¿En qué te puedo ayudar hoy?',
  };
}

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function LunaWhatsAppWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const { refugio } = useTenantStore();
  const sessionKey = isAuthenticated && user?.id ? `user-${user.id}` : 'guest';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [mensajeInicial(user)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ disponible: null, waLink: null });
  const scrollRef = useRef(null);
  const lastSessionKey = useRef(sessionKey);

  useEffect(() => {
    if (lastSessionKey.current === sessionKey) return;
    lastSessionKey.current = sessionKey;
    setMessages([mensajeInicial(user)]);
    setInput('');
    setLoading(false);
    setOpen(false);
  }, [sessionKey, user]);

  useEffect(() => {
    api.get('/agente/luna/config')
      .then((res) => setConfig(res.data.data))
      .catch(() => setConfig({ disponible: false }));
  }, [refugio?.slug]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  const enviar = async (texto) => {
    const contenido = (texto ?? input).trim();
    if (!contenido || loading) return;

    const nuevos = [...messages, { role: 'user', content: contenido }];
    setMessages(nuevos);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/agente/luna', { messages: nuevos });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.data.mensaje }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Luna no está disponible en este momento.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const saludo = user?.nombre ? `Hola Luna, soy ${user.nombre}. ` : 'Hola Luna, ';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a] hover:scale-105 transition flex items-center justify-center"
        aria-label="Chatear con Luna por WhatsApp"
      >
        {open ? <X className="w-6 h-6" /> : <WhatsAppIcon className="w-7 h-7" />}
      </button>

      {open && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[calc(100vh-6rem)] sm:max-h-[min(70vh,520px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-cream-200 dark:border-brown-dark/50 bg-warm-white dark:bg-brown-dark">
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">Luna</p>
              <p className="text-xs text-white/80 truncate">
                {refugio?.nombre || 'Refugio Conectado'} · Asistente virtual
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#E5DDD5] dark:bg-brown-dark/80 min-h-[160px] sm:min-h-[240px] max-h-[320px]"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm shadow-sm break-words ${
                    m.role === 'user'
                      ? 'bg-[#DCF8C6] text-brown-dark rounded-br-none'
                      : 'bg-white dark:bg-brown-dark text-brown-dark dark:text-cream-100 rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-brown-dark px-3 py-2 rounded-lg text-sm text-brown-soft">
                  Luna está escribiendo…
                </div>
              </div>
            )}
          </div>

          {!loading && messages.length <= 2 && (
            <div className="px-3 py-2 bg-[#E5DDD5] dark:bg-brown-dark/60 flex flex-wrap gap-1.5">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-brown-dark text-brown-dark dark:text-cream-100 border border-cream-200 hover:border-[#25D366]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-2 bg-cream-50 dark:bg-brown-dark border-t border-cream-200 flex gap-2 items-end">
            <textarea
              className="input-field flex-1 min-h-[40px] max-h-24 text-base sm:text-sm py-2 resize-none"
              placeholder="Escribí tu mensaje…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              rows={1}
            />
            <button
              type="button"
              onClick={() => enviar()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-full bg-[#25D366] text-white disabled:opacity-50 shrink-0"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {config.waLink && (
            <a
              href={config.waLink.includes('?') ? config.waLink : `${config.waLink}?text=${encodeURIComponent(saludo + 'tengo una consulta.')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-[#075E54] bg-[#E8F5E9] hover:bg-[#C8E6C9] border-t border-cream-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Continuar en WhatsApp
            </a>
          )}
          {!isAuthenticated && (
            <p className="text-[10px] text-center text-brown-soft py-1.5 px-3 bg-cream-50">
              Iniciá sesión para que Luna recuerde tus adopciones y vacunas.
            </p>
          )}
        </div>
      )}
    </>
  );
}
