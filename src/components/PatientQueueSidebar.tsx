import { AlertCircle, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import type { AlertSeverity, PatientCase } from '../types/clinical';

interface PatientQueueSidebarProps {
  patients: PatientCase[];
  selectedId: string;
  onSelectPatient: (id: string) => void;
  statusFilter: 'pendiente' | 'aprobado';
  onChangeFilter: (filter: 'pendiente' | 'aprobado') => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  onOpenCustomForm: () => void;
}

function SeverityIndicator({
  severity,
  status,
}: {
  severity: AlertSeverity;
  status: PatientCase['status'];
}) {
  if (status === 'aprobado') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Mensaje aprobado</span>
      </span>
    );
  }

  if (severity === 'critica') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Prioridad alta</span>
      </span>
    );
  }

  if (severity === 'moderada') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Atención moderada</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
      <span>Seguimiento</span>
    </span>
  );
}

export function PatientQueueSidebar({
  patients,
  selectedId,
  onSelectPatient,
  statusFilter,
  onChangeFilter,
  searchQuery,
  onChangeSearch,
  onOpenCustomForm,
}: PatientQueueSidebarProps) {
  const pendingCount = patients.filter((p) => p.status === 'pendiente').length;
  const approvedCount = patients.filter((p) => p.status === 'aprobado').length;

  const filtered = patients.filter((p) => {
    const matchesStatus = p.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.patientName.toLowerCase().includes(q) ||
      p.alertTitle.toLowerCase().includes(q) ||
      p.diabetesType.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <aside
      aria-label="Cola de alertas clínicas"
      className="flex w-full flex-col border-b border-slate-200 bg-white lg:w-[310px] lg:shrink-0 lg:border-b-0 lg:border-r"
    >
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Alertas de pacientes</h2>
          <button
            type="button"
            onClick={onOpenCustomForm}
            className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline whitespace-nowrap shrink-0"
          >
            + Nuevo caso
          </button>
        </div>

        {/* Segmented filter tabs */}
        <div
          role="tablist"
          aria-label="Filtrar pacientes por estado"
          className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'pendiente'}
            onClick={() => onChangeFilter('pendiente')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'pendiente'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'aprobado'}
            onClick={() => onChangeFilter('aprobado')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'aprobado'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aprobados ({approvedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative mt-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor="patient-search" className="sr-only">
            Buscar paciente o anomalía
          </label>
          <input
            id="patient-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Buscar paciente o patrón..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[340px] lg:max-h-[calc(100vh-13rem)]">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              {statusFilter === 'aprobado'
                ? 'Aún no hay mensajes aprobados'
                : 'No se encontraron alertas'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {statusFilter === 'aprobado'
                ? 'Cuando apruebes un mensaje empático en la vista principal, aparecerá registrado aquí.'
                : 'Prueba limpiando el filtro o agrega un registro manual.'}
            </p>
            {statusFilter === 'aprobado' && pendingCount > 0 && (
              <button
                type="button"
                onClick={() => onChangeFilter('pendiente')}
                className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Ver pendientes ({pendingCount})
              </button>
            )}
          </div>
        ) : (
          filtered.map((patient) => {
            const isSelected = patient.id === selectedId;
            return (
              <button
                key={patient.id}
                type="button"
                onClick={() => onSelectPatient(patient.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`block w-full px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 ${
                  isSelected ? 'bg-teal-50/70' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? 'text-teal-950' : 'text-slate-900'
                    }`}
                  >
                    {patient.patientName}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                    {patient.alertTimestamp}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <span>{patient.diabetesType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{patient.age} años</span>
                </div>

                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-700">
                  {patient.alertTitle}
                </p>

                <div className="mt-2">
                  <SeverityIndicator severity={patient.severity} status={patient.status} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
