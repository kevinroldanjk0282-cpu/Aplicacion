import { Sparkles } from 'lucide-react';

export type ActiveTab = 'monitor' | 'nuevo' | 'historial';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onPrimaryAnalyze: () => void;
  isAnalyzing: boolean;
  hasActivePatient: boolean;
  pendingCount: number;
  historyCount: number;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onPrimaryAnalyze,
  isAnalyzing,
  hasActivePatient,
  pendingCount,
  historyCount,
}: TopBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 md:gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('monitor')}
          className="text-left text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded"
        >
          GlucoSenda
        </button>

        {/* Zone 2: Single-line navigation links (desktop) */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onSelectTab('monitor')}
            aria-current={activeTab === 'monitor' ? 'page' : undefined}
            className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              activeTab === 'monitor'
                ? 'text-teal-800 border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            Monitor clínico ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('nuevo')}
            aria-current={activeTab === 'nuevo' ? 'page' : undefined}
            className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              activeTab === 'nuevo'
                ? 'text-teal-800 border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            Ingreso manual
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('historial')}
            aria-current={activeTab === 'historial' ? 'page' : undefined}
            className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              activeTab === 'historial'
                ? 'text-teal-800 border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            Historial ({historyCount})
          </button>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onPrimaryAnalyze}
            disabled={isAnalyzing || !hasActivePatient}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:px-4"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{isAnalyzing ? 'Analizando...' : 'Analizar con IA'}</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <nav
        aria-label="Navegación móvil"
        className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/80 md:hidden"
      >
        <button
          type="button"
          onClick={() => onSelectTab('monitor')}
          aria-current={activeTab === 'monitor' ? 'page' : undefined}
          className={`py-2.5 text-center text-xs font-medium whitespace-nowrap ${
            activeTab === 'monitor'
              ? 'border-b-2 border-teal-700 bg-white text-teal-800'
              : 'text-slate-600'
          }`}
        >
          Monitor ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('nuevo')}
          aria-current={activeTab === 'nuevo' ? 'page' : undefined}
          className={`py-2.5 text-center text-xs font-medium whitespace-nowrap ${
            activeTab === 'nuevo'
              ? 'border-b-2 border-teal-700 bg-white text-teal-800'
              : 'text-slate-600'
          }`}
        >
          Ingreso manual
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('historial')}
          aria-current={activeTab === 'historial' ? 'page' : undefined}
          className={`py-2.5 text-center text-xs font-medium whitespace-nowrap ${
            activeTab === 'historial'
              ? 'border-b-2 border-teal-700 bg-white text-teal-800'
              : 'text-slate-600'
          }`}
        >
          Historial ({historyCount})
        </button>
      </nav>
    </header>
  );
}
