import React from 'react';

interface PolarimeterBenchProps {
  /** Measured rotation angle in degrees (-45 to +45) */
  rotationDeg: number;
  /** Left flask label (e.g. "(+) jobbra forgató oldat") */
  leftFlaskTitle: string;
  leftFlaskValue: string;
  /** Right flask label (e.g. "(-) balra forgató oldat") */
  rightFlaskTitle: string;
  rightFlaskValue: string;
  /** Whether the mixture is currently optically inactive (racemic) */
  isRacemic?: boolean;
  /** Caption under polarimeter */
  statusLabel: string;
}

export const PolarimeterBench: React.FC<PolarimeterBenchProps> = ({
  rotationDeg,
  leftFlaskTitle,
  leftFlaskValue,
  rightFlaskTitle,
  rightFlaskValue,
  isRacemic = false,
  statusLabel,
}) => {
  const clampedAngle = Math.max(-45, Math.min(45, rotationDeg));
  const formattedAngle =
    Math.abs(clampedAngle) < 0.05
      ? '0,0°'
      : `${clampedAngle > 0 ? '+' : '−'}${Math.abs(clampedAngle).toFixed(1).replace('.', ',')}°`;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0A111F] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h4 className="font-display text-sm sm:text-base font-semibold text-white">
            Digitális Polariméter Műszerpult
          </h4>
          <p className="text-xs text-slate-400">
            Monokromatikus fényforrás · Polarizátor · Küvetta · Elemző skála
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400">Elfordulási szög</div>
          <div
            className={`font-mono-tabular text-xl sm:text-2xl font-bold ${
              isRacemic
                ? 'text-emerald-400'
                : clampedAngle > 0
                  ? 'text-cyan-300'
                  : 'text-amber-300'
            }`}
          >
            {formattedAngle}
          </div>
        </div>
      </div>

      {/* Interactive Optical Path SVG */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 760 220"
          className="w-full min-w-[520px] h-auto select-none"
          role="img"
          aria-label="Futurisztikus polariméter optikai útja"
        >
          <defs>
            <linearGradient id="beamCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="sampleLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0891B2" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0E7490" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {/* Optical bench rail */}
          <rect x="24" y="176" width="712" height="10" rx="3" fill="#1E293B" />

          {/* 1. Light Source */}
          <rect x="30" y="70" width="74" height="76" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <circle cx="67" cy="108" r="18" fill="#FEF08A" fillOpacity="0.22" stroke="#FACC15" strokeWidth="2" />
          <circle cx="67" cy="108" r="7" fill="#FEF08A" />
          <text x="67" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
            Fényforrás
          </text>

          {/* Unpolarized beam */}
          <line x1="104" y1="108" x2="178" y2="108" stroke="#FDE047" strokeWidth="3" strokeDasharray="5 4" />

          {/* 2. Fixed Polarizer */}
          <ellipse cx="188" cy="108" rx="10" ry="44" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
          <line x1="188" y1="72" x2="188" y2="144" stroke="#38BDF8" strokeWidth="1.8" />
          <text x="188" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
            Polarizátor (0°)
          </text>

          {/* Linearly polarized beam */}
          <line x1="198" y1="108" x2="275" y2="108" stroke="url(#beamCyan)" strokeWidth="4" />

          {/* 3. Sample Cell / Cuvette */}
          <rect x="275" y="74" width="210" height="68" rx="8" fill="url(#sampleLiquid)" stroke="#22D3EE" strokeWidth="1.8" />
          {/* Optical path beam inside sample */}
          <line x1="275" y1="108" x2="485" y2="108" stroke="#67E8F9" strokeWidth="3.5" strokeOpacity="0.85" />
          <text x="380" y="64" textAnchor="middle" fill="#E2E8F0" fontSize="12" fontWeight="600">
            Mérőküvetta (oldat)
          </text>
          <text x="380" y="164" textAnchor="middle" fill="#94A3B8" fontSize="11">
            {statusLabel}
          </text>

          {/* Rotated beam */}
          <line x1="485" y1="108" x2="572" y2="108" stroke="url(#beamCyan)" strokeWidth="4" />

          {/* 4. Rotating Analyzer Dial */}
          <circle cx="640" cy="108" r="56" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <circle cx="640" cy="108" r="46" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
          {/* Reference 0° vertical line */}
          <line x1="640" y1="54" x2="640" y2="162" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
          {/* Rotated polarization plane vector */}
          <g transform={`translate(640, 108) rotate(${clampedAngle})`}>
            <line
              x1="0"
              y1="-42"
              x2="0"
              y2="42"
              stroke={isRacemic ? '#34D399' : clampedAngle >= 0 ? '#22D3EE' : '#FBBF24'}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <polygon
              points="0,-48 -5,-36 5,-36"
              fill={isRacemic ? '#34D399' : clampedAngle >= 0 ? '#22D3EE' : '#FBBF24'}
            />
          </g>
          <text x="640" y="198" textAnchor="middle" fill="#94A3B8" fontSize="11">
            Analizátor skála
          </text>
        </svg>
      </div>

      {/* Two Enantiomer Solution Reservoirs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-cyan-500/30 bg-[#0D1729] px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-cyan-300 font-medium">{leftFlaskTitle}</div>
            <div className="text-[11px] text-slate-400">Jobbra forgató (+) enantiomer</div>
          </div>
          <div className="font-mono-tabular text-base font-semibold text-white">
            {leftFlaskValue}
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-[#0D1729] px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-amber-300 font-medium">{rightFlaskTitle}</div>
            <div className="text-[11px] text-slate-400">Balra forgató (−) enantiomer</div>
          </div>
          <div className="font-mono-tabular text-base font-semibold text-white">
            {rightFlaskValue}
          </div>
        </div>
      </div>
    </div>
  );
};
