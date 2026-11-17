import React, { useState } from 'react';
import { ArrowRight, Atom } from 'lucide-react';
import { LIMONEN_A } from '../data/molecules';
import { MoleculeViewer } from './MoleculeViewer';

interface StartScreenProps {
  initialTeamName: string;
  onStart: (teamName: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  initialTeamName,
  onStart,
}) => {
  const [teamName, setTeamName] = useState(initialTeamName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = teamName.trim();
    if (cleaned.length < 2) {
      setError('Adj meg legalább 2 karakterből álló csapatnevet a kutatás indításához!');
      return;
    }
    onStart(cleaned);
  };

  return (
    <div className="min-h-screen lab-grid-bg flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Story, title, team input */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-cyan-400 tracking-wide">
              <Atom className="w-4 h-4 shrink-0" />
              <span>Molekuláris Kutatóközpont · 11. évfolyam</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              MOLEKULÁRIS NYOMOZÁS
            </h1>
            <p className="font-display text-lg sm:text-2xl text-cyan-300 font-medium">
              Az izomerek rejtélye
            </p>
            <p className="text-sm sm:text-base text-slate-300 italic pt-1">
              „Öt laboratórium. Egy molekuláris anomália. A megoldás a térszerkezetben rejlik.”
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B1324]/90 p-5 space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              A kutatóközpont központi adatbázisában kritikus szerkezeti hiba lépett fel: különféle szerves vegyületek térszerkezeti és összegképleti adatai összekeveredtek, ezért a rendszer öt laboratóriumi részleget zárolt.
            </p>
            <p>
              Csapatotok (2–3 fő) feladata a valós idejű 3D-s molekulamodellek vizsgálata, az izomerek azonosítása, a hiányzó térszerkezetek helyreállítása és a központi anomália okának feltárása.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="team-name-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Csapatnév
              </label>
              <input
                id="team-name-input"
                type="text"
                maxLength={40}
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Pl. Kiralitás Kutatók"
                className="w-full px-4 py-3 rounded-xl bg-[#0D1628] border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 text-sm sm:text-base min-h-[48px]"
              />
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-cyan-500 text-slate-950 font-display font-bold text-sm sm:text-base tracking-wide hover:bg-cyan-400 transition-colors min-h-[50px]"
            >
              KUTATÁS INDÍTÁSA
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: Interactive 3D preview */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <MoleculeViewer
            molecule={LIMONEN_A}
            label="Interaktív 3D molekulalabor"
            sublabel="Forgasd és nagyítsd a modellt!"
            heightClass="h-[310px] sm:h-[390px] lg:h-[440px]"
            allowSubstituentInspect={false}
          />
        </div>
      </div>
    </div>
  );
};
