import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles, User, RotateCcw } from 'lucide-react';
import api from '../services/api';
import RecomendacionCard from '../components/agent/RecomendacionCard';
import Button from '../components/ui/Button';
import useTenantPath from '../hooks/useTenantPath';

const MENSAJE_INICIAL = {
  role: 'assistant',
  content:
    '¡Hola! Soy Luna. ¿Vivís en casa o en departamento? ¿Preferís perro, gato o te da igual?',
};

const MAX_ALTO_INPUT = 120;

const SUGERENCIAS = [
  'Vivo en un departamento pequeño',
  'Tengo casa con patio y niños',
  'Busco un gato tranquilo',
  'Soy muy activo y quiero un perro',
];

export default function Recomendador() {
  const navigate = useNavigate();
  const tenantPath = useTenantPath();
  const [messages, setMessages] = useState([MENSAJE_INICIAL]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiDisponible, setAiDisponible] = useState(null);
  const [proveedor, setProveedor] = useState(null);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [resumenPerfil, setResumenPerfil] = useState('');
  const [consejoGeneral, setConsejoGeneral] = useState('');
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_ALTO_INPUT)}px`;
  }, [input]);

  useEffect(() => {
    api.get('/agente/status')
      .then((res) => {
        setAiDisponible(res.data.data.disponible);
        setProveedor(res.data.data.proveedor);
      })
      .catch(() => setAiDisponible(false));
  }, []);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const enviarMensaje = async (texto) => {
    const contenido = (texto ?? input).trim();
    if (!contenido || loading) return;

    const nuevosMensajes = [...messages, { role: 'user', content: contenido }];
    setMessages(nuevosMensajes);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/agente/chat', { messages: nuevosMensajes });
      const data = res.data.data;

      setMessages((prev) => [...prev, { role: 'assistant', content: data.mensaje }]);

      if (data.recomendaciones?.length) {
        setRecomendaciones(data.recomendaciones);
        setResumenPerfil(data.resumen_perfil || '');
        setConsejoGeneral(data.consejo_general || '');
      }
    } catch (err) {
      const msg = err.response?.data?.message
        || 'No pude conectarme en este momento. Revisá tu conexión e intentá de nuevo.';
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const reiniciar = () => {
    setMessages([MENSAJE_INICIAL]);
    setRecomendaciones([]);
    setResumenPerfil('');
    setConsejoGeneral('');
    setInput('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 sm:py-10">
      <div className="text-center mb-5 sm:mb-8">
        <Sparkles className="hidden sm:block w-10 h-10 text-terracotta mx-auto mb-3" />
        <h1 className="section-title mb-2">Asistente de adopción con IA</h1>
        <p className="text-sm sm:text-base text-brown-soft max-w-2xl mx-auto">
          Conversa con Luna sobre tu hogar, rutina y experiencia. Ella analizará las mascotas del refugio
          y te recomendará las más compatibles contigo.
        </p>
        {aiDisponible === false && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block max-w-xl">
            Configura una API key gratis en <strong>backend/.env</strong>: obtén <code className="text-xs">GROQ_API_KEY</code> en{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline">console.groq.com</a>
            {' '}y reinicia el backend.
          </p>
        )}
        {proveedor && (
          <p className="mt-2 text-xs text-brown-soft">
            Motor IA: {proveedor.label} · {proveedor.model}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Chat */}
        <div className="card flex flex-col h-[min(75vh,640px)] min-h-[420px]">
          <div className="p-3 sm:p-4 border-b border-cream-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-terracotta/15 flex items-center justify-center">
                <Bot className="w-5 h-5 text-terracotta" />
              </div>
              <div>
                <p className="font-semibold text-brown-dark">Luna</p>
                <p className="text-xs text-brown-soft">Asistente de adopción · IA</p>
              </div>
            </div>
            <button
              onClick={reiniciar}
              className="text-brown-soft hover:text-terracotta p-2 rounded-lg hover:bg-cream-100 transition"
              title="Reiniciar conversación"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-brown-dark/10' : 'bg-terracotta/15'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-4 h-4 text-brown-dark" />
                    : <Bot className="w-4 h-4 text-terracotta" />}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-sm leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'bg-brown-dark text-warm-white rounded-br-md'
                    : 'bg-cream-100 text-brown-dark rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-terracotta/15 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-terracotta" />
                </div>
                <div className="bg-cream-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-terracotta/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 2 && (
            <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => enviarMensaje(s)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full border border-cream-200 text-brown-soft hover:border-terracotta hover:text-terracotta transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); enviarMensaje(); }}
            className="p-3 sm:p-4 border-t border-cream-200 flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  enviarMensaje();
                }
              }}
              enterKeyHint="send"
              placeholder="Escribí tu mensaje..."
              disabled={loading}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-cream-200 bg-warm-white focus:outline-none focus:border-terracotta text-base sm:text-sm resize-none overflow-y-auto leading-snug"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="p-2.5 shrink-0 rounded-xl bg-terracotta text-white disabled:opacity-50 hover:bg-terracotta/90 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Recomendaciones */}
        <div className="flex flex-col min-h-0 lg:max-h-[min(70vh,640px)]">
          <h2 className="font-semibold text-brown-dark flex items-center gap-2 mb-4 shrink-0">
            <Sparkles className="w-5 h-5 text-terracotta" />
            Tus recomendaciones
          </h2>

          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 min-h-0 pr-1 scroll-smooth">
            {resumenPerfil && (
              <div className="card p-4 text-sm text-brown-dark bg-terracotta/5 border-terracotta/20">
                <p className="font-medium mb-1">Tu perfil</p>
                <p className="text-brown-soft leading-relaxed">{resumenPerfil}</p>
              </div>
            )}

            {recomendaciones.length === 0 ? (
              <div className="card p-5 sm:p-8 text-center text-brown-soft text-sm">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Las recomendaciones aparecerán aquí cuando Luna tenga suficiente información sobre ti.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {recomendaciones.map((m, i) => (
                  <RecomendacionCard key={m.id} mascota={m} index={i} />
                ))}
              </div>
            )}

            {consejoGeneral && (
              <div className="card p-4 text-sm">
                <p className="font-medium text-brown-dark mb-1">Consejo de Luna</p>
                <p className="text-brown-soft leading-relaxed">{consejoGeneral}</p>
              </div>
            )}

            {recomendaciones.length > 0 && (
              <Button variant="secondary" className="w-full" onClick={() => navigate(tenantPath('mascotas'))}>
                Ver catálogo completo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
