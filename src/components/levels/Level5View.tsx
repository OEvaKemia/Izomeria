import React, { useState } from 'react';
import type { ChallengeId, ChallengeResult } from '../../types/chemistry';
import { PolarimeterBench } from '../PolarimeterBench';
import { ChallengeFeedbackPanel, computeChallengeScore } from '../ChallengeShell';

interface Level5ViewProps {
  activeChallengeId: ChallengeId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  onCompleteChallenge: (result: ChallengeResult) => void;
  onNextChallenge: () => void;
  onFinishLevel: () => void;
}

export const Level5View: React.FC<Level5ViewProps> = ({
  activeChallengeId,
  results,
  onCompleteChallenge,
  onNextChallenge,
  onFinishLevel,
}) => {
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [usedHints, setUsedHints] = useState<Record<string, boolean>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // 5.1 state: moles of (-) lactic acid (target 0.12 mol)
  const [moles5_1, setMoles5_1] = useState<number>(0);

  // 5.2 state: volume in cm3 of (-) solution (target 150 cm3)
  const [vol5_2, setVol5_2] = useState<number>(50);

  // 5.3 state: optical rotation angle in degrees (target -24)
  const [angle5_3, setAngle5_3] = useState<number>(0);

  const currentAttempts = attempts[activeChallengeId] || 0;
  const currentUsedHint = Boolean(usedHints[activeChallengeId]);
  const currentShowHint = Boolean(showHints[activeChallengeId]);
  const currentError = errors[activeChallengeId] || null;
  const currentResult = results[activeChallengeId];

  const handleRequestHint = () => {
    setUsedHints((p) => ({ ...p, [activeChallengeId]: true }));
    setShowHints((p) => ({ ...p, [activeChallengeId]: true }));
  };

  const recordFail = (msg: string) => {
    setAttempts((p) => ({ ...p, [activeChallengeId]: (p[activeChallengeId] || 0) + 1 }));
    setErrors((p) => ({ ...p, [activeChallengeId]: msg }));
  };

  const recordSuccess = () => {
    setErrors((p) => ({ ...p, [activeChallengeId]: null }));
    onCompleteChallenge({
      challengeId: activeChallengeId,
      completed: true,
      attempts: currentAttempts,
      usedHint: currentUsedHint,
      score: computeChallengeScore(currentAttempts, currentUsedHint),
    });
  };

  // ---------------- 5.1 A RACÉM ELEGY ----------------
  if (activeChallengeId === '5.1') {
    const netMoles = 0.12 - moles5_1;
    // Illustrative proportional angle solely to show cancellation toward 0°
    const visualAngle = (netMoles / 0.12) * 18;
    const isBalanced = Math.abs(moles5_1 - 0.12) < 0.001;

    const check5_1 = () => {
      if (isBalanced) {
        recordSuccess();
      } else {
        recordFail(
          moles5_1 < 0.12
            ? 'A jobbra forgató (+) tejsav még feleslegben van, így az elegy továbbra is elforgatja a polarizált fény síkját. Racém elegyben a két enantiomer anyagmennyisége egyenlő!'
            : 'Túl sok balra forgató (−) tejsavat adagoltál, így az elegy már balra forgat! Racém elegyhez pontosan azonos anyagmennyiség szükséges.',
        );
      }
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            5.1. A racém elegy
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Egy tartályban <strong className="text-white">0,12 mol</strong> jobbra forgató tejsav található. Mennyi balra forgató tejsavat kell hozzáadni, hogy optikailag inaktív <strong className="text-white">racém elegyet</strong> kapjunk? Állítsd be a kívánt anyagmennyiséget a műszer adagolóján!
          </p>
        </div>

        <PolarimeterBench
          rotationDeg={visualAngle}
          leftFlaskTitle="Tartályban lévő (+) tejsav"
          leftFlaskValue="0,12 mol"
          rightFlaskTitle="Adagolt (−) tejsav"
          rightFlaskValue={`${moles5_1.toFixed(2).replace('.', ',')} mol`}
          isRacemic={isBalanced}
          statusLabel={
            isBalanced
              ? 'Racém elegy (1:1 anyagmennyiség-arány) · optikailag inaktív'
              : 'Optikailag aktív elegy · még nincs egyensúlyban'
          }
        />

        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="moles-5-1" className="text-sm font-medium text-slate-200">
              Hozzáadott balra forgató (−) tejsav anyagmennyisége:
            </label>
            <span className="font-mono-tabular text-lg font-bold text-cyan-300">
              {moles5_1.toFixed(2).replace('.', ',')} mol
            </span>
          </div>

          <input
            id="moles-5-1"
            type="range"
            min={0}
            max={0.25}
            step={0.01}
            disabled={Boolean(currentResult?.completed)}
            value={moles5_1}
            onChange={(e) => {
              setMoles5_1(Number(e.target.value));
              setErrors((p) => ({ ...p, '5.1': null }));
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setMoles5_1((v) => Math.max(0, Number((v - 0.01).toFixed(2))))}
                className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#080D16] text-sm font-mono-tabular text-slate-200 hover:border-cyan-500/60 min-h-[40px]"
              >
                −0,01 mol
              </button>
              <button
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setMoles5_1((v) => Math.min(0.25, Number((v + 0.01).toFixed(2))))}
                className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#080D16] text-sm font-mono-tabular text-slate-200 hover:border-cyan-500/60 min-h-[40px]"
              >
                +0,01 mol
              </button>
            </div>
            <span className="text-xs text-slate-400">
              Állapot: {isBalanced ? '0,0° – Optikailag inaktív' : 'Fényforgatás észlelhető'}
            </span>
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="5.1"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="A racém elegy a két enantiomer pontosan 1:1 mólarányú (egyenlő anyagmennyiségű) elegye, amelyben a két tükörképi molekula ellentétes fényforgatása kioltja egymást."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Pontos! 0,12 mol balra forgató tejsav hozzáadásával a két enantiomer anyagmennyisége megegyezik (0,12 mol : 0,12 mol), így a racém elegy optikailag inaktívvá válik (0°)."
          onCheck={check5_1}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 5.2 A HIÁNYZÓ ENANTIOMER ----------------
  if (activeChallengeId === '5.2') {
    const nPlus = 0.1 * 0.3; // 0.030 mol
    const nMinus = (vol5_2 / 1000) * 0.2;
    const visualAngle = ((nPlus - nMinus) / nPlus) * 18;
    const isBalanced = Math.abs(vol5_2 - 150) < 0.5;

    const check5_2 = () => {
      if (isBalanced) {
        recordSuccess();
      } else {
        recordFail(
          vol5_2 < 150
            ? 'Kevesebb anyagmennyiségű (−) enantiomert adagoltál, mint amennyi a (+) oldatban van. Számítsd ki először a 100 cm³, 0,30 mol/L oldatban lévő anyagmennyiséget (n = c · V)!'
            : 'Túl nagy térfogatot állítottál be, így a (−) enantiomer anyagmennyisége meghaladta a (+) enantiomerét. Számítsd ki, mekkora V térfogatú 0,20 mol/L oldat tartalmaz pontosan 0,030 mol anyagot!',
        );
      }
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            5.2. A hiányzó enantiomer
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-white">100 cm³</strong> térfogatú, <strong className="text-white">0,30 mol/L</strong> koncentrációjú jobbra forgató enantiomeroldathoz <strong className="text-white">0,20 mol/L</strong> koncentrációjú balra forgató oldatot adagolunk. Mekkora térfogat szükséges a racém elegy létrehozásához?
          </p>
        </div>

        <PolarimeterBench
          rotationDeg={visualAngle}
          leftFlaskTitle="100 cm³ · 0,30 mol/L (+) oldat"
          leftFlaskValue="n(+) = 0,030 mol"
          rightFlaskTitle={`Adagolt 0,20 mol/L (−) oldat`}
          rightFlaskValue={`${vol5_2} cm³ (n = ${nMinus.toFixed(3).replace('.', ',')} mol)`}
          isRacemic={isBalanced}
          statusLabel={
            isBalanced
              ? 'Racém elegy · n(+) = n(−) = 0,030 mol'
              : 'Eltérő anyagmennyiség · optikailag aktív'
          }
        />

        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="vol-5-2" className="text-sm font-medium text-slate-200">
              Adagolt 0,20 mol/L oldat térfogata:
            </label>
            <span className="font-mono-tabular text-lg font-bold text-cyan-300">
              {vol5_2} cm³
            </span>
          </div>

          <input
            id="vol-5-2"
            type="range"
            min={0}
            max={300}
            step={5}
            disabled={Boolean(currentResult?.completed)}
            value={vol5_2}
            onChange={(e) => {
              setVol5_2(Number(e.target.value));
              setErrors((p) => ({ ...p, '5.2': null }));
            }}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setVol5_2((v) => Math.max(0, v - 5))}
                className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#080D16] text-sm font-mono-tabular text-slate-200 hover:border-cyan-500/60 min-h-[40px]"
              >
                −5 cm³
              </button>
              <button
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setVol5_2((v) => Math.min(300, v + 5))}
                className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#080D16] text-sm font-mono-tabular text-slate-200 hover:border-cyan-500/60 min-h-[40px]"
              >
                +5 cm³
              </button>
            </div>
            <span className="text-xs text-slate-400 font-mono-tabular">
              n = c · V (100 cm³ = 0,100 L)
            </span>
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="5.2"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="1. lépés: n(+) = 0,100 L · 0,30 mol/L = 0,030 mol. 2. lépés: Racém elegyhez n(−) = 0,030 mol kell. 3. lépés: V(−) = n(−) / c(−) = 0,030 mol / 0,20 mol/L = 0,150 L = 150 cm³."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Kiváló számítás! A 100 cm³ 0,30 mol/L (+) oldatban 0,030 mol enantiomer van. Ezt pontosan 150 cm³ 0,20 mol/L (−) oldat közömbösíti optikailag (0,150 L · 0,20 mol/L = 0,030 mol)."
          onCheck={check5_2}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 5.3 AZ ELLENTÉTES FORGATÁS ----------------
  const check5_3 = () => {
    if (angle5_3 === -24) {
      recordSuccess();
    } else {
      recordFail(
        'Azonos koncentráció, azonos optikai úthossz és azonos mérési körülmények esetén a másik enantiomer pontosan ugyanakkora szögben, de ellentétes irányba forgatja el a polarizált fény síkját!',
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
          5.3. Az ellentétes forgatás
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Egy enantiomer oldata <strong className="text-white">+24°</strong>-kal forgatja el a polarizált fény síkját. Mekkora elfordulást okoz a másik enantiomer azonos koncentrációban, azonos optikai úthosszon és azonos mérési körülmények között? Állítsd be a polariméter analizátorát!
        </p>
      </div>

      <PolarimeterBench
        rotationDeg={angle5_3}
        leftFlaskTitle="Referencia enantiomer"
        leftFlaskValue="+24°"
        rightFlaskTitle="Beállított másik enantiomer"
        rightFlaskValue={`${angle5_3 > 0 ? '+' : angle5_3 < 0 ? '−' : ''}${Math.abs(angle5_3)}°`}
        isRacemic={false}
        statusLabel="Azonos koncentráció · azonos optikai úthossz"
      />

      <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="angle-5-3" className="text-sm font-medium text-slate-200">
            A másik enantiomer által okozott elfordulási szög:
          </label>
          <span className="font-mono-tabular text-lg font-bold text-amber-300">
            {angle5_3 > 0 ? `+${angle5_3}°` : angle5_3 < 0 ? `−${Math.abs(angle5_3)}°` : '0°'}
          </span>
        </div>

        <input
          id="angle-5-3"
          type="range"
          min={-40}
          max={40}
          step={1}
          disabled={Boolean(currentResult?.completed)}
          value={angle5_3}
          onChange={(e) => {
            setAngle5_3(Number(e.target.value));
            setErrors((p) => ({ ...p, '5.3': null }));
          }}
          className="w-full accent-amber-400 cursor-pointer"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={Boolean(currentResult?.completed)}
              onClick={() => setAngle5_3((v) => Math.max(-40, v - 1))}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#080D16] text-sm font-mono-tabular text-slate-200 hover:border-amber-500/60 min-h-[40px]"
            >
              −1°
            </button>
            <button
              type="button"
              disabled={Boolean(currentResult?.completed)}
              onClick={() => setAngle5_3((v) => Math.min(40, v + 1))}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-[#080D16] text-sm font-mono-tabular text-slate-200 hover:border-amber-500/60 min-h-[40px]"
            >
              +1°
            </button>
          </div>
          <span className="text-xs text-slate-400">Tartomány: −40° … +40°</span>
        </div>
      </div>

      <ChallengeFeedbackPanel
        challengeId="5.3"
        result={currentResult}
        attempts={currentAttempts}
        usedHint={currentUsedHint}
        hintText="A tükörképi enantiomerpár tagjai azonos körülmények között pontosan azonos nagyságú, de ellentétes előjelű elfordulást okoznak."
        showHint={currentShowHint}
        onRequestHint={handleRequestHint}
        errorMessage={currentError}
        successMessage="Pontos! A másik enantiomer pontosan −24°-kal forgatja el a polarizált fény síkját. Ezért oltja ki egymást a két enantiomer 1:1 arányú racém elegye."
        onCheck={check5_3}
        onNext={onFinishLevel}
        nextLabel="Részleg lezárása"
      />
    </div>
  );
};
