import React from 'react';
import { ArrowRight, CheckCircle2, Lock, Unlock } from 'lucide-react';
import type { ChallengeId, ChallengeResult, LevelId } from '../types/chemistry';
import { FINAL_LEVEL, LEVELS, type LevelMeta } from '../data/challenges';

interface LabHubProps {
  teamName: string;
  unlockedLevel: LevelId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  totalScore: number;
  maxScore: number;
  onSelectLevel: (levelId: LevelId) => void;
  onOpenSummary: () => void;
}

export const LabHub: React.FC<LabHubProps> = ({
  teamName,
  unlockedLevel,
  results,
  totalScore,
  maxScore,
  onSelectLevel,
  onOpenSummary,
}) => {
  const allSectorsDone = LEVELS.every((lvl) =>
    lvl.challengeIds.every((cid) => results[cid]?.completed),
  );
  const finalDone = Boolean(results['final']?.completed);

  const getLevelStats = (lvl: LevelMeta) => {
    const doneCount = lvl.challengeIds.filter((cid) => results[cid]?.completed).length;
    const score = lvl.challengeIds.reduce((sum, cid) => sum + (results[cid]?.score || 0), 0);
    const max = lvl.challengeIds.length * 10;
    const isComplete = doneCount === lvl.challengeIds.length;
    return { doneCount, totalCount: lvl.challengeIds.length, score, max, isComplete };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Intro Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-mono-tabular text-cyan-400">
            Aktív kutatócsapat: {teamName}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Molekulakutató Központ – Laboratóriumi részlegek
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            A részlegek egymás után nyílnak meg. Minden helyreállított adatbázis új nyomot ad a végső molekuláris anomália feloldásához.
          </p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div>
            <div className="text-xs text-slate-400">Összpontszám</div>
            <div className="font-mono-tabular text-2xl font-bold text-cyan-300">
              {totalScore} <span className="text-sm font-normal text-slate-400">/ {maxScore}</span>
            </div>
          </div>
          {finalDone && (
            <button
              type="button"
              onClick={onOpenSummary}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors min-h-[44px]"
            >
              Végső összesítés
            </button>
          )}
        </div>
      </div>

      {/* 5 Sequential Laboratory Sectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LEVELS.map((lvl) => {
          const stats = getLevelStats(lvl);
          const isUnlocked = lvl.id <= unlockedLevel;

          return (
            <div
              key={lvl.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                stats.isComplete
                  ? 'border-emerald-500/40 bg-[#0C1826]'
                  : isUnlocked
                    ? 'border-cyan-500/40 bg-[#0D1628]'
                    : 'border-slate-800/80 bg-[#090F1B] opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-mono-tabular text-cyan-400">{lvl.code}</span>
                  <span>
                    {stats.doneCount}/{stats.totalCount} kihívás ·{' '}
                    <span className="font-mono-tabular text-slate-200">{stats.score} pont</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {lvl.title}
                  </h3>
                  <p className="text-xs text-teal-300 mt-0.5">{lvl.topic}</p>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {lvl.shortBrief}
                </p>

                {stats.isComplete && lvl.completionBanner && (
                  <p className="text-xs font-medium text-emerald-300 pt-1">
                    {lvl.completionBanner}
                  </p>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  {stats.isComplete ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-medium">Teljesítve</span>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <Unlock className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-300 font-medium">Nyitott részleg</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-500">Zárolva</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => onSelectLevel(lvl.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold min-h-[38px] transition-colors ${
                    !isUnlocked
                      ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                      : stats.isComplete
                        ? 'border border-slate-700 text-slate-200 hover:border-cyan-500/60'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                >
                  {stats.isComplete ? 'Újranézés' : 'Belépés'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Central Laboratory (Final Mystery) */}
        <div
          className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
            finalDone
              ? 'border-emerald-400/60 bg-gradient-to-br from-[#0B1E28] to-[#0B1322]'
              : allSectorsDone
                ? 'border-cyan-400/70 bg-gradient-to-br from-[#0E2036] to-[#0B1322]'
                : 'border-slate-800/80 bg-[#090F1B] opacity-70'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
              <span className="font-mono-tabular text-amber-300">{FINAL_LEVEL.code}</span>
              <span className="font-mono-tabular text-slate-200">
                {results['final']?.score || 0} / 10 pont
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-white">
                {FINAL_LEVEL.title}
              </h3>
              <p className="text-xs text-amber-300 mt-0.5">{FINAL_LEVEL.topic}</p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {FINAL_LEVEL.shortBrief}
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {finalDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">Anomália megszüntetve</span>
                </>
              ) : allSectorsDone ? (
                <>
                  <Unlock className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-200 font-medium">Központi labor nyitva</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-500">Mind az 5 részleg után nyílik</span>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={!allSectorsDone}
              onClick={() => onSelectLevel(6)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold min-h-[38px] transition-colors ${
                !allSectorsDone
                  ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                  : finalDone
                    ? 'border border-slate-700 text-slate-200 hover:border-cyan-500/60'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              {finalDone ? 'Megtekintés' : 'Végső vizsgálat'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
