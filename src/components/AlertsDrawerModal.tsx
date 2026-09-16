import React from 'react';
import { X, ShieldAlert, CheckCircle, ChevronRight, Mountain, Waves, CloudRain } from 'lucide-react';
import { EarlyWarningAlert, ZoneWithTelemetry } from '../types';
import { RISK_PALETTE } from '../utils/riskEngine';

interface AlertsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: EarlyWarningAlert[];
  onSelectZoneById: (zoneId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const AlertsDrawerModal: React.FC<AlertsDrawerModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectZoneById,
  onAcknowledgeAlert,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="alerts-drawer-modal"
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="glass-modal border border-stone-200/80 rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden text-stone-900">
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Active Early Warning Advisories ({alerts.length})
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Sectors currently exceeding hydrological safety thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="tactile-btn p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {alerts.length === 0 ? (
            <div className="text-center py-10 text-stone-600 glass-card rounded-xl border border-stone-200/80 p-5 shadow-2xs">
              <CheckCircle className="w-9 h-9 text-amber-500 mx-auto mb-2 opacity-90" />
              <p className="font-bold text-stone-800 text-sm">No High or Severe Threshold Violations</p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
                All monitoring basins are currently operating within baseline or moderate drainage limits.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isSevere = alert.level === 'Severe';
              const palette = RISK_PALETTE[alert.level];

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition shadow-2xs ${
                    isSevere
                      ? 'bg-orange-50/80 border-orange-500/70 ring-1 ring-orange-500/30'
                      : 'glass-card border-stone-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`}
                      >
                        {alert.level} Hazard
                      </span>
                      <span className="font-bold text-stone-900 text-xs">{alert.zoneName}</span>
                      <span className="text-[10px] text-stone-500">({alert.region})</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">
                      {alert.timestamp}
                    </span>
                  </div>

                  <p className="font-semibold text-stone-900 text-xs mb-1.5 leading-snug">
                    {alert.headline}
                  </p>

                  <p className="text-[11px] text-stone-700 mb-3 bg-white/70 p-2.5 rounded-lg border border-stone-200/70 leading-relaxed shadow-2xs">
                    <strong className="text-stone-900">Protocol:</strong> {alert.recommendation}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="text-[11px] text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
                    >
                      Acknowledge
                    </button>

                    <button
                      onClick={() => {
                        onSelectZoneById(alert.zoneId);
                        onClose();
                      }}
                      className="tactile-btn flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs cursor-pointer"
                    >
                      <span>Focus on Map</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-stone-200/80 bg-stone-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="tactile-btn px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Alerts
          </button>
        </div>
      </div>
    </div>
  );
};
