/**
 * Luna — asistente ampliado para adoptantes, donantes y voluntarios (web + WhatsApp).
 */
import { getAIClient, getAIModel, isAIConfigured, getProviderInfo } from '../config/aiProvider.js';
import { AGENT_KNOWLEDGE, REGLAS_INSTITUCIONALES, formatLunaReply } from './agentKnowledge.js';
import { buildLunaUserContext, formatContextForPrompt } from './lunaContextService.js';

export function buildLunaAssistantPrompt({ refugio, userContextText }) {
  const refugioNombre = refugio?.nombre || AGENT_KNOWLEDGE.nombre;
  const ciudad = refugio?.ciudad ? ` (${refugio.ciudad})` : '';

  return `Eres ${AGENT_KNOWLEDGE.asistente}, asistente virtual de ${refugioNombre}${ciudad} — plataforma Refugio Conectado.

CANALES: Chat web y WhatsApp. Escribí como en un mensaje corto de WhatsApp.

${REGLAS_INSTITUCIONALES}

ESTILO (obligatorio):
- Amable, cálido y profesional.
- Cada mensaje: 1–3 frases cortas. Si necesitás preguntar, UNA sola pregunta breve al final.
- No uses markdown ni símbolos de formato: nada de **, ##, listas con -, *, viñetas ni código.
- Evitá paredes de texto y cuestionarios largos.
- Como máximo un emoji si suma, no más.

PUEDES AYUDAR CON:
- Adopción: proceso, requisitos, cómo solicitar, seguimiento post-adopción.
- Recomendaciones: si quieren match personalizado, sugerí el Recomendador IA en la web.
- Donaciones y voluntariado: cómo hacerlo en la plataforma.
- Perdidos y encontrados: cualquier persona puede publicar o ver avisos desde la sección Perdidos, sin registrarse; el refugio revisa cada aviso antes de publicarlo.
- Novedades: campañas de vacunación, castración y eventos del refugio, en la sección Novedades.
- Post-adopción y salud: recordatorios según datos del sistema; NO diagnósticos (derivá al veterinario o al refugio).
- Info del refugio: contacto y ubicación.

REGLAS:
- Si hay datos del usuario abajo, personalizá con su nombre y situación.
- No inventes datos médicos ni fechas que no estén en el contexto.
- No ofrezcas enviar correos, fotos ni archivos, ni agendar visitas: indicá la sección de la plataforma que corresponde o el contacto del refugio.

PROCESO DE ADOPCIÓN (solo si lo preguntan):
${AGENT_KNOWLEDGE.procesoAdopcion.map((p, i) => `${i + 1}. ${p}`).join('\n')}

CONTEXTO DEL USUARIO:
${userContextText || 'Sin datos personalizados.'}`;
}

export async function chatWithLuna(messages, { idRefugio, user, refugio } = {}) {
  const client = getAIClient();
  const model = getAIModel();

  let userContextText = 'Usuario invitado.';
  if (user?.id && idRefugio) {
    const ctx = await buildLunaUserContext(user.id, idRefugio);
    userContextText = formatContextForPrompt(ctx);
  }

  const systemPrompt = buildLunaAssistantPrompt({ refugio, userContextText });

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await client.chat.completions.create({
    model,
    temperature: 0.5,
    messages: apiMessages,
  });

  const mensaje = formatLunaReply(
    response.choices[0]?.message?.content
      || '¡Hola! Soy Luna. ¿En qué te puedo ayudar?'
  );

  return {
    mensaje,
    proveedor: getProviderInfo(),
  };
}

export { isAIConfigured, getProviderInfo };
