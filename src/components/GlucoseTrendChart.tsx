import { useState } from 'react';
import type { GlucoseReading } from '../types/clinical';
import {
  CRITICAL_HIGH_MGDL,
  CRITICAL_LOW_MGDL,
  TARGET_MAX_MGDL,
  TARGET_MIN_MGDL,
} from '../utils/glucoseAnalysis';

interface GlucoseTrendChartProps {
  readings: GlucoseReading[];
  detectedPatternLabel: string;
  detectedWindow: string;
}

export function GlucoseTrendChart({
  readings,
  detectedPatternLabel,
  detectedWindow,
}: GlucoseTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (readings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Sin lecturas de glucosa para graficar.
      </div>
    );
  }

  const width = 820;
  const height = 215;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 18;
  const padBottom = 28;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const minVal = 40;
  const maxVal = Math.max(260, ...readings.map((r) => r.value + 20));

  const xForIndex = (idx: number) => {
    if (readings.length === 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (readings.length - 1)) * plotWidth;
  };

  const yForValue = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    const ratio = (clamped - minVal) / (maxVal - minVal);
    return padTop + plotHeight - ratio * plotHeight;
  };

  const points = readings.map((r, i) => ({
    ...r,
    idx: i,
    x: xForIndex(i),
    y: yForValue(r.value),
  }));

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const targetTopY = yForValue(TARGET_MAX_MGDL);
  const targetBottomY = yForValue(TARGET_MIN_MGDL);
  const targetBandHeight = targetBottomY - targetTopY;

  const yTicks = [50, 100, 150, 180, 220, 250].filter((v) => v <= maxVal);

  const activePoint =
    hoveredIdx !== null && points[hoveredIdx]
      ? points[hoveredIdx]
      : points.reduce((best, p) => {
          const bestOut = best.value > TARGET_MAX_MGDL || best.value < TARGET_MIN_MGDL;
          const pOut = p.value > TARGET_MAX_MGDL || p.value < TARGET_MIN_MGDL;
          if (pOut && !bestOut) return p;
          if (p.value > best.value && p.value > TARGET_MAX_MGDL) return p;
          if (p.value < best.value && p.value < TARGET_MIN_MGDL) return p;
          return best;
        }, points[0]);

  const statusText = (val: number) => {
    if (val >= CRITICAL_HIGH_MGDL) return 'Hiperglucemia marcada';
    if (val > TARGET_MAX_MGDL) return 'Por encima de rango';
    if (val <= CRITICAL_LOW_MGDL) return 'Hipoglucemia significativa';
    if (val < TARGET_MIN_MGDL) return 'Por debajo de rango';
    return 'En rango objetivo';
  };

  const dotColor = (val: number) => {
    if (val >= CRITICAL_HIGH_MGDL || val <= CRITICAL_LOW_MGDL) return '#DC2626';
    if (val > TARGET_MAX_MGDL || val < TARGET_MIN_MGDL) return '#D97706';
    return '#0F766E';
  };

  return (
    <section
      aria-label="Curva glucémica de 24 horas"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Curva glucémica y detección de anomalías
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{detectedPatternLabel}</span>
            <span aria-hidden="true">·</span>
            <span>Ventana: {detectedWindow}</span>
            <span aria-hidden="true">·</span>
            <span>Banda sombreada: 70–180 mg/dL</span>
          </div>
        </div>

        {/* Interactive point telemetry readout */}
        <div
          aria-live="polite"
          className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs"
        >
          <div>
            <span className="text-slate-500">Hora </span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {activePoint.time}
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            |
          </span>
          <div>
            <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
              {activePoint.value}
            </span>
            <span className="ml-1 font-mono text-slate-500">mg/dL</span>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            |
          </span>
          <span className="font-medium text-slate-700">
            {activePoint.context ? `${activePoint.context} · ` : ''}
            {statusText(activePoint.value)}
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[600px] select-none"
          role="img"
          aria-label={`Gráfico de tendencia de glucosa con ${readings.length} mediciones`}
        >
          {/* Target zone 70 - 180 mg/dL */}
          <rect
            x={padLeft}
            y={targetTopY}
            width={plotWidth}
            height={targetBandHeight}
            fill="rgba(15, 118, 110, 0.065)"
          />

          {/* Horizontal reference gridlines */}
          {yTicks.map((tick) => {
            const y = yForValue(tick);
            const isThreshold = tick === TARGET_MAX_MGDL || tick === 70;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isThreshold ? '#94A3B8' : '#E2E8F0'}
                  strokeWidth={1}
                  strokeDasharray={isThreshold ? '4 4' : undefined}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[11px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* 70 mg/dL exact threshold line */}
          <line
            x1={padLeft}
            y1={targetBottomY}
            x2={width - padRight}
            y2={targetBottomY}
            stroke="#94A3B8"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text
            x={padLeft - 8}
            y={targetBottomY + 4}
            textAnchor="end"
            className="fill-slate-400 font-mono text-[11px]"
          >
            70
          </text>

          {/* Active crosshair vertical hairline */}
          <line
            x1={activePoint.x}
            y1={padTop}
            x2={activePoint.x}
            y2={height - padBottom}
            stroke="#CBD5E1"
            strokeWidth={1}
          />

          {/* Main glucose trend polyline */}
          <polyline
            fill="none"
            stroke="#0F766E"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data points & X-axis labels */}
          {points.map((p, idx) => {
            const isActive = p.idx === activePoint.idx;
            const color = dotColor(p.value);
            const showXLabel =
              readings.length <= 10 || idx % 2 === 0 || idx === readings.length - 1;

            return (
              <g key={`${p.time}-${idx}`}>
                {showXLabel && (
                  <text
                    x={p.x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[11px]"
                  >
                    {p.time}
                  </text>
                )}

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6 : 4}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />

                {/* Transparent hover/focus target */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
