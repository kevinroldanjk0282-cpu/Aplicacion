export type DiabetesType = 'Diabetes tipo 1' | 'Diabetes tipo 2' | 'Diabetes gestacional' | 'Prediabetes';

export type AlertSeverity = 'atencion' | 'moderada' | 'critica';

export type MessageChannel = 'app' | 'whatsapp' | 'sms';

export type TonePreference = 'calido' | 'motivador' | 'sereno';

export interface GlucoseReading {
  time: string; // HH:MM (24h)
  value: number; // mg/dL
  context?: string; // e.g., "Antes de dormir", "Posprandial"
}

export interface ClinicalMetrics {
  count: number;
  avgMgDl: number;
  minMgDl: number;
  minTime: string;
  maxMgDl: number;
  maxTime: string;
  timeInRangePct: number; // 70 - 180 mg/dL
  timeAboveRangePct: number; // > 180 mg/dL
  timeBelowRangePct: number; // < 70 mg/dL
  cvPct: number; // Coefficient of Variation (%)
  detectedPatternLabel: string;
  detectedWindow: string;
  severity: AlertSeverity;
}

export interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  diabetesType: DiabetesType;
  alertTitle: string;
  alertTimestamp: string;
  severity: AlertSeverity;
  clinicalContext: string;
  treatmentSummary: string;
  preferredChannel: MessageChannel;
  readings: GlucoseReading[];
  status: 'pendiente' | 'aprobado';
  generatedAnalysis?: ClinicalAIResponse;
  approvedMessage?: string;
  approvedAt?: string;
}

export interface ClinicalAIResponse {
  patronObservado: string;
  tendenciaSubyacente: string;
  factoresContextuales: string[];
  mensajePaciente: string;
  asuntoNotificacion: string;
  recomendacionPractica: string;
  categoriaAccion: 'movimiento' | 'hidratacion' | 'ajuste_leve' | 'consulta_medica';
  criteriosCumplidos: {
    identificaPatron: boolean;
    tonoEmpaticoNoAlarmista: boolean;
    accionPracticaSencilla: boolean;
  };
}

export interface MessageHistoryItem {
  id: string;
  patientId: string;
  patientName: string;
  diabetesType: DiabetesType;
  patternLabel: string;
  channel: MessageChannel;
  messageText: string;
  recommendation: string;
  approvedAt: string;
}
