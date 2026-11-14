import '../config/env.js';
import pool from '../config/database.js';
import { MASCOTA_SELECT } from '../utils/lookups.js';
import { getAIClient, getAIModel, isAIConfigured, getProviderInfo } from '../config/aiProvider.js';
import { buildSystemPrompt, buildTurnInstruction, formatLunaReply } from './agentKnowledge.js';
import { buscarCandidatos, formatMascotaForAI } from './petMatcherService.js';
import { buildAgentTools } from '../constants/adoptionCriteria.js';

async function enrichRecomendaciones(ranked) {
  if (!ranked?.length) return [];
  const ids = ranked.map((r) => r.id);
  const [rows] = await pool.query(
    `${MASCOTA_SELECT} WHERE m.id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  const byId = Object.fromEntries(rows.map((m) => [m.id, m]));
  return ranked
    .filter((r) => byId[r.id])
    .map((r) => ({
      ...byId[r.id],
      puntuacion: r.puntuacion,
      razon: formatLunaReply(r.razon),
      consideraciones: formatLunaReply(r.consideraciones),
    }));
}

const TOOLS = buildAgentTools();

const TURNO_RECOMENDACION = 3;
const MAX_HISTORIAL = 10;
const MAX_CANDIDATOS = 8;

async function chatCompletion(params) {
  const client = getAIClient();
  const model = getAIModel();
  return client.chat.completions.create({ model, ...params });
}

async function rankWithAI(criterios, candidatos) {
  const petsContext = candidatos.map(formatMascotaForAI);

  const completion = await chatCompletion({
    temperature: 0.4,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Eres un experto en adopción responsable de mascotas. Analiza el perfil del adoptante y rankea las mascotas candidatas.
Responde SOLO JSON válido con esta estructura:
{
  "resumen_perfil": "1 frase corta en texto plano",
  "recomendaciones": [
    { "id": number, "puntuacion": number (0-100), "razon": "1-2 oraciones claras sin markdown", "consideraciones": "1 oración breve si aplica" }
  ],
  "consejo_general": "1-2 oraciones amables en texto plano"
}
Sin markdown ni símbolos de formato (**, #, listas). Ordena de mayor a menor puntuación. Máximo 5. Solo IDs de la lista.`,
      },
      {
        role: 'user',
        content: JSON.stringify({ perfil_adoptante: criterios, mascotas_candidatas: petsContext }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { recomendaciones: [], resumen_perfil: '', consejo_general: '' };
  }

  const byId = Object.fromEntries(candidatos.map((m) => [m.id, m]));
  const recomendaciones = (parsed.recomendaciones || [])
    .filter((r) => byId[r.id])
    .slice(0, 5)
    .map((r) => ({
      ...byId[r.id],
      puntuacion: r.puntuacion,
      razon: r.razon,
      consideraciones: r.consideraciones,
    }));

  return {
    resumen_perfil: formatLunaReply(parsed.resumen_perfil || ''),
    consejo_general: formatLunaReply(parsed.consejo_general || ''),
    recomendaciones,
  };
}

async function executeTool(name, args, idRefugio) {
  if (name !== 'buscar_mascotas_compatibles') {
    return { error: `Herramienta desconocida: ${name}` };
  }

  const { criterios, candidatos } = await buscarCandidatos(args, MAX_CANDIDATOS, idRefugio);

  if (!candidatos.length) {
    return {
      criterios,
      total: 0,
      mensaje: 'No hay mascotas disponibles que cumplan los filtros básicos de compatibilidad.',
      recomendaciones: [],
    };
  }

  const ranked = await rankWithAI(criterios, candidatos);

  return {
    criterios,
    total: candidatos.length,
    resumen_perfil: ranked.resumen_perfil,
    consejo_general: ranked.consejo_general,
    recomendaciones: ranked.recomendaciones.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      puntuacion: r.puntuacion,
      razon: r.razon,
      consideraciones: r.consideraciones,
    })),
  };
}

export async function chatWithAgent(messages, { idRefugio } = {}) {
  const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const assistantTurnsSoFar = history.filter((m) => m.role === 'assistant').length;
  const nextTurn = assistantTurnsSoFar + 1;
  const shouldRecommend = nextTurn === TURNO_RECOMENDACION;
  const yaRecomendo = nextTurn > TURNO_RECOMENDACION;

  const apiMessages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'system', content: buildTurnInstruction(assistantTurnsSoFar) },
    ...history.slice(-MAX_HISTORIAL).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  let toolChoice = 'none';
  if (shouldRecommend) toolChoice = { type: 'function', function: { name: 'buscar_mascotas_compatibles' } };
  else if (yaRecomendo) toolChoice = 'auto';

  let response = await chatCompletion({
    temperature: 0.55,
    messages: apiMessages,
    tools: TOOLS,
    tool_choice: toolChoice,
  });

  let choice = response.choices[0]?.message;
  let recomendaciones = null;
  let criterios = null;
  let consejoGeneral = null;
  let resumenPerfil = null;

  for (let round = 0; round < 2 && choice?.tool_calls?.length; round++) {
    apiMessages.push(choice);

    for (const toolCall of choice.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const result = await executeTool(toolCall.function.name, args, idRefugio);

      if (result.criterios) criterios = result.criterios;
      if (result.recomendaciones?.length) {
        recomendaciones = await enrichRecomendaciones(result.recomendaciones);
        resumenPerfil = result.resumen_perfil;
        consejoGeneral = result.consejo_general;
      }

      apiMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    response = await chatCompletion({
      temperature: 0.55,
      messages: apiMessages,
      tools: TOOLS,
      tool_choice: 'none',
    });
    choice = response.choices[0]?.message;
  }

  return {
    mensaje: formatLunaReply(
      choice?.content
        || (shouldRecommend
          ? 'Con lo que me contaste, estas mascotas podrían encajar bien con vos.'
          : yaRecomendo
            ? 'Si te gustó alguna, tocá "Ver ficha y adoptar" en su tarjeta para completar la solicitud.'
            : '¿Me contás un poco más de tu hogar?')
    ),
    criterios,
    resumen_perfil: formatLunaReply(resumenPerfil),
    consejo_general: formatLunaReply(consejoGeneral),
    recomendaciones,
    proveedor: getProviderInfo(),
  };
}

export async function recomendarConIA(criteriosRaw, idRefugio = null) {
  const { criterios, candidatos } = await buscarCandidatos(criteriosRaw, 12, idRefugio);

  if (!candidatos.length) {
    return { criterios, recomendaciones: [], resumen_perfil: '', consejo_general: '' };
  }

  const ranked = await rankWithAI(criterios, candidatos);
  return {
    criterios,
    resumen_perfil: ranked.resumen_perfil,
    consejo_general: ranked.consejo_general,
    recomendaciones: await enrichRecomendaciones(ranked.recomendaciones),
    proveedor: getProviderInfo(),
  };
}

export { isAIConfigured, getProviderInfo };
