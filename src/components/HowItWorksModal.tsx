import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, Mountain, Waves, ExternalLink, HelpCircle } from 'lucide-react';
import { RISK_PALETTE, getRiskLevel } from '../utils/riskEngine';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  // Interactive sandbox state for judges
  const [testRainRate, setTestRainRate] = useState<number>(12); // mm/h
  const [test24hRain, setTest24hRain] = useState<number>(65); // mm
  const [testSlope, setTestSlope] = useState<number>(32); // degrees
  const [testRiverKm, setTestRiverKm] = useState<number>(0.3); // km
  const [testSaturation, setTestSaturation] = useState<number>(75); // %

  if (!isOpen) return null;

  // Real-time calculation inside sandbox
  const slopeMultiplier = Number((Math.pow(Math.max(5, testSlope) / 26, 1.65)).toFixed(2));
  const satFactor = Number((1.0 + (testSaturation / 100) * 0.55).toFixed(2));
  const intensityLsi = testRainRate * 3.2;
  const ante72h = test24hRain * 1.5 * 0.42; // estimated 72h
  const calculatedLsi = Math.min(
    100,
    Math.max(0, Math.round((intensityLsi + ante72h) * slopeMultiplier * satFactor * 0.45))
  );
  const lsiLevel = getRiskLevel(calculatedLsi);

  const floodAccum = test24hRain * 0.68;
  const floodInt = testRainRate * 3.6;
  const riverFactor = Number(Math.max(0.6, 2.4 - testRiverKm * 0.55).toFixed(2));
  const elevationFactor = 1.45; // baseline mid valley
  const calculatedFfi = Math.min(
    100,
    Math.max(0, Math.round((floodAccum + floodInt) * riverFactor * elevationFactor * 0.4))
  );
  const ffiLevel = getRiskLevel(calculatedFfi);

  const compositeScore = Math.min(
    100,
    Math.round(Math.max(calculatedLsi, calculatedFfi) * 0.75 + Math.min(calculatedLsi, calculatedFfi) * 0.25)
  );
  const compLevel = getRiskLevel(compositeScore);

  return (
    <div
      id="how-it-works-modal"
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="glass-modal border border-stone-200/80 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-stone-900">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 flex items-center justify-between bg-white/70">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Risk Engine & Formula Transparency
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Open-Meteo precipitation ingestion &amp; geophysical heuristic formulas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="tactile-btn p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-stone-800">
          {/* Architecture Overview */}
          <div className="p-4 glass-card rounded-xl border border-stone-200/80 space-y-2 shadow-2xs">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              Data Ingestion &amp; Hydrological Model
            </h4>
            <p className="leading-relaxed text-stone-700">
              JALRAKSHAK computes multi-hazard risk indices by coupling <strong>real-time atmospheric feeds from Open-Meteo</strong> (hourly precipitation rates, 24h &amp; 72h antecedent rainfall, convective rain showers) with <strong>geophysical catchment attributes</strong> (slope shear angle, valley drainage elevation, distance to primary riverbed, and soil saturation index).
            </p>
          </div>

          {/* Mathematical Formulations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Landslide formula */}
            <div className="p-4 rounded-xl border border-stone-200/80 glass-card space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Mountain className="w-4 h-4 text-orange-600" />
                <span>1. Landslide Susceptibility Index (LSI)</span>
              </div>
              <div className="p-3 bg-stone-100/80 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-900 shadow-inner">
                LSI = [(3.2 &times; I<sub>rate</sub> + 0.42 &times; A<sub>72h</sub>) &times; M<sub>slope</sub> &times; M<sub>sat</sub>] &times; 0.45
              </div>
              <ul className="space-y-1.5 text-[11px] text-stone-600 list-disc list-inside">
                <li>
                  <strong className="text-stone-900">M<sub>slope</sub></strong> = (Slope / 26°)<sup>1.65</sup> — Exponential shear stress acceleration on slopes &gt; 25°.
                </li>
                <li>
                  <strong className="text-stone-900">M<sub>sat</sub></strong> = 1 + (SoilSat / 100) &times; 0.55 — Pore-water pressure multiplier.
                </li>
                <li>
                  <strong className="text-stone-900">A<sub>72h</sub></strong> = 72-hour antecedent rainfall total (liquefaction baseline).
                </li>
              </ul>
            </div>

            {/* Flash flood formula */}
            <div className="p-4 rounded-xl border border-stone-200/80 glass-card space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Waves className="w-4 h-4 text-orange-600" />
                <span>2. Flash Flood Index (FFI)</span>
              </div>
              <div className="p-3 bg-stone-100/80 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-900 shadow-inner">
                FFI = [(0.68 &times; A<sub>24h</sub> + 3.6 &times; I<sub>rate</sub>) &times; R<sub>river</sub> &times; E<sub>elevation</sub>] &times; 0.40
              </div>
              <ul className="space-y-1.5 text-[11px] text-stone-600 list-disc list-inside">
                <li>
                  <strong className="text-stone-900">R<sub>river</sub></strong> = max(0.6, 2.4 &minus; Dist<sub>km</sub> &times; 0.55) — Alluvial bank overtop buffer.
                </li>
                <li>
                  <strong className="text-stone-900">E<sub>elevation</sub></strong> = Valley convergence factor (lower basin collects water).
                </li>
                <li>
                  <strong className="text-stone-900">A<sub>24h</sub></strong> = 24-hour total precipitation runoff volume.
                </li>
              </ul>
            </div>
          </div>

          {/* Severity Threshold Classification */}
          <div className="p-4 rounded-xl border border-stone-200/80 glass-card space-y-3 shadow-2xs">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              Warm Tint Severity Thresholds (Anti-Traffic-Light Protocol)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/80 shadow-2xs">
                <span className="font-bold text-amber-900 block">Low (0 - 29)</span>
                <span className="text-[10px] text-amber-700 font-medium">Pale Amber Tint</span>
              </div>
              <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-100/80 shadow-2xs">
                <span className="font-bold text-amber-950 block">Moderate (30 - 59)</span>
                <span className="text-[10px] text-amber-800 font-medium">Warm Amber-Orange</span>
              </div>
              <div className="p-2.5 rounded-xl border border-orange-500 bg-orange-600 text-white shadow-2xs">
                <span className="font-bold block">High (60 - 79)</span>
                <span className="text-[10px] text-orange-100 font-medium">Alert Vibrant Orange</span>
              </div>
              <div className="p-2.5 rounded-xl border border-orange-700 bg-stone-900 text-orange-400 shadow-2xs">
                <span className="font-bold block">Severe (80 - 100)</span>
                <span className="text-[10px] text-orange-300 font-medium">Deep Red-Orange</span>
              </div>
            </div>
          </div>

          {/* Interactive Live Formula Calculator for Hackathon Judges */}
          <div className="p-4 sm:p-5 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-orange-600" />
                Interactive Sandbox: Test Formula Dynamics
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/90 border border-orange-200 text-orange-800 shadow-2xs">
                Live Evaluator
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="flex justify-between text-stone-700 font-semibold mb-1">
                  <span>Current Rainfall Intensity (I<sub>rate</sub>)</span>
                  <span className="font-bold font-mono text-stone-900">{testRainRate} mm/h</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={testRainRate}
                  onChange={(e) => setTestRainRate(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-stone-700 font-semibold mb-1">
                  <span>24-Hour Rainfall (A<sub>24h</sub>)</span>
                  <span className="font-bold font-mono text-stone-900">{test24hRain} mm</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={test24hRain}
                  onChange={(e) => setTest24hRain(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-stone-700 font-semibold mb-1">
                  <span>Terrain Slope Steepness</span>
                  <span className="font-bold font-mono text-stone-900">{testSlope}°</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={testSlope}
                  onChange={(e) => setTestSlope(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="flex justify-between text-stone-700 font-semibold mb-1">
                  <span>Distance to River Corridor</span>
                  <span className="font-bold font-mono text-stone-900">{testRiverKm} km</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.1"
                  value={testRiverKm}
                  onChange={(e) => setTestRiverKm(Number(e.target.value))}
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Calculated Output Score Card */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white/90 rounded-xl border border-stone-200/80 text-center shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Landslide (LSI)</span>
                <span className="text-base font-bold font-mono text-stone-900">{calculatedLsi}/100</span>
                <span className="text-[10px] block font-bold text-orange-600">{lsiLevel}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Flash Flood (FFI)</span>
                <span className="text-base font-bold font-mono text-stone-900">{calculatedFfi}/100</span>
                <span className="text-[10px] block font-bold text-orange-600">{ffiLevel}</span>
              </div>
              <div className="border-l border-stone-200/80 pl-2">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Composite Rating</span>
                <span className="text-base font-bold font-mono text-orange-600">{compositeScore}/100</span>
                <span className="text-[10px] block font-bold text-stone-900 uppercase">{compLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200/80 flex items-center justify-between bg-stone-50/70">
          <span className="text-[11px] text-stone-500 font-medium">
            Compliant with WMO (World Meteorological Organization) early warning frameworks.
          </span>
          <button
            onClick={onClose}
            className="tactile-btn px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
