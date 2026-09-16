import React from 'react';
import type { SimulationScenario } from '../services/openMeteo';

interface TopNavProps {
  currentView?: 'LANDING' | 'DASHBOARD';
  onViewChange?: (view: 'LANDING' | 'DASHBOARD') => void;
  alertCount: number;
  onOpenAlerts: () => void;
  onCheckMyArea: () => void;
  isLocating: boolean;
  onOpenHowItWorks: () => void;
  onOpenSmsSimulator: () => void;
  simulationScenario: SimulationScenario;
  onScenarioChange: (scenario: SimulationScenario) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  isLiveApi: boolean;
  lastSyncTime?: string;
  countdownSeconds?: number;
  isAutoRefreshActive?: boolean;
  onToggleAutoRefresh?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onViewChange,
}) => {
  return (
    <header className="glass-dock sticky top-0 z-30 px-4 py-2 border-b">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* App Brand & Identity */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewChange && onViewChange('LANDING')}
                className="text-base font-bold tracking-tight text-stone-900 leading-none hover:text-orange-700 transition cursor-pointer text-left"
              >
                JALRAKSHAK
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

