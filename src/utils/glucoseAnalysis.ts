import type {
  AlertSeverity,
  ClinicalMetrics,
  DiabetesType,
  GlucoseReading,
  PatientCase,
} from '../types/clinical';

export const TARGET_MIN_MGDL = 70;
export const TARGET_MAX_MGDL = 180;
export const CRITICAL_HIGH_MGDL = 250;
export const CRITICAL_LOW_MGDL = 54;

export function parseTimeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return -1;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

export function normalizeTimeString(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time.trim();
  const h = match[1].padStart(2, '0');
  const m = match[2].padStart(2, '0');
  return `${h}:${m}`;
}

export function calculateClinicalMetrics(readings: GlucoseReading[]): ClinicalMetrics {
  if (readings.length === 0) {
    return {
      count: 0,
      avgMgDl: 0,
      minMgDl: 0,
      minTime: '--:--',
      maxMgDl: 0,
      maxTime: '--:--',
      timeInRangePct: 0,
      timeAboveRangePct: 0,
      timeBelowRangePct: 0,
      cvPct: 0,
      detectedPatternLabel: 'Sin lecturas suficientes',
      detectedWindow: '--',
      severity: 'atencion',
    };
  }

  let sum = 0;
  let minReading = readings[0];
  let maxReading = readings[0];
  let inRange = 0;
  let aboveRange = 0;
  let belowRange = 0;

  for (const r of readings) {
    sum += r.value;
    if (r.value < minReading.value) minReading = r;
    if (r.value > maxReading.value) maxReading = r;
    if (r.value >= TARGET_MIN_MGDL && r.value <= TARGET_MAX_MGDL) {
      inRange += 1;
    } else if (r.value > TARGET_MAX_MGDL) {
      aboveRange += 1;
    } else {
      belowRange += 1;
    }
  }

  const count = readings.length;
  const mean = sum / count;
  const variance =
    readings.reduce((acc, r) => acc + Math.pow(r.value - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);
  const cvPct = mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0;

  const timeInRangePct = Math.round((inRange / count) * 100);
  const timeAboveRangePct = Math.round((aboveRange / count) * 100);
  const timeBelowRangePct = Math.round((belowRange / count) * 100);

  const pattern = detectGlucosePattern(readings, cvPct);

  let severity: AlertSeverity = 'atencion';
  if (
    minReading.value < CRITICAL_LOW_MGDL ||
    maxReading.value >= CRITICAL_HIGH_MGDL ||
    belowRange >= 2
  ) {
    severity = 'critica';
  } else if (aboveRange >= 3 || belowRange >= 1 || cvPct >= 36) {
    severity = 'moderada';
  }

  return {
    count,
    avgMgDl: Math.round(mean),
    minMgDl: minReading.value,
    minTime: minReading.time,
    maxMgDl: maxReading.value,
    maxTime: maxReading.time,
    timeInRangePct,
    timeAboveRangePct,
    timeBelowRangePct,
    cvPct,
    detectedPatternLabel: pattern.label,
    detectedWindow: pattern.window,
    severity,
  };
}

function detectGlucosePattern(
  readings: GlucoseReading[],
  cvPct: number
): { label: string; window: string } {
  const nocturnalHighs = readings.filter((r) => {
    const mins = parseTimeToMinutes(r.time);
    const isNight = mins >= 22 * 60 || (mins >= 0 && mins <= 5 * 60 + 30);
    return isNight && r.value > TARGET_MAX_MGDL;
  });

  const morningLows = readings.filter((r) => {
    const mins = parseTimeToMinutes(r.time);
    const isMorning = mins >= 4 * 60 && mins <= 9 * 60;
    return isMorning && r.value < TARGET_MIN_MGDL;
  });

  const anyLows = readings.filter((r) => r.value < TARGET_MIN_MGDL);

  const middayPostprandial = readings.filter((r) => {
    const mins = parseTimeToMinutes(r.time);
    const isMidday = mins >= 12 * 60 + 30 && mins <= 17 * 60;
    return isMidday && r.value > TARGET_MAX_MGDL;
  });

  if (morningLows.length >= 1) {
    const minLow = morningLows.reduce((a, b) => (a.value < b.value ? a : b));
    return {
      label: 'Descenso hacia hipoglucemia matutina',
      window: `Madrugada / mañana (${minLow.time})`,
    };
  }

  if (anyLows.length >= 1) {
    const minLow = anyLows.reduce((a, b) => (a.value < b.value ? a : b));
    return {
      label: 'Episodio de glucosa baja',
      window: `Alrededor de las ${minLow.time}`,
    };
  }

  if (nocturnalHighs.length >= 2) {
    const times = nocturnalHighs.map((r) => r.time);
    return {
      label: 'Picos hiperglucémicos nocturnos',
      window: `${times[0]} – ${times[times.length - 1]}`,
    };
  }

  if (middayPostprandial.length >= 2) {
    const times = middayPostprandial.map((r) => r.time);
    return {
      label: 'Elevación posprandial tras la comida',
      window: `${times[0]} – ${times[times.length - 1]}`,
    };
  }

  if (cvPct >= 36) {
    return {
      label: 'Variabilidad glucémica elevada',
      window: 'Oscilación en ciclo de 24 h',
    };
  }

  const allHighs = readings.filter((r) => r.value > TARGET_MAX_MGDL);
  if (allHighs.length >= 1) {
    const peak = allHighs.reduce((a, b) => (a.value > b.value ? a : b));
    return {
      label: 'Elevación glucémica puntual',
      window: `Pico registrado a las ${peak.time}`,
    };
  }

  return {
    label: 'Perfil glucémico estable en rango',
    window: 'Últimas 24 horas',
  };
}

export function parseGlucoseInput(rawText: string): {
  readings: GlucoseReading[];
  error?: string;
} {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      readings: [],
      error: 'Ingresa al menos 3 lecturas de glucosa en formato texto o JSON.',
    };
  }

  // Try JSON format first if it starts with [ or {
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.readings)
          ? parsed.readings
          : Array.isArray(parsed.lecturas)
            ? parsed.lecturas
            : null;

      if (!list) {
        return {
          readings: [],
          error:
            'El JSON debe ser un arreglo de objetos con hora y valor (ej. [{"time":"22:00","value":195}]).',
        };
      }

      const readings: GlucoseReading[] = [];
      for (const item of list) {
        const rawTime = String(item.time ?? item.hora ?? '');
        const rawValue = Number(item.value ?? item.glucosa ?? item.mgDl);
        const context =
          typeof item.context === 'string'
            ? item.context
            : typeof item.contexto === 'string'
              ? item.contexto
              : undefined;

        const mins = parseTimeToMinutes(rawTime);
        if (mins < 0) {
          return {
            readings: [],
            error: `Hora inválida en JSON: "${rawTime}". Usa formato 24h HH:MM.`,
          };
        }
        if (!Number.isFinite(rawValue) || rawValue < 20 || rawValue > 600) {
          return {
            readings: [],
            error: `Valor de glucosa fuera de rango clínico (20–600 mg/dL): "${item.value ?? item.glucosa}".`,
          };
        }
        readings.push({
          time: normalizeTimeString(rawTime),
          value: Math.round(rawValue),
          context,
        });
      }

      if (readings.length < 3) {
        return {
          readings: [],
          error: 'Se requieren al menos 3 lecturas válidas para analizar una tendencia.',
        };
      }

      return { readings };
    } catch {
      return {
        readings: [],
        error: 'El bloque JSON no tiene una sintaxis válida. Revisa comillas y corchetes.',
      };
    }
  }

  // Line-by-line format: "08:00, 118" or "08:00 118" or "08:00 - 118 - Ayuno"
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const readings: GlucoseReading[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = /^(\d{1,2}:\d{2})\s*[,;\t\- ]+\s*(\d{2,3}(?:\.\d+)?)(?:\s*[,;\t\- ]+\s*(.+))?$/.exec(
      line
    );
    if (!match) {
      return {
        readings: [],
        error: `Línea ${i + 1} no reconocida: "${line}". Usa el formato "HH:MM, valor" (ej. "23:30, 218").`,
      };
    }
    const time = normalizeTimeString(match[1]);
    if (parseTimeToMinutes(time) < 0) {
      return {
        readings: [],
        error: `Hora inválida en la línea ${i + 1}: "${match[1]}".`,
      };
    }
    const val = Math.round(Number(match[2]));
    if (!Number.isFinite(val) || val < 20 || val > 600) {
      return {
        readings: [],
        error: `Valor de glucosa inválido en la línea ${i + 1} (${val} mg/dL). Debe estar entre 20 y 600.`,
      };
    }
    readings.push({
      time,
      value: val,
      context: match[3]?.trim() || undefined,
    });
  }

  if (readings.length < 3) {
    return {
      readings: [],
      error: 'Se requieren al menos 3 lecturas válidas para identificar una tendencia.',
    };
  }

  return { readings };
}

export interface CustomCaseValidationInput {
  patientName: string;
  age: number;
  diabetesType: DiabetesType;
  alertTitle: string;
  readings: GlucoseReading[];
}

export function validatePatientCaseInput(input: CustomCaseValidationInput): string[] {
  const errors: string[] = [];
  if (!input.patientName.trim()) {
    errors.push('El nombre del paciente es obligatorio.');
  }
  if (!Number.isFinite(input.age) || input.age < 1 || input.age > 120) {
    errors.push('La edad debe ser un número entre 1 y 120 años.');
  }
  if (!input.alertTitle.trim()) {
    errors.push('Describe brevemente la alerta o anomalía detectada.');
  }
  if (input.readings.length < 3) {
    errors.push('Agrega al menos 3 lecturas de glucosa válidas.');
  }
  return errors;
}

export function formatClinicalSummaryForPrompt(
  patientCase: PatientCase,
  metrics: ClinicalMetrics
): string {
  const readingsText = patientCase.readings
    .map((r) => `${r.time}: ${r.value} mg/dL${r.context ? ` (${r.context})` : ''}`)
    .join('\n');

  return [
    `Paciente: ${patientCase.patientName} (${patientCase.age} años, ${patientCase.diabetesType})`,
    `Alerta registrada: ${patientCase.alertTitle}`,
    `Tratamiento actual: ${patientCase.treatmentSummary || 'No especificado'}`,
    `Contexto clínico / hábitos: ${patientCase.clinicalContext || 'Sin notas adicionales'}`,
    `Métricas agregadas (24h):`,
    `- Promedio: ${metrics.avgMgDl} mg/dL`,
    `- Mínimo: ${metrics.minMgDl} mg/dL a las ${metrics.minTime}`,
    `- Máximo: ${metrics.maxMgDl} mg/dL a las ${metrics.maxTime}`,
    `- Tiempo en rango (70–180 mg/dL): ${metrics.timeInRangePct}%`,
    `- Tiempo por encima (>180 mg/dL): ${metrics.timeAboveRangePct}%`,
    `- Tiempo por debajo (<70 mg/dL): ${metrics.timeBelowRangePct}%`,
    `- Variabilidad (CV): ${metrics.cvPct}%`,
    `- Patrón preliminar detectado: ${metrics.detectedPatternLabel} (${metrics.detectedWindow})`,
    `Serie de lecturas:`,
    readingsText,
  ].join('\n');
}
