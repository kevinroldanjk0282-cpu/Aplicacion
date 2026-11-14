import { useState } from 'react';
import { INITIAL_PATIENT_CASES } from './data/samplePatients';
import type {
  ClinicalAIResponse,
  MessageChannel,
  MessageHistoryItem,
  PatientCase,
  TonePreference,
} from './types/clinical';
import {
  calculateClinicalMetrics,
  formatClinicalSummaryForPrompt,
} from './utils/glucoseAnalysis';
import { TopBar, type ActiveTab } from './components/TopBar';
import { PatientQueueSidebar } from './components/PatientQueueSidebar';
import { ClinicalMetricsStrip } from './components/ClinicalMetricsStrip';
import { GlucoseTrendChart } from './components/GlucoseTrendChart';
import { MessageComposerPanel } from './components/MessageComposerPanel';
import { CustomCaseForm } from './components/CustomCaseForm';
import { HistoryView } from './components/HistoryView';

export default function App() {
  const [patients, setPatients] = useState<PatientCase[]>(INITIAL_PATIENT_CASES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_PATIENT_CASES[0].id);
  const [activeTab, setActiveTab] = useState<ActiveTab>('monitor');
  const [statusFilter, setStatusFilter] = useState<'pendiente' | 'aprobado'>('pendiente');
  const [searchQuery, setSearchQuery] = useState('');

  const [channel, setChannel] = useState<MessageChannel>(
    INITIAL_PATIENT_CASES[0].preferredChannel
  );
  const [tone, setTone] = useState<TonePreference>('calido');
  const [draftsByPatient, setDraftsByPatient] = useState<Record<string, string>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [errorByPatient, setErrorByPatient] = useState<Record<string, string | null>>({});
  const [history, setHistory] = useState<MessageHistoryItem[]>([]);

  const activePatient =
    patients.find((p) => p.id === selectedId) ?? patients[0] ?? null;

  const activeMetrics = activePatient
    ? calculateClinicalMetrics(activePatient.readings)
    : null;

  const pendingCount = patients.filter((p) => p.status === 'pendiente').length;

  const handleSelectPatient = (id: string) => {
    setSelectedId(id);
    const next = patients.find((p) => p.id === id);
    if (next) {
      setChannel(next.preferredChannel);
    }
    setActiveTab('monitor');
  };

  const runAnalysisForPatient = async (
    targetPatient: PatientCase,
    targetChannel: MessageChannel = channel,
    targetTone: TonePreference = tone
  ) => {
    const metrics = calculateClinicalMetrics(targetPatient.readings);
    const clinicalSummary = formatClinicalSummaryForPrompt(targetPatient, metrics);

    setAnalyzingId(targetPatient.id);
    setErrorByPatient((prev) => ({ ...prev, [targetPatient.id]: null }));

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: targetPatient.patientName,
          clinicalSummary,
          channel: targetChannel,
          tone: targetTone,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload?.error || `Error del servidor (${response.status}). Intenta nuevamente.`
        );
      }

      const aiResult = payload as ClinicalAIResponse;

      setPatients((prev) =>
        prev.map((p) =>
          p.id === targetPatient.id ? { ...p, generatedAnalysis: aiResult } : p
        )
      );
      setDraftsByPatient((prev) => ({
        ...prev,
        [targetPatient.id]: aiResult.mensajePaciente,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No pudimos conectar con el motor de análisis clínico.';
      setErrorByPatient((prev) => ({ ...prev, [targetPatient.id]: message }));
    } finally {
      setAnalyzingId((current) => (current === targetPatient.id ? null : current));
    }
  };

  const handlePrimaryAnalyze = () => {
    if (!activePatient) return;
    if (activeTab !== 'monitor') {
      setActiveTab('monitor');
    }
    void runAnalysisForPatient(activePatient, channel, tone);
  };

  const handleApproveMessage = () => {
    if (!activePatient || !activePatient.generatedAnalysis) return;
    const finalMessage = (
      draftsByPatient[activePatient.id] ??
      activePatient.generatedAnalysis.mensajePaciente
    ).trim();
    if (!finalMessage) return;

    const nowLabel = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setPatients((prev) =>
      prev.map((p) =>
        p.id === activePatient.id
          ? {
              ...p,
              status: 'aprobado',
              approvedMessage: finalMessage,
              approvedAt: nowLabel,
            }
          : p
      )
    );

    const newItem: MessageHistoryItem = {
      id: `hist-${Date.now()}`,
      patientId: activePatient.id,
      patientName: activePatient.patientName,
      diabetesType: activePatient.diabetesType,
      patternLabel: activePatient.generatedAnalysis.patronObservado,
      channel,
      messageText: finalMessage,
      recommendation: activePatient.generatedAnalysis.recomendacionPractica,
      approvedAt: nowLabel,
    };

    setHistory((prev) => [newItem, ...prev]);
  };

  const handleCreateAndAnalyze = (newCase: PatientCase) => {
    setPatients((prev) => [newCase, ...prev]);
    setSelectedId(newCase.id);
    setStatusFilter('pendiente');
    setChannel(newCase.preferredChannel);
    setActiveTab('monitor');
    void runAnalysisForPatient(newCase, newCase.preferredChannel, tone);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onPrimaryAnalyze={handlePrimaryAnalyze}
        isAnalyzing={Boolean(analyzingId)}
        hasActivePatient={Boolean(activePatient)}
        pendingCount={pendingCount}
        historyCount={history.length}
      />

      {activeTab === 'nuevo' && (
        <main>
          <CustomCaseForm
            onCreateAndAnalyze={handleCreateAndAnalyze}
            onCancel={() => setActiveTab('monitor')}
          />
        </main>
      )}

      {activeTab === 'historial' && (
        <main>
          <HistoryView
            items={history}
            onGoToMonitor={() => setActiveTab('monitor')}
          />
        </main>
      )}

      {activeTab === 'monitor' && (
        <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
          <PatientQueueSidebar
            patients={patients}
            selectedId={activePatient?.id ?? ''}
            onSelectPatient={handleSelectPatient}
            statusFilter={statusFilter}
            onChangeFilter={setStatusFilter}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            onOpenCustomForm={() => setActiveTab('nuevo')}
          />

          <main className="min-w-0 flex-1 p-4 sm:p-6">
            {activePatient && activeMetrics ? (
              <div className="space-y-4">
                {/* Patient Clinical Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{activePatient.diabetesType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{activePatient.age} años</span>
                      <span aria-hidden="true">·</span>
                      <span>Alerta detectada: {activePatient.alertTimestamp}</span>
                    </div>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {activePatient.patientName}
                    </h1>
                    <p className="mt-1 text-sm text-slate-700">
                      {activePatient.alertTitle}
                    </p>
                  </div>

                  <div className="max-w-md rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">
                    <div className="font-medium text-slate-900">
                      {activePatient.treatmentSummary}
                    </div>
                    <div className="mt-1">{activePatient.clinicalContext}</div>
                  </div>
                </div>

                {/* 4-column tabular KPI strip */}
                <ClinicalMetricsStrip metrics={activeMetrics} />

                {/* Interactive 24h SVG glucose curve */}
                <GlucoseTrendChart
                  readings={activePatient.readings}
                  detectedPatternLabel={activeMetrics.detectedPatternLabel}
                  detectedWindow={activeMetrics.detectedWindow}
                />

                {/* Clinical AI synthesis & empathetic message composer */}
                <MessageComposerPanel
                  patient={activePatient}
                  channel={channel}
                  tone={tone}
                  draftMessage={
                    draftsByPatient[activePatient.id] ??
                    activePatient.generatedAnalysis?.mensajePaciente ??
                    ''
                  }
                  isAnalyzing={analyzingId === activePatient.id}
                  error={errorByPatient[activePatient.id] ?? null}
                  onChangeChannel={setChannel}
                  onChangeTone={setTone}
                  onChangeDraft={(text) =>
                    setDraftsByPatient((prev) => ({
                      ...prev,
                      [activePatient.id]: text,
                    }))
                  }
                  onAnalyze={() =>
                    void runAnalysisForPatient(activePatient, channel, tone)
                  }
                  onApprove={handleApproveMessage}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Selecciona un paciente de la cola clínica para comenzar.
                </p>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
