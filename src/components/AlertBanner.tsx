import React, { useState } from 'react';
import { EarlyWarningAlert, ZoneWithTelemetry } from '../types';
import { ShieldAlert, AlertTriangle, ChevronRight, X, Volume2, VolumeX, Radio } from 'lucide-react';

interface AlertBannerProps {
  alerts: EarlyWarningAlert[];
  onSelectZoneById: (zoneId: string) => void;
  onOpenSmsSimulator: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onSelectZoneById,
  onOpenSmsSimulator,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (alerts.length === 0 || isDismissed) return null;

  const currentAlert = alerts[Math.min(currentIndex, alerts.length - 1)];
  const isSevere = currentAlert.level === 'Severe';

  const triggerAudioBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSevere ? 880 : 587, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Ignore if audio blocked by browser policy
    }
  };

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (next) triggerAudioBeep();
  };

  return (
    <div
      id="early-warning-alert-banner"
      className={`border-b backdrop-blur-md transition-colors duration-200 ${
        isSevere
          ? 'bg-stone-950/92 text-white border-orange-500/50 shadow-md shadow-orange-950/10'
          : 'bg-amber-50/90 text-amber-950 border-amber-200/80 shadow-2xs'
      } px-4 py-2 relative z-20`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start md:items-center gap-2.5 flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/20 shadow-xs ${
              isSevere
                ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white animate-pulse'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 drop-shadow-2xs" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] shadow-2xs border ${
                  isSevere
                    ? 'bg-red-600 text-white border-red-500/50'
                    : 'bg-orange-600 text-white border-orange-500/50'
                }`}
              >
                {currentAlert.level} Warning
              </span>
              <span className={`font-bold truncate ${isSevere ? 'text-white' : 'text-stone-900'}`}>
                {currentAlert.zoneName} ({currentAlert.region})
              </span>
              <span className="text-[11px] opacity-75 hidden sm:inline font-mono">
                &bull; Reported {currentAlert.timestamp}
              </span>
            </div>
            <p className={`text-xs font-medium truncate mt-0.5 ${isSevere ? 'text-stone-300' : 'text-stone-700'}`}>
              {currentAlert.headline} &mdash;{' '}
              <span className="opacity-90 font-normal">{currentAlert.recommendation}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {alerts.length > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 bg-black/10 backdrop-blur-xs rounded-lg border border-white/10 shadow-2xs">
              <span>
                {currentIndex + 1} of {alerts.length}
              </span>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % alerts.length)}
                className="underline hover:opacity-100 ml-1 font-sans font-semibold cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          )}

          <button
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute Alert Chime' : 'Enable Warning Beep'}
            className="p-1.5 rounded-lg hover:bg-black/10 transition cursor-pointer"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4 opacity-60" />}
          </button>

          <button
            onClick={onOpenSmsSimulator}
            className="tactile-btn flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white text-stone-900 rounded-lg font-semibold text-[11px] transition shadow-2xs border border-stone-200/80 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">Simulate SMS</span>
          </button>

          <button
            id="btn-inspect-alert-zone"
            onClick={() => onSelectZoneById(currentAlert.zoneId)}
            className="tactile-btn flex items-center gap-1 px-3 py-1.5 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold text-[11px] transition shadow-xs border border-orange-400/40 cursor-pointer"
          >
            <span>Inspect Zone</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss Alert Banner"
            className="p-1 rounded-lg hover:bg-black/10 transition opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
