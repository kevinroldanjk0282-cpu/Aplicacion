import { useState, type FormEvent } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import type { DiabetesType, MessageChannel, PatientCase } from '../types/clinical';
import {
  calculateClinicalMetrics,
  parseGlucoseInput,
  validatePatientCaseInput,
} from '../utils/glucoseAnalysis';

interface CustomCaseFormProps {
  onCreateAndAnalyze: (newCase: PatientCase) => void;
  onCancel: () => void;
}

const PRESET_NOCTURNAL_TEXT = `19:00, 134, Pre-cena
21:00, 158, Cena ligera
23:00, 204, Al acostarse
01:00, 242, Pico nocturno
03:00, 219, Madrugada
06:00, 162, Despertar
08:00, 136, Ayuno`;

const PRESET_HYPO_JSON = `[
  { "time": "20:00", "value": 128, "context": "Post-caminata" },
  { "time": "22:30", "value": 106, "context": "Antes de dormir" },
  { "time": "01:30", "value": 86 },
  { "time": "04:00", "value": 64, "context": "Descenso nocturno" },
  { "time": "06:00", "value": 58, "context": "Alerta temprana" },
  { "time": "08:00", "value": 96, "context": "Desayuno" }
]`;

export function CustomCaseForm({ onCreateAndAnalyze, onCancel }: CustomCaseFormProps) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('48');
  const [diabetesType, setDiabetesType] = useState<DiabetesType>('Diabetes tipo 2');
  const [alertTitle, setAlertTitle] = useState('');
  const [treatmentSummary, setTreatmentSummary] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<MessageChannel>('whatsapp');
  const [readingsRaw, setReadingsRaw] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const loadPresetNocturnal = () => {
    setPatientName('Elena Morales');
    setAge('57');
    setDiabetesType('Diabetes tipo 2');
    setAlertTitle('Picos altos nocturnos entre las 23:00 y las 03:00');
    setTreatmentSummary('Metformina 1000 mg · Sensor CGM');
    setClinicalContext('Cenas alrededor de las 21:30 con pan o pasta y descanso inmediato tras cenar.');
    setPreferredChannel('whatsapp');
    setReadingsRaw(PRESET_NOCTURNAL_TEXT);
    setErrors([]);
  };

  const loadPresetHypoJson = () => {
    setPatientName('Javier Ortega');
    setAge('36');
    setDiabetesType('Diabetes tipo 1');
    setAlertTitle('Descenso nocturno con lectura de 58 mg/dL a las 06:00');
    setTreatmentSummary('Bomba de insulina · Monitoreo continuo');
    setClinicalContext('Caminata prolongada por la tarde sin colación nocturna.');
    setPreferredChannel('app');
    setReadingsRaw(PRESET_HYPO_JSON);
    setErrors([]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseGlucoseInput(readingsRaw);
    const parsedAge = Number(age);

    const validationErrors = validatePatientCaseInput({
      patientName,
      age: parsedAge,
      diabetesType,
      alertTitle,
      readings: parsed.readings,
    });

    if (parsed.error && !validationErrors.includes(parsed.error)) {
      validationErrors.push(parsed.error);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const metrics = calculateClinicalMetrics(parsed.readings);

    const newCase: PatientCase = {
      id: `pac-custom-${Date.now()}`,
      patientName: patientName.trim(),
      age: parsedAge,
      diabetesType,
      alertTitle: alertTitle.trim(),
      alertTimestamp: 'Recién ingresado',
      severity: metrics.severity,
      clinicalContext: clinicalContext.trim() || 'Sin notas adicionales del equipo clínico.',
      treatmentSummary: treatmentSummary.trim() || 'Esquema habitual del paciente',
      preferredChannel,
      readings: parsed.readings,
      status: 'pendiente',
    };

    setErrors([]);
    onCreateAndAnalyze(newCase);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Ingresar alerta o registro de glucosa
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Introduce datos agregados manualmente o pega lecturas CGM en formato texto o JSON para
              generar un mensaje personalizado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadPresetNocturnal}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              Ejemplo: Picos nocturnos
            </button>
            <button
              type="button"
              onClick={loadPresetHypoJson}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              Ejemplo JSON: Hipoglucemia
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 text-rose-700" aria-hidden="true" />
              <span>Revisa los datos ingresados</span>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-800">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="custom-name" className="block text-xs font-medium text-slate-700">
                Nombre del paciente
              </label>
              <input
                id="custom-name"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ej. Elena Morales"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-age" className="block text-xs font-medium text-slate-700">
                Edad
              </label>
              <input
                id="custom-age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-diabetes" className="block text-xs font-medium text-slate-700">
                Perfil clínico
              </label>
              <select
                id="custom-diabetes"
                value={diabetesType}
                onChange={(e) => setDiabetesType(e.target.value as DiabetesType)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value="Diabetes tipo 2">Diabetes tipo 2</option>
                <option value="Diabetes tipo 1">Diabetes tipo 1</option>
                <option value="Diabetes gestacional">Diabetes gestacional</option>
                <option value="Prediabetes">Prediabetes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="custom-alert" className="block text-xs font-medium text-slate-700">
                Alerta o anomalía detectada
              </label>
              <input
                id="custom-alert"
                type="text"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                placeholder="Ej. Picos altos nocturnos después de la cena"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-channel" className="block text-xs font-medium text-slate-700">
                Canal preferido
              </label>
              <select
                id="custom-channel"
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value as MessageChannel)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="app">App móvil</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="custom-treatment" className="block text-xs font-medium text-slate-700">
                Tratamiento / dispositivo (opcional)
              </label>
              <input
                id="custom-treatment"
                type="text"
                value={treatmentSummary}
                onChange={(e) => setTreatmentSummary(e.target.value)}
                placeholder="Ej. Metformina 850 mg · Sensor CGM"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="custom-context" className="block text-xs font-medium text-slate-700">
                Hábitos o contexto reciente (opcional)
              </label>
              <input
                id="custom-context"
                type="text"
                value={clinicalContext}
                onChange={(e) => setClinicalContext(e.target.value)}
                placeholder="Ej. Cena tardía, poco movimiento nocturno"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="custom-readings" className="block text-xs font-medium text-slate-700">
              Serie de lecturas (líneas &quot;HH:MM, mg/dL, contexto&quot; o arreglo JSON)
            </label>
            <textarea
              id="custom-readings"
              rows={7}
              value={readingsRaw}
              onChange={(e) => setReadingsRaw(e.target.value)}
              placeholder={'19:00, 134, Pre-cena\n22:00, 198, Post-cena\n01:00, 236, Nocturno'}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Guardar caso y analizar con IA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
