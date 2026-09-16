import React, { useState } from 'react';
import { X, Smartphone, Send, ShieldAlert, CheckCircle, Radio, Bell } from 'lucide-react';
import { ZoneWithTelemetry } from '../types';

interface SmsPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: ZoneWithTelemetry[];
  selectedZone: ZoneWithTelemetry | null;
}

export const SmsPushModal: React.FC<SmsPushModalProps> = ({
  isOpen,
  onClose,
  zones,
  selectedZone,
}) => {
  const [targetZoneId, setTargetZoneId] = useState<string>(
    selectedZone?.id || zones[0]?.id || ''
  );
  const [phoneNumber, setPhoneNumber] = useState('+91 94350 78210');
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchHistory, setDispatchHistory] = useState<
    { id: string; time: string; zone: string; text: string }[]
  >([
    {
      id: 'sms-init-1',
      time: '12 mins ago',
      zone: 'Haflong - Jatinga Valley Corridor',
      text: 'EMERGENCY: Torrential cloudburst >38mm/h. Evacuate Jatinga valley corridor to Haflong District Sports Stadium.',
    },
  ]);

  if (!isOpen) return null;

  const activeZone = zones.find((z) => z.id === targetZoneId) || zones[0];
  const isSevere = activeZone?.assessment.overallLevel === 'Severe';
  const isHigh = activeZone?.assessment.overallLevel === 'High';

  const generateSmsBody = (zone: ZoneWithTelemetry) => {
    const levelTag =
      zone.assessment.overallLevel === 'Severe'
        ? 'CRITICAL ALERT [CIVIL DEFENSE]'
        : 'EARLY WARNING [EMERGENCY SERVICES]';
    return `${levelTag}: ${zone.name.toUpperCase()} has reached ${zone.assessment.overallLevel.toUpperCase()} RISK (${zone.assessment.compositeScore}/100). Live rainfall: ${zone.weather.currentRateMmPerHour.toFixed(1)}mm/h. ${zone.assessment.recommendedAction} Avoid riverbanks & steep slopes.`;
  };

  const handleSendTestSms = () => {
    if (!activeZone) return;
    const newMsg = {
      id: `sms-${Date.now()}`,
      time: 'Just now',
      zone: activeZone.name,
      text: generateSmsBody(activeZone),
    };
    setDispatchHistory([newMsg, ...dispatchHistory]);
    setIsDispatched(true);
    setTimeout(() => setIsDispatched(false), 4000);
  };

  return (
    <div
      id="sms-push-modal"
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="glass-modal border border-stone-200/80 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-stone-900">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-200/80 flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Cell Broadcast &amp; SMS Early Warning Simulator
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Citizen warning packet delivery via simulated cellular emergency gateways.
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Dispatch Configuration */}
          <div className="p-4 border border-stone-200/80 rounded-xl glass-card space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-stone-700 font-bold mb-1">
                  Targeted Watershed / Basin:
                </label>
                <select
                  value={targetZoneId}
                  onChange={(e) => setTargetZoneId(e.target.value)}
                  className="w-full bg-white/90 border border-stone-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-orange-500/40 focus:outline-none shadow-2xs"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.assessment.overallLevel} Risk - {z.assessment.compositeScore}/100)
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-stone-700 font-bold mb-1">
                  Recipient Test Device:
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white/90 border border-stone-200/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-orange-500/40 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <button
              onClick={handleSendTestSms}
              className="tactile-btn w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Emergency Warning via Simulated Cellular Cell</span>
            </button>

            {isDispatched && (
              <div className="p-3 bg-amber-50/80 border border-amber-300/70 text-amber-950 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
                <CheckCircle className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="font-medium">Dispatched! Simulated packet transmitted to local cell towers and registered handsets.</span>
              </div>
            )}
          </div>

          {/* Simulated Mobile Handset View */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
              Handset Emergency Notification Preview
            </span>

            <div className="max-w-md mx-auto bg-stone-900/95 p-4 rounded-3xl shadow-2xl border-4 border-stone-800 text-white backdrop-blur-md">
              {/* Phone Status Bar */}
              <div className="flex justify-between items-center text-[10px] text-stone-400 mb-3 px-1">
                <span>9:41 AM</span>
                <span className="flex items-center gap-1 font-mono">
                  <span>5G</span>
                  <span>100%</span>
                </span>
              </div>

              {/* Emergency Banner Alert Card */}
              {activeZone && (
                <div className="bg-stone-800/90 border border-orange-500/80 rounded-2xl p-3.5 shadow-lg space-y-2 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-orange-400">
                      <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                      EMERGENCY WIRELESS ALERT
                    </span>
                    <span className="text-[10px] text-stone-400">Now</span>
                  </div>

                  <p className="text-[11px] text-stone-100 font-sans leading-relaxed">
                    {generateSmsBody(activeZone)}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-700 text-[10px] text-stone-400 font-mono">
                    <span>CELL_BROADCAST_ID #389</span>
                    <span className="text-orange-400 font-bold">ACK REQUIRED</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historical Transmissions Feed */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-2">
              Recent Warning Transmissions (Broadcast Log)
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {dispatchHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-stone-200/80 glass-card text-[11px] flex items-start justify-between gap-2 shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                      <span>{item.zone}</span>
                      <span className="text-[10px] text-stone-500 font-normal">({item.time})</span>
                    </div>
                    <p className="text-stone-700 mt-0.5 leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200/80 bg-stone-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="tactile-btn px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
