import { useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import type { MessageChannel, MessageHistoryItem } from '../types/clinical';

interface HistoryViewProps {
  items: MessageHistoryItem[];
  onGoToMonitor: () => void;
}

const CHANNEL_NAMES: Record<MessageChannel, string> = {
  whatsapp: 'WhatsApp',
  app: 'App móvil',
  sms: 'SMS',
};

export function HistoryView({ items, onGoToMonitor }: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | MessageChannel>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    const matchesChannel = channelFilter === 'all' || item.channel === channelFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.patientName.toLowerCase().includes(q) ||
      item.patternLabel.toLowerCase().includes(q) ||
      item.messageText.toLowerCase().includes(q);
    return matchesChannel && matchesSearch;
  });

  const handleCopy = async (item: MessageHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.messageText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore if clipboard permission denied
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Historial de comunicaciones aprobadas
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Registro de mensajes empáticos revisados y autorizados para pacientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="history-search" className="sr-only">
                Buscar en historial
              </label>
              <input
                id="history-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar paciente o mensaje..."
                className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'whatsapp', 'app', 'sms'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannelFilter(ch)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    channelFilter === ch
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ch === 'all' ? 'Todos' : CHANNEL_NAMES[ch]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-base font-semibold text-slate-900">
              Todavía no hay envíos aprobados
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
              Analiza una alerta en el monitor clínico, ajusta el mensaje si lo deseas y haz clic
              en &quot;Aprobar y registrar envío&quot;.
            </p>
            <button
              type="button"
              onClick={onGoToMonitor}
              className="mt-5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Ir al monitor clínico
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No hay registros que coincidan con el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Patrón detectado</th>
                  <th className="px-5 py-3">Canal</th>
                  <th className="px-5 py-3">Mensaje enviado</th>
                  <th className="px-5 py-3 text-right">Hora</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.patientName}</div>
                      <div className="text-xs text-slate-500">{item.diabetesType}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-[200px]">
                      <div className="font-medium text-slate-900">{item.patternLabel}</div>
                      <div className="mt-1 text-slate-500">{item.recommendation}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {CHANNEL_NAMES[item.channel]}
                    </td>
                    <td className="px-5 py-4 text-xs leading-relaxed text-slate-700 max-w-md">
                      {item.messageText}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xs tabular-nums text-slate-500 whitespace-nowrap">
                      {item.approvedAt}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-700" aria-hidden="true" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" aria-hidden="true" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
