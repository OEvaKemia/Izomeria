import React from 'react';
import { ArrowRight, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import type { ChallengeId, ChallengeResult } from '../types/chemistry';

export function computeChallengeScore(attemptsBeforeSuccess: number, usedHint: boolean): number {
  if (usedHint) return 5;
  if (attemptsBeforeSuccess === 0) return 10;
  if (attemptsBeforeSuccess === 1) return 7;
  return 5;
}

interface ChallengeFeedbackPanelProps {
  challengeId: ChallengeId;
  result?: ChallengeResult;
  attempts: number;
  usedHint: boolean;
  hintText: string;
  showHint: boolean;
  onRequestHint: () => void;
  errorMessage: string | null;
  successMessage: string | null;
  onCheck?: () => void;
  checkLabel?: string;
  checkDisabled?: boolean;
  onNext?: () => void;
  nextLabel?: string;
}

export const ChallengeFeedbackPanel: React.FC<ChallengeFeedbackPanelProps> = ({
  result,
  attempts,
  usedHint,
  hintText,
  showHint,
  onRequestHint,
  errorMessage,
  successMessage,
  onCheck,
  checkLabel = 'Megoldás ellenőrzése',
  checkDisabled = false,
  onNext,
  nextLabel = 'Következő feladat',
}) => {
  const isCompleted = Boolean(result?.completed);

  return (
    <div className="space-y-3 pt-2">
      {/* Hint box */}
      {showHint && !isCompleted && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 text-xs mb-0.5">Szakmai segítség (max. 5 pont)</p>
              <p className="text-slate-200 leading-relaxed">{hintText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error diagnostic feedback */}
      {errorMessage && !isCompleted && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300 text-xs mb-0.5">
                Még nem pontos ({attempts}. próbálkozás – nincs pontlevonás)
              </p>
              <p className="text-slate-200 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success explanation */}
      {isCompleted && (
        <div className="rounded-xl border border-emerald-500/45 bg-emerald-950/30 px-4 py-3.5 text-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-display font-semibold text-emerald-300">
                  Helyes elemzés! +{result?.score ?? 0} pont
                </p>
                <span className="font-mono-tabular text-xs text-emerald-400/80">
                  {result?.usedHint
                    ? 'Segítséggel megoldva'
                    : result?.attempts === 0
                      ? 'Első próbálkozásra'
                      : result?.attempts === 1
                        ? 'Második próbálkozásra'
                        : 'Többszöri próbálkozásra'}
                </span>
              </div>
              {successMessage && <p className="text-slate-200 leading-relaxed">{successMessage}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {!isCompleted ? (
          <>
            <button
              type="button"
              onClick={onRequestHint}
              disabled={usedHint}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors min-h-[44px] ${
                usedHint
                  ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'border-slate-700 text-slate-200 hover:border-amber-500/50 hover:text-amber-300'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              {usedHint ? 'Segítség megjelenítve' : 'Segítség kérése'}
            </button>

            {onCheck && (
              <button
                type="button"
                onClick={onCheck}
                disabled={checkDisabled}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 disabled:opacity-45 disabled:cursor-not-allowed transition-colors min-h-[44px] ml-auto"
              >
                {checkLabel}
              </button>
            )}
          </>
        ) : (
          onNext && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition-colors min-h-[44px] ml-auto"
            >
              {nextLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
};
