import React, { useState } from 'react';
import { Crosshair, ShieldCheck } from 'lucide-react';
import type { ChallengeResult } from '../../types/chemistry';
import { HIDROXIBUTANSAV_A, HIDROXIBUTANSAV_B } from '../../data/molecules';
import { DualMoleculeComparator } from '../DualMoleculeComparator';
import { ChallengeFeedbackPanel, computeChallengeScore } from '../ChallengeShell';

interface FinalMysteryViewProps {
  result?: ChallengeResult;
  onCompleteChallenge: (result: ChallengeResult) => void;
  onFinishGame: () => void;
}

const FINAL_REASONS = [
  {
    id: 'same_formula_conn',
    text: 'Mindkét molekula összegképlete (C₄H₈O₃) és az atomok kapcsolódási sorrendje (2-hidroxibutánsav) azonos.',
    correct: true,
  },
  {
    id: 'mirror_non_super',
    text: 'Az aszimmetrikus C2 szénatom körüli térbeli elrendeződés miatt egymás tükörképei, de semmilyen forgatással sem hozhatók fedésbe.',
    correct: true,
  },
  {
    id: 'different_connectivity',
    text: 'Az anomália oka, hogy az –OH csoport eltérő sorszámú szénatomhoz kapcsolódik a két molekulában.',
    correct: false,
  },
  {
    id: 'cis_trans_locked',
    text: 'A két forma közötti különbséget a C=C kettős kötés gátolt elfordulása okozza.',
    correct: false,
  },
];

export const FinalMysteryView: React.FC<FinalMysteryViewProps> = ({
  result,
  onCompleteChallenge,
  onFinishGame,
}) => {
  const [attempts, setAttempts] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const [relationChoice, setRelationChoice] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const isCompleted = Boolean(result?.completed);

  const toggleReason = (id: string) => {
    if (isCompleted) return;
    setSelectedReasons((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const checkFinal = () => {
    if (!selectedAtom) {
      setAttempts((a) => a + 1);
      setError('Jelöld ki az A minta 3D modelljében az aszimmetrikus szénatomot!');
      return;
    }
    if (selectedAtom !== 'C2') {
      setAttempts((a) => a + 1);
      setError(
        'Nem ez az aszimmetrikus szénatom! Keresd meg azt a szénatomot, amelyhez egyszerre kapcsolódik a –COOH, az –OH, egy –CH₂–CH₃ etilcsoport és egy –H atom.',
      );
      return;
    }
    if (relationChoice !== 'enantiomers') {
      setAttempts((a) => a + 1);
      setError(
        'Ellenőrizd az izomériaviszonyt a „Fedésbe hozási próba” és a „Tükörsík” segítségével! Az atomok kapcsolódása megegyezik, mégsem fedik egymást.',
      );
      return;
    }
    const correctIds = FINAL_REASONS.filter((r) => r.correct).map((r) => r.id);
    const exact =
      selectedReasons.length === correctIds.length &&
      correctIds.every((id) => selectedReasons.includes(id));
    if (!exact) {
      setAttempts((a) => a + 1);
      setError('Pontosítsd a végső indoklást! Válogasd ki a két valóban igaz megállapítást.');
      return;
    }

    setError(null);
    onCompleteChallenge({
      challengeId: 'final',
      completed: true,
      attempts,
      usedHint,
      score: computeChallengeScore(attempts, usedHint),
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-white">
          A végső nyomozás – Az anomália forrása
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          A központi adatbázis két azonos összegképletű (<span className="font-mono-tabular text-cyan-300">C₄H₈O₃</span>) és azonos atomkapcsolódású (2-hidroxibutánsav) molekulát jelzett összeütközésként. Vizsgáld meg mindkét 3D-s szerkezetet, jelöld ki az aszimmetrikus szénatomot az A mintán, állapítsd meg az izomériaviszonyt, és zárd le a vizsgálatot!
        </p>
      </div>

      <DualMoleculeComparator
        leftMolecule={HIDROXIBUTANSAV_A}
        rightMolecule={HIDROXIBUTANSAV_B}
        leftLabel="2-hidroxibutánsav – A minta"
        rightLabel="2-hidroxibutánsav – B minta"
        leftSublabel="C₄H₈O₃ · jelöld ki az aszimmetrikus C-atomot"
        rightSublabel="C₄H₈O₃"
        selectableLeft={!isCompleted}
        selectedLeftAtomIds={selectedAtom ? [selectedAtom] : []}
        onSelectLeftAtom={(id) => {
          setSelectedAtom(id);
          setError(null);
        }}
        allowOverlayAttempt={true}
        allowMirrorPlaneToggle={true}
        keepChiralHydrogens={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" />
              1. Aszimmetrikus szénatom az A mintában:
            </span>
            <span className="font-mono-tabular text-white">
              {selectedAtom || 'Nincs kijelölve'}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-cyan-300">
              2. Milyen izomériaviszony áll fenn a két molekula között?
            </p>
            <div className="space-y-2">
              {[
                { id: 'constitutional', label: 'Helyzeti szerkezeti izoméria' },
                { id: 'geometric', label: 'Cisz–transz geometriai izoméria' },
                { id: 'enantiomers', label: 'Optikai izoméria – nem fedésbe hozható tükörképi pár (enantiomerek)' },
                { id: 'identical', label: 'Azonos konformációk (ugyanaz a molekula)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isCompleted}
                  onClick={() => setRelationChoice(opt.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm min-h-[44px] ${
                    relationChoice === opt.id
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2">
          <p className="text-xs font-semibold text-cyan-300">
            3. Rövid szakmai indoklás (válaszd ki a pontos megállapításokat):
          </p>
          {FINAL_REASONS.map((item) => {
            const active = selectedReasons.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={isCompleted}
                onClick={() => toggleReason(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors min-h-[44px] ${
                  active
                    ? 'border-teal-400 bg-teal-500/15 text-teal-100'
                    : 'border-slate-800 bg-[#080D16] text-slate-300 hover:border-slate-600'
                }`}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution Banner on completion */}
      {isCompleted && (
        <div className="rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-cyan-950/60 via-[#0B172A] to-teal-950/50 p-6 text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-cyan-300">
            ANOMÁLIA MEGSZÜNTETVE
          </h4>
          <p className="text-sm sm:text-base text-slate-100 max-w-2xl mx-auto leading-relaxed">
            „A molekulák azonosságát nem kizárólag az összegképlet és az atomok kapcsolódása határozza meg. A térbeli elrendeződés is döntő jelentőségű.”
          </p>
        </div>
      )}

      <ChallengeFeedbackPanel
        challengeId="final"
        result={result}
        attempts={attempts}
        usedHint={usedHint}
        hintText="Kattints az –OH csoporthoz és a –COOH csoporthoz is kapcsolódó szénatomra (C2)! A négy különböző csoport (–H, –OH, –COOH, –CH₂CH₃) miatt a két tükörkép nem fedhető át egymással."
        showHint={showHint}
        onRequestHint={() => {
          setUsedHint(true);
          setShowHint(true);
        }}
        errorMessage={error}
        successMessage="A központi adatbázis teljes körűen helyreállt!"
        onCheck={checkFinal}
        onNext={onFinishGame}
        nextLabel="Eredmények és szakmai értékelés megtekintése"
      />
    </div>
  );
};
