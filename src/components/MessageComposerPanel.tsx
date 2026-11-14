import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type {
  ClinicalAIResponse,
  MessageChannel,
  PatientCase,
  TonePreference,
} from '../types/clinical';

interface MessageComposerPanelProps {
  patient: PatientCase;
  channel: MessageChannel;
  tone: TonePreference;
  draftMessage: string;
  isAnalyzing: boolean;
  error: string | null;
  onChangeChannel: (channel: MessageChannel) => void;
  onChangeTone: (tone: TonePreference) => void;
  onChangeDraft: (text: string) => void;
  onAnalyze: () => void;
  onApprove: () => void;
}

const CHANNEL_OPTIONS: { id: MessageChannel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'app', label: 'App móvil' },
  { id: 'sms', label: 'SMS' },
];

const TONE_OPTIONS: { id: TonePreference; label: string }[] = [
  { id: 'calido', label: 'Cálido y cercano' },
  { id: 'motivador', label: 'Motivador' },
  { id: 'sereno', label: 'Sereno y tranquilizador' },
];

const ACTION_CATEGORY_LABELS: Record<ClinicalAIResponse['categoriaAccion'], string> = {
  movimiento: 'Actividad física ligera',
  hidratacion: 'Hidratación',
  ajuste_leve: 'Ajuste de rutina',
  consulta_medica: 'Seguimiento médico',
};

export function MessageComposerPanel({
  patient,
  channel,
  tone,
  draftMessage,
  isAnalyzing,
  error,
  onChangeChannel,
  onChangeTone,
  onChangeDraft,
  onAnalyze,
  onApprove,
}: MessageComposerPanelProps) {
  const [copied, setCopied] = useState(false);

  const analysis = patient.generatedAnalysis;
  const isApproved = patient.status === 'aprobado';

  const handleCopy = async () => {
    const textToCopy = draftMessage || analysis?.mensajePaciente || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts; ignore silently
    }
  };

  return (
    <section
      aria-label="Motor de análisis clínico y redacción empática"
      className="rounded-xl border border-slate-200 bg-white"
    >
      {/* Panel header with channel and tone controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Síntesis clínica y mensaje al paciente
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Adapta el canal y matiz empático antes de generar o aprobar la comunicación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Canal de entrega">
            {CHANNEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeChannel(opt.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  channel === opt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="tone-select" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Tono:
            </label>
            <select
              id="tone-select"
              value={tone}
              onChange={(e) => onChangeTone(e.target.value as TonePreference)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="m-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
            <div>
              <p className="font-medium">No se pudo generar el mensaje clínico</p>
              <p className="mt-0.5 text-xs text-rose-800">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 whitespace-nowrap shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading skeleton state */}
      {isAnalyzing && (
        <div className="space-y-4 p-5" aria-busy="true">
          <div className="flex items-center justify-between text-xs font-medium text-teal-800">
            <span>Analizando patrón glucémico y redactando mensaje empático para {patient.patientName}...</span>
            <span className="font-mono text-slate-400">Procesando</span>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
              <div className="h-20 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
              <div className="h-14 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="space-y-3 lg:col-span-7">
              <div className="h-4 w-52 animate-pulse rounded bg-slate-200" />
              <div className="h-36 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="flex justify-end gap-2">
                <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-9 w-44 animate-pulse rounded-lg bg-teal-100" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Idle / unanalyzed state */}
      {!isAnalyzing && !analysis && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="max-w-xl">
            <h4 className="text-sm font-semibold text-slate-900">
              Listo para analizar la tendencia de {patient.patientName}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              El motor evaluará las {patient.readings.length} lecturas de glucosa, identificará el
              patrón subyacente y redactará un mensaje empático con una acción práctica para{' '}
              <span className="font-medium text-slate-900">
                {CHANNEL_OPTIONS.find((c) => c.id === channel)?.label}
              </span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onAnalyze}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Analizar tendencia y redactar mensaje</span>
          </button>
        </div>
      )}

      {/* Populated clinical analysis & editable patient message */}
      {!isAnalyzing && analysis && (
        <div className="grid grid-cols-1 divide-y divide-slate-200 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left column: Clinical Trend Synthesis */}
          <div className="space-y-5 p-5 lg:col-span-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Patrón observado</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {analysis.patronObservado}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Tendencia subyacente</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">
                {analysis.tendenciaSubyacente}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Factores asociados en el registro</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {analysis.factoresContextuales.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden="true" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-medium text-slate-500">
                Recomendación sugerida · {ACTION_CATEGORY_LABELS[analysis.categoriaAccion] || 'Cuidado diario'}
              </p>
              <p className="mt-1 text-sm text-slate-800">{analysis.recomendacionPractica}</p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-medium text-slate-500">Criterios de calidad comunicacional</p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Identifica claramente el patrón observado</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Tono humano, cálido y libre de alarmismo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Incluye acción práctica y sencilla</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right column: Patient-Facing Message Composer & Preview */}
          <div className="flex flex-col justify-between p-5 lg:col-span-7">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label htmlFor="patient-message-editor" className="text-xs font-medium text-slate-500">
                    Borrador para el paciente ({CHANNEL_OPTIONS.find((c) => c.id === channel)?.label})
                  </label>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">
                    {analysis.asuntoNotificacion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onAnalyze}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Regenerar</span>
                </button>
              </div>

              <textarea
                id="patient-message-editor"
                rows={9}
                value={draftMessage}
                onChange={(e) => onChangeDraft(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Editable antes del envío · Dirigido a {patient.patientName}</span>
                <span className="font-mono tabular-nums">{draftMessage.length} caracteres</span>
              </div>
            </div>

            {/* Action bar */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>

              {isApproved ? (
                <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Mensaje aprobado y registrado ({patient.approvedAt})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={!draftMessage.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Aprobar y registrar envío</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
