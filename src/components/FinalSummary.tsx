import React from 'react';
import { Award, RotateCcw, ArrowLeft } from 'lucide-react';
import type { ChallengeId, ChallengeResult } from '../types/chemistry';
import { FINAL_LEVEL, LEVELS } from '../data/challenges';

interface FinalSummaryProps {
  teamName: string;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  totalScore: number;
  maxScore: number;
  onReturnHub: () => void;
  onResetGame: () => void;
}

export const FinalSummary: React.FC<FinalSummaryProps> = ({
  teamName,
  results,
  totalScore,
  maxScore,
  onReturnHub,
  onResetGame,
}) => {
  const allLevels = [...LEVELS, FINAL_LEVEL];
  const allChallengeIds = allLevels.flatMap((l) => l.challengeIds);
  const completedCount = allChallengeIds.filter((id) => results[id]?.completed).length;
  const pct = Math.round((totalScore / maxScore) * 100);

  let feedbackTitle = 'Kiváló molekuláris nyomozómunka!';
  let feedbackText =
    'Csapatotok biztosan látja át a térszerkezeti összefüggéseket: a szerkezeti izomériától a kettős kötések cisz–transz elrendezésén át az optikai izoméria, a mezovegyületek és a racém elegyek egyensúlyáig.';

  if (pct >= 90) {
    feedbackTitle = 'Kiemelkedő sztereokémiai elemzők!';
    feedbackText =
      'Szinte hibátlanul, önálló térszerkezeti gondolkodással oldottátok meg a feladatokat. Magabiztosan azonosítjátok az aszimmetrikus szénatomokat, a rejtett belső szimmetriasíkokat és a polarimetriai összefüggéseket.';
  } else if (pct < 70) {
    feedbackTitle = 'Sikeres adatbázis-helyreállítás!';
    feedbackText =
      'Minden laboratóriumi részleget sikeresen lezártatok. Érdemes időnként még áttekinteni a kettős kötések körüli azonos csoportok szűrését, valamint a belső szimmetriasík és a racém elegy fogalmát.';
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="rounded-2xl border border-cyan-500/40 bg-[#0B1424] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tabular text-cyan-400">
              <Award className="w-4 h-4" />
              <span>Kutatási zárójelentés</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {teamName}
            </h2>
            <p className="text-sm text-slate-300">
              Teljesített kihívások: <strong className="text-white">{completedCount} / {allChallengeIds.length}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400">Összpontszám</div>
            <div className="font-mono-tabular text-4xl font-bold text-cyan-300">
              {totalScore} <span className="text-lg font-normal text-slate-400">/ {maxScore}</span>
            </div>
            <div className="font-mono-tabular text-xs text-teal-300">{pct}%-os teljesítmény</div>
          </div>
        </div>

        {/* Topic Breakdown */}
        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold text-white">
            Témakörönkénti teljesítmény
          </h3>
          <div className="space-y-2.5">
            {allLevels.map((lvl) => {
              const score = lvl.challengeIds.reduce(
                (acc, id) => acc + (results[id]?.score || 0),
                0,
              );
              const max = lvl.challengeIds.length * 10;
              const ratio = max > 0 ? Math.round((score / max) * 100) : 0;

              return (
                <div
                  key={lvl.id}
                  className="rounded-xl border border-slate-800 bg-[#080E1A] p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <div>
                      <span className="font-medium text-white">{lvl.topic}</span>
                      <span className="text-xs text-slate-400 ml-2">({lvl.title})</span>
                    </div>
                    <span className="font-mono-tabular text-xs sm:text-sm text-cyan-300 font-semibold">
                      {score} / {max} pont ({ratio}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personalized feedback */}
        <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-4 space-y-1.5">
          <h4 className="font-display text-sm font-semibold text-teal-300">
            {feedbackTitle}
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed">{feedbackText}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onReturnHub}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium hover:border-cyan-500/60 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza a laboratóriumokhoz
          </button>

          <button
            type="button"
            onClick={onResetGame}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 transition-colors min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            Új kutatás indítása
          </button>
        </div>
      </div>
    </div>
  );
};
