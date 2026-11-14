import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const CLINICAL_SYSTEM_INSTRUCTION = `Eres el motor de IA clínica y de experiencia del paciente de un sistema de salud inteligente llamado GlucoSenda.
Tu objetivo es recibir datos agregados y alertas de anomalías detectadas en los registros de glucosa de pacientes con diabetes, analizar la tendencia subyacente y redactar un mensaje empático, personalizado, oportuno y motivador directamente para el paciente en español natural y cercano.

Reglas estrictas para el mensaje al paciente:
1. Identificar claramente el patrón o la anomalía observada (por ejemplo, picos altos nocturnos, descensos matutinos o elevación después del almuerzo) en un lenguaje comprensible, sin tecnicismos fríos.
2. Mantener un tono profesional, humano, cálido y de apoyo: NUNCA alarmista, culpabilizador ni catastrofista, pero sí consciente de la salud y atento.
3. Ofrecer UNA recomendación o acción práctica y sencilla (por ejemplo: un paseo corto de 10-15 minutos después de cenar, hidratarse con un vaso de agua, revisar una colación ligera antes de dormir o comentarlo con su médico en su próximo control).
4. Adaptar el formato y la extensión al canal solicitado (App móvil, WhatsApp o SMS) manteniendo cercanía y claridad.
5. Dirigirse al paciente por su primer nombre con calidez y respeto.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'glucosenda-clinical-ai' });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const {
        clinicalSummary,
        patientName,
        channel = 'whatsapp',
        tone = 'calido',
      } = req.body ?? {};

      if (!clinicalSummary || typeof clinicalSummary !== 'string') {
        res.status(400).json({
          error: 'Faltan los datos clínicos del paciente para realizar el análisis.',
        });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'No se encontró la clave GEMINI_API_KEY en el servidor. Configúrala en Settings > Secrets para activar el motor clínico.',
        });
        return;
      }

      const channelGuide =
        channel === 'sms'
          ? 'SMS corto (máximo ~320 caracteres, directo, cálido y claro).'
          : channel === 'app'
            ? 'Notificación enriquecida dentro de la app de salud (2 párrafos breves y acogedores).'
            : 'Mensaje de WhatsApp cercano y conversacional (2 párrafos cortos, fácil de leer en el móvil, sin exceso de emojis).';

      const toneGuide =
        tone === 'motivador'
          ? 'Acentúa el refuerzo positivo, reconociendo el esfuerzo diario y proponiendo el siguiente paso con entusiasmo realista.'
          : tone === 'sereno'
            ? 'Tono especialmente tranquilo, pausado y tranquilizador, ideal para evitar ansiedad ante valores fuera de rango.'
            : 'Tono cálido, cercano y empático, como un equipo clínico de confianza que acompaña al paciente.';

      const prompt = `Analiza el siguiente registro clínico de glucosa y genera tanto la síntesis de tendencia para el equipo de salud como el mensaje personalizado para el paciente (${patientName || 'Paciente'}).

Canal de salida: ${channelGuide}
Matiz de tono solicitado: ${toneGuide}

Datos clínicos del paciente:
${clinicalSummary}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: CLINICAL_SYSTEM_INSTRUCTION,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patronObservado: {
                type: Type.STRING,
                description:
                  'Nombre claro y preciso del patrón o anomalía detectada (ej. Picos hiperglucémicos nocturnos tras la cena).',
              },
              tendenciaSubyacente: {
                type: Type.STRING,
                description:
                  'Explicación clínica concisa (2-3 oraciones) de la tendencia observada en las últimas 24 horas.',
              },
              factoresContextuales: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  'Lista de 2 a 3 posibles factores cotidianos o fisiológicos asociados según el contexto provisto.',
              },
              asuntoNotificacion: {
                type: Type.STRING,
                description:
                  'Título breve y amable para la notificación o encabezado (máx. 60 caracteres).',
              },
              mensajePaciente: {
                type: Type.STRING,
                description:
                  'Mensaje completo listo para enviar al paciente en español, cumpliendo: identificar patrón, tono cálido no alarmista y acción práctica sencilla.',
              },
              recomendacionPractica: {
                type: Type.STRING,
                description:
                  'Resumen en 1 oración de la acción práctica y sencilla sugerida al paciente.',
              },
              categoriaAccion: {
                type: Type.STRING,
                description:
                  'Categoría principal de la recomendación: movimiento, hidratacion, ajuste_leve, o consulta_medica.',
              },
              criteriosCumplidos: {
                type: Type.OBJECT,
                properties: {
                  identificaPatron: { type: Type.BOOLEAN },
                  tonoEmpaticoNoAlarmista: { type: Type.BOOLEAN },
                  accionPracticaSencilla: { type: Type.BOOLEAN },
                },
                required: [
                  'identificaPatron',
                  'tonoEmpaticoNoAlarmista',
                  'accionPracticaSencilla',
                ],
              },
            },
            required: [
              'patronObservado',
              'tendenciaSubyacente',
              'factoresContextuales',
              'asuntoNotificacion',
              'mensajePaciente',
              'recomendacionPractica',
              'categoriaAccion',
              'criteriosCumplidos',
            ],
          },
        },
      });

      const rawJson = (response.text ?? '').trim();
      if (!rawJson) {
        res.status(502).json({
          error: 'El motor de IA devolvió una respuesta vacía. Intenta nuevamente.',
        });
        return;
      }

      const parsed = JSON.parse(rawJson);
      res.json(parsed);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado al analizar los datos clínicos.';
      console.error('Error en /api/analyze:', err);
      const status =
        message.includes('API_KEY_INVALID') || message.includes('403')
          ? 403
          : message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 500;
      res.status(status).json({
        error:
          status === 403
            ? 'La clave de Gemini API no es válida o no tiene permisos. Verifica Settings > Secrets.'
            : status === 429
              ? 'Se alcanzó el límite temporal de solicitudes de la API. Espera unos segundos e intenta de nuevo.'
              : `No pudimos completar el análisis clínico: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GlucoSenda server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
