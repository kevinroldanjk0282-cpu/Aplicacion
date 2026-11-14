import type { ClinicalMetrics } from '../types/clinical';

interface ClinicalMetricsStripProps {
  metrics: ClinicalMetrics;
}

export function ClinicalMetricsStrip({ metrics }: ClinicalMetricsStripProps) {
  return (
    <section
      aria-label="Indicadores glucémicos agregados"
      className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0"
    >
      <div className="p-4">
        <p className="text-xs font-medium text-slate-500">Promedio 24 h</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {metrics.avgMgDl}
          </span>
          <span className="font-mono text-xs text-slate-500">mg/dL</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {metrics.count} lecturas analizadas
        </p>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium text-slate-500">Tiempo en rango</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {metrics.timeInRangePct}
          </span>
          <span className="font-mono text-xs text-slate-500">%</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          Meta clínica: 70–180 mg/dL
        </p>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium text-slate-500">Mínimo y pico</p>
        <div className="mt-1.5 flex items-baseline gap-1.5 font-mono">
          <span className="text-2xl font-semibold tabular-nums text-slate-900">
            {metrics.minMgDl}–{metrics.maxMgDl}
          </span>
          <span className="text-xs text-slate-500">mg/dL</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          Pico a las {metrics.maxTime} · Mín {metrics.minTime}
        </p>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium text-slate-500">Variabilidad (CV)</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span
            className={`font-mono text-2xl font-semibold tabular-nums ${
              metrics.cvPct >= 36 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {metrics.cvPct}
          </span>
          <span className="font-mono text-xs text-slate-500">%</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          {metrics.cvPct >= 36 ? 'Oscilación elevada (≥ 36%)' : 'Estabilidad aceptable (< 36%)'}
        </p>
      </div>
    </section>
  );
}
