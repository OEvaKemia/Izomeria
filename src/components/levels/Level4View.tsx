import React, { useMemo, useState } from 'react';
import { Check, Crosshair, RotateCw, ScanEye } from 'lucide-react';
import type { ChallengeId, ChallengeResult, MoleculeData } from '../../types/chemistry';
import {
  ERITRIT_ENANT_A,
  ERITRIT_ENANT_B,
  ERITRIT_MESO_ALT_VIEW,
  ERITRIT_MESO_STAGGERED,
  ERITRIT_MESO_SYN_REF,
} from '../../data/molecules';
import {
  mirrorMolecule,
  rotateConformationAroundBond,
} from '../../utils/chemistryGeometry';
import { MoleculeViewer } from '../MoleculeViewer';
import { ChallengeFeedbackPanel, computeChallengeScore } from '../ChallengeShell';

interface Level4ViewProps {
  activeChallengeId: ChallengeId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  onCompleteChallenge: (result: ChallengeResult) => void;
  onNextChallenge: () => void;
  onFinishLevel: () => void;
}

const MESO_REASONS_4_3 = [
  {
    id: 'internal_plane',
    text: 'A mezovegyület megfelelő konformációban belső szimmetriasíkkal rendelkezik, ezért a két félmolekula egymás tükörképe.',
    correct: true,
  },
  {
    id: 'superimposable',
    text: 'A molekula tükörképe térbeli elforgatással fedésbe hozható az eredeti molekulával (akirális), ezért optikailag inaktív.',
    correct: true,
  },
  {
    id: 'internal_cancel',
    text: 'A két aszimmetrikus szénatom ellentétes irányú optikai hatása molekulán belül kioltja egymást.',
    correct: true,
  },
  {
    id: 'racemic_mix',
    text: 'A mezovegyület két különböző enantiomer 1:1 arányú fizikai keveréke (racém elegy).',
    correct: false,
  },
  {
    id: 'no_chiral',
    text: 'A molekulában valójában egyetlen aszimmetrikus szénatom sincs.',
    correct: false,
  },
];

export const Level4View: React.FC<Level4ViewProps> = ({
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

  // 4.1 state
  const [selectedAtoms4_1, setSelectedAtoms4_1] = useState<string[]>([]);

  // 4.2 state
  const [leftIdx4_2, setLeftIdx4_2] = useState<number>(0);
  const [rightIdx4_2, setRightIdx4_2] = useState<number>(2);
  const [matchingPair4_2, setMatchingPair4_2] = useState<number[]>([]);
  const [stereoCount4_2, setStereoCount4_2] = useState<string>('');

  // 4.3 state
  const [inspectedIsoIdx4_3, setInspectedIsoIdx4_3] = useState<number>(0);
  const [symmetryMode4_3, setSymmetryMode4_3] = useState<boolean>(true);
  const [conformationAngle, setConformationAngle] = useState<number>(0); // 0 = staggered zig-zag; 180 = U-conformation (syn)
  const [showMirrorCopy, setShowMirrorCopy] = useState<boolean>(false);
  const [enantPair4_3, setEnantPair4_3] = useState<string[]>([]);
  const [mesoChoice, setMesoChoice] = useState<string | null>(null);
  const [diastChoice, setDiastChoice] = useState<string | null>(null);
  const [mesoReasons, setMesoReasons] = useState<string[]>([]);

  const currentAttempts = attempts[activeChallengeId] || 0;
  const currentUsedHint = Boolean(usedHints[activeChallengeId]);
  const currentShowHint = Boolean(showHints[activeChallengeId]);
  const currentError = errors[activeChallengeId] || null;
  const currentResult = results[activeChallengeId];

  // 4.3 memoized stereoisomer data MUST stay above early returns so hook order never changes across 4.1 -> 4.2 -> 4.3
  const isomers4_3 = useMemo(
    () => [
      {
        key: 'A',
        label: 'Izomer A',
        role: 'enantiomer' as const,
        baseSyn: null as MoleculeData | null,
        mol: ERITRIT_ENANT_A,
      },
      {
        key: 'B',
        label: 'Izomer B',
        role: 'meso' as const,
        baseSyn: ERITRIT_MESO_SYN_REF,
        mol: ERITRIT_MESO_STAGGERED,
      },
      {
        key: 'C',
        label: 'Izomer C',
        role: 'enantiomer' as const,
        baseSyn: null as MoleculeData | null,
        // Reflect across Z=0 so C keeps the same backbone orientation as A and B while inverting both chiral centers
        mol: mirrorMolecule(
          ERITRIT_ENANT_A,
          'eritrit_enant_B_aligned',
          'Eritrit – III. izomer',
          'z',
        ),
      },
    ],
    [],
  );

  const selectedIso = isomers4_3[inspectedIsoIdx4_3] || isomers4_3[1];
  const isCompleted4_3 = Boolean(results['4.3']?.completed);

  // Compute conformationally rotated molecule in symmetry inspection mode!
  // Note: At 180° (U-conformation), Meso (Izomer B) adopts the exact syn reference so the symmetry plane bisects it cleanly!
  const displayedMol4_3 = useMemo(() => {
    if (!symmetryMode4_3 || conformationAngle === 0) {
      return selectedIso.mol;
    }
    if (conformationAngle === 180 && selectedIso.key === 'B' && selectedIso.baseSyn) {
      return selectedIso.baseSyn;
    }
    return rotateConformationAroundBond(
      selectedIso.mol,
      'C2',
      'C3',
      conformationAngle,
    );
  }, [selectedIso, symmetryMode4_3, conformationAngle]);

  const mirrorPreviewMol = useMemo(() => {
    if (!showMirrorCopy) return null;
    return mirrorMolecule(displayedMol4_3, `${displayedMol4_3.id}_mirror`, `${selectedIso.label} tükörképe`);
  }, [displayedMol4_3, showMirrorCopy, selectedIso.label]);

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

  // ---------------- 4.1 AZ ERITRIT SZERKEZETE ----------------
  if (activeChallengeId === '4.1') {
    const toggleAtom = (id: string) => {
      if (currentResult?.completed) return;
      setErrors((p) => ({ ...p, '4.1': null }));
      setSelectedAtoms4_1((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };

    const check4_1 = () => {
      if (selectedAtoms4_1.length === 0) {
        recordFail('Jelöld ki az eritrit aszimmetrikus szénatomjait a 3D modellben!');
        return;
      }
      const hasC2 = selectedAtoms4_1.includes('C2');
      const hasC3 = selectedAtoms4_1.includes('C3');
      if (selectedAtoms4_1.length !== 2 || !hasC2 || !hasC3) {
        recordFail(
          'Nem pontos a kijelölés! A láncvégi C1 és C4 szénatomokhoz két-két azonos hidrogénatom (–CH₂OH) kapcsolódik, így azok NEM aszimmetrikusak. Vizsgáld meg a belső szénatomokat!',
        );
        return;
      }
      recordSuccess();
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            4.1. Az eritrit szerkezete
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Az eritrit (HOCH₂–CHOH–CHOH–CH₂OH, C₄H₁₀O₄) egy cukoralkohol. Kattints a 3D modellben az <strong className="text-white">összes aszimmetrikus szénatomra</strong>! (Több atomot is kijelölhetsz, az újbóli kattintás törli a kijelölést.)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8">
            <MoleculeViewer
              molecule={ERITRIT_MESO_STAGGERED}
              label="Eritrit (HOCH₂–CHOH–CHOH–CH₂OH)"
              sublabel="C₄H₁₀O₄ · jelöld ki az aszimmetrikus szénatomokat!"
              selectable={!currentResult?.completed}
              selectedAtomIds={selectedAtoms4_1}
              onSelectAtom={toggleAtom}
              keepChiralHydrogens={true}
              heightClass="h-[340px] sm:h-[400px] lg:h-[430px]"
            />
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Crosshair className="w-4 h-4" />
                <span>Kijelölt atomok ({selectedAtoms4_1.length})</span>
              </div>
              {selectedAtoms4_1.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Még nem jelöltél ki egyetlen atomot sem. Kattints a szürke szénatomokra a 3D modellben!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedAtoms4_1.map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={Boolean(currentResult?.completed)}
                      onClick={() => toggleAtom(id)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 font-mono-tabular text-xs"
                    >
                      {id} ×
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
                Tipp: Egy szénatomra kattintva a „Kapcsolódó csoportok” gombbal ellenőrizheted, hogy négy különböző csoport kapcsolódik-e hozzá.
              </p>
            </div>
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="4.1"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="A négy szénatomos lánc két szélső szénatomja (–CH₂OH) két hidrogénatomot visel, tehát nem aszimmetrikus. A két középső szénatomhoz (C2 és C3) viszont –H, –OH, –CH₂OH és –CH(OH)CH₂OH csoport kapcsolódik."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Pontos! Az eritritben mindkét belső szénatom (C2 és C3) aszimmetrikus, mert négy különböző csoport kapcsolódik hozzájuk."
          onCheck={check4_1}
          checkDisabled={selectedAtoms4_1.length === 0}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 4.2 HÁROM VAGY NÉGY? ----------------
  if (activeChallengeId === '4.2') {
    const models4_2: { idx: number; label: string; mol: MoleculeData }[] = [
      { idx: 1, label: '1. modell', mol: ERITRIT_MESO_STAGGERED },
      { idx: 2, label: '2. modell', mol: ERITRIT_ENANT_A },
      { idx: 3, label: '3. modell', mol: ERITRIT_MESO_ALT_VIEW },
      { idx: 4, label: '4. modell', mol: ERITRIT_ENANT_B },
    ];

    const togglePairPick = (idx: number) => {
      if (currentResult?.completed) return;
      setErrors((p) => ({ ...p, '4.2': null }));
      setMatchingPair4_2((prev) => {
        if (prev.includes(idx)) return prev.filter((x) => x !== idx);
        if (prev.length >= 2) return [prev[1], idx];
        return [...prev, idx];
      });
    };

    const check4_2 = () => {
      if (matchingPair4_2.length !== 2 || !stereoCount4_2) {
        recordFail('Jelöld ki a két azonos sztereoizomert ábrázoló modellt, és add meg a különböző sztereoizomerek számát!');
        return;
      }
      const isPair13 =
        matchingPair4_2.includes(1) && matchingPair4_2.includes(3);
      if (!isPair13) {
        recordFail(
          'A kijelölt két modell nem ugyanazt a sztereoizomert ábrázolja! Hasonlítsd össze az 1. és a 3. modellt egymás mellett, és forgasd el őket úgy, hogy a szénláncok azonos irányba mutassanak!',
        );
        return;
      }
      if (stereoCount4_2 !== '3') {
        recordFail(
          'Ha a négy megjelenített modell közül kettő valójában ugyanaz a molekula (csak más térbeli helyzetben), akkor hány KÜLÖNBÖZŐ sztereoizomer létezik?',
        );
        return;
      }
      recordSuccess();
    };

    const leftMol = models4_2[leftIdx4_2].mol;
    const rightMol = models4_2[rightIdx4_2].mol;

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            4.2. Három vagy négy?
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Két aszimmetrikus szénatom esetén elméletileg legfeljebb 2² = 4 sztereoizomer várható. Az alábbi négy 3D modell közül azonban kettő ugyanazt a molekulát ábrázolja, csak eltérő térbeli helyzetben! Hasonlítsd össze őket az összehasonlítóban, és keresd meg az azonos párt!
          </p>
        </div>

        {/* Comparison selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0D1526] p-3.5 rounded-xl border border-slate-800">
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">Bal oldali vizsgált modell:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {models4_2.map((m, i) => (
                <button
                  key={m.idx}
                  type="button"
                  onClick={() => setLeftIdx4_2(i)}
                  className={`py-2 rounded-lg text-xs font-semibold border min-h-[38px] ${
                    leftIdx4_2 === i
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700 bg-[#080D16] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {m.idx}.
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">Jobb oldali vizsgált modell:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {models4_2.map((m, i) => (
                <button
                  key={m.idx}
                  type="button"
                  onClick={() => setRightIdx4_2(i)}
                  className={`py-2 rounded-lg text-xs font-semibold border min-h-[38px] ${
                    rightIdx4_2 === i
                      ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                      : 'border-slate-700 bg-[#080D16] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {m.idx}.
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MoleculeViewer
            molecule={leftMol}
            label={`${models4_2[leftIdx4_2].label}`}
            sublabel="Forgatható 3D nézet"
            heightClass="h-[290px] sm:h-[340px]"
            keepChiralHydrogens={true}
          />
          <MoleculeViewer
            molecule={rightMol}
            label={`${models4_2[rightIdx4_2].label}`}
            sublabel="Forgatható 3D nézet"
            heightClass="h-[290px] sm:h-[340px]"
            keepChiralHydrogens={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
            <p className="text-xs font-semibold text-cyan-300">
              1. Melyik két modell ábrázolja pontosan ugyanazt a sztereoizomert? (Válassz kettőt!)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {models4_2.map((m) => {
                const picked = matchingPair4_2.includes(m.idx);
                return (
                  <button
                    key={m.idx}
                    type="button"
                    disabled={Boolean(currentResult?.completed)}
                    onClick={() => togglePairPick(m.idx)}
                    className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border text-sm font-medium min-h-[44px] ${
                      picked
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {picked && <Check className="w-3.5 h-3.5" />}
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
            <p className="text-xs font-semibold text-cyan-300">
              2. Hány különböző sztereoizomerje van tehát az eritritnek?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {['2', '3', '4', '6'].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
                  onClick={() => setStereoCount4_2(n)}
                  className={`py-2.5 rounded-lg border font-mono-tabular text-sm font-semibold min-h-[44px] ${
                    stereoCount4_2 === n
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="4.2"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="Állítsd be balra az 1. modellt, jobbra a 3. modellt, majd forgasd el a 3. modellt kb. 180°-kal! Észre fogod venni, hogy minden atom és –OH csoport pontosan ugyanúgy helyezkedik el."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Pontos! Az 1. és a 3. modell valójában ugyanazt a molekulát mutatja eltérő nézetből. Így az eritritnek négy helyett csak 3 különböző sztereoizomerje van."
          onCheck={check4_2}
          checkDisabled={matchingPair4_2.length !== 2 || !stereoCount4_2}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 4.3 A MEZOVEGYÜLET FELISMERÉSE ----------------
  const toggleEnantPick4_3 = (key: string) => {
    if (isCompleted4_3) return;
    setErrors((p) => ({ ...p, '4.3': null }));
    setEnantPair4_3((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return [prev[1], key];
      return [...prev, key];
    });
  };

  const toggleMesoReason = (id: string) => {
    if (isCompleted4_3) return;
    setErrors((p) => ({ ...p, '4.3': null }));
    setMesoReasons((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const expectedEnantKeys = isomers4_3
    .filter((i) => i.role === 'enantiomer')
    .map((i) => i.key);
  const expectedMesoKey =
    isomers4_3.find((i) => i.role === 'meso')?.key || 'B';

  const check4_3 = () => {
    if (
      enantPair4_3.length !== 2 ||
      !mesoChoice ||
      !diastChoice ||
      mesoReasons.length === 0
    ) {
      const missing: string[] = [];
      if (enantPair4_3.length !== 2) missing.push('1. (válassz 2 enantiomert)');
      if (!mesoChoice) missing.push('2. (mezovegyület)');
      if (!diastChoice) missing.push('3. (diasztereomerek)');
      if (mesoReasons.length === 0) missing.push('4. (indoklás)');
      recordFail(`Hiányos válasz! Kérlek töltsd ki a következő részeket is: ${missing.join(', ')}.`);
      return;
    }

    const q1Ok =
      enantPair4_3.length === expectedEnantKeys.length &&
      expectedEnantKeys.every((k) => enantPair4_3.includes(k));
    const q2Ok = mesoChoice === expectedMesoKey;
    const q3Ok = diastChoice === 'AB_BC';

    const correctIds = MESO_REASONS_4_3.filter((r) => r.correct).map((r) => r.id);
    const hasWrongReason = mesoReasons.some((id) => !correctIds.includes(id));
    const q4Ok =
      !hasWrongReason &&
      mesoReasons.length === correctIds.length &&
      correctIds.every((id) => mesoReasons.includes(id));

    if (q1Ok && q2Ok && q3Ok && q4Ok) {
      // Snap view to the meso isomer in syn conformation so the revealed internal symmetry plane is immediately visible!
      const mesoIdx = isomers4_3.findIndex((i) => i.key === expectedMesoKey);
      if (mesoIdx >= 0) setInspectedIsoIdx4_3(mesoIdx);
      setSymmetryMode4_3(true);
      setConformationAngle(180);
      recordSuccess();
      return;
    }

    const partStatuses: string[] = [
      `1. kérdés (enantiomerpár): ${q1Ok ? 'Helyes ✓' : 'Hibás ✗ (a nem fedésbe hozható tükörképi párt keresd a Tükörkép segítségével)'}`,
      `2. kérdés (mezovegyület): ${q2Ok ? 'Helyes ✓' : 'Hibás ✗ (forgasd el 180°-kal a C2–C3 kötést, és keresd a tükörszimmetrikus izomert)'}`,
      `3. kérdés (diasztereomerek): ${q3Ok ? 'Helyes ✓' : 'Hibás ✗ (minden nem tükörképi sztereoizomer-pár diasztereomer)'}`,
      `4. kérdés (optikai inaktivitás): ${
        q4Ok
          ? 'Helyes ✓'
          : hasWrongReason
            ? 'Hibás ✗ (a mezovegyület egyetlen tiszta vegyület, nem racém elegy, és van aszimmetrikus szénatomja!)'
            : 'Hiányos ✗ (a bejelölt állításaid igazak, de jelöld be mind a 3 igaz magyarázatot!)'
      }`,
    ];

    recordFail(partStatuses.join(' · '));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
          4.3. A mezovegyület felismerése
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Az eritrit három sztereoizomerje (Izomer A, B és C) látható alább. Használd a <strong className="text-white">Szimmetriavizsgálati módot</strong> a C2–C3 egyszeres kötés körüli elforgatáshoz és a tükörkép teszteléséhez! (A belső szimmetriasíkot a rendszer csak a helyes megoldás után jeleníti meg.)
        </p>
      </div>

      {/* Isomer switcher + Symmetry Inspection Mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-[#0D1526]">
        <div className="flex flex-wrap items-center gap-2">
          {isomers4_3.map((iso, i) => (
            <button
              key={iso.key}
              type="button"
              onClick={() => setInspectedIsoIdx4_3(i)}
              className={`px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-semibold min-h-[40px] ${
                inspectedIsoIdx4_3 === i
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-700 bg-[#080D16] text-slate-300 hover:border-slate-500'
              }`}
            >
              {iso.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSymmetryMode4_3((v) => !v)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold min-h-[40px] transition-colors ${
            symmetryMode4_3
              ? 'border-teal-400 bg-teal-500/20 text-teal-200'
              : 'border-slate-700 bg-[#080D16] text-slate-200 hover:border-teal-500/50'
          }`}
        >
          <ScanEye className="w-4 h-4" />
          Szimmetriavizsgálati mód {symmetryMode4_3 ? '(aktív)' : ''}
        </button>
      </div>

      {/* Symmetry inspection toolbar */}
      {symmetryMode4_3 && (
        <div className="rounded-xl border border-teal-500/40 bg-teal-950/20 p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-teal-200 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" />
                  Konformáció forgatása a C2–C3 egyszeres kötés körül:
                </span>
                <span className="font-mono-tabular text-teal-300">{conformationAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={15}
                value={conformationAngle}
                onChange={(e) => setConformationAngle(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setConformationAngle(0)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                    conformationAngle === 0
                      ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                      : 'border-slate-700 bg-[#080D16] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  0° – Cikkcakk (nyújtott)
                </button>
                <button
                  type="button"
                  onClick={() => setConformationAngle(180)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                    conformationAngle === 180
                      ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                      : 'border-slate-700 bg-[#080D16] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  180° – U-konformáció (Fischer-nézet)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMirrorCopy((v) => !v)}
              className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold min-h-[42px] shrink-0 ${
                showMirrorCopy
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-700 bg-[#080D16] text-slate-200 hover:border-cyan-500/50'
              }`}
            >
              {showMirrorCopy ? 'Tükörkép bezárása' : 'Tükörkép megjelenítése mellette'}
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed border-t border-teal-500/20 pt-2">
            Figyelem: <strong className="text-white">0° cikkcakk</strong> állásban a két elülső vagy két hátsó –OH csoport (A és C) még királis enantiomereket jelent! A belső tükörszimmetria ellenőrzéséhez kapcsold be a <strong className="text-teal-200">180° – U-konformáció (Fischer-nézet)</strong> állást: ebben csak a valódi mezovegyületben kerül mindkét –OH ugyanarra az oldalra.
          </p>
        </div>
      )}

      {/* 3D Viewport(s) */}
      <div className={`grid gap-3 ${mirrorPreviewMol ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <MoleculeViewer
          molecule={displayedMol4_3}
          label={selectedIso.label}
          sublabel={
            isCompleted4_3 &&
            selectedIso.key === expectedMesoKey &&
            symmetryMode4_3 &&
            conformationAngle === 180
              ? 'Belső szimmetriasík (σ) feltárva'
              : 'C₄H₁₀O₄ · forgatható 3D modell'
          }
          showSymmetryPlane={
            isCompleted4_3 &&
            selectedIso.key === expectedMesoKey &&
            symmetryMode4_3 &&
            conformationAngle === 180
          }
          keepChiralHydrogens={true}
          heightClass="h-[310px] sm:h-[360px]"
        />
        {mirrorPreviewMol && (
          <MoleculeViewer
            molecule={mirrorPreviewMol}
            label={`${selectedIso.label} – Tükörkép`}
            sublabel="Ellenőrizd, fedésbe hozható-e az eredetivel!"
            keepChiralHydrogens={true}
            heightClass="h-[310px] sm:h-[360px]"
          />
        )}
      </div>

      {/* Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3.5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-cyan-300">
              1. Melyik két izomer alkot enantiomerpárt? (Jelölj ki kettőt – a sorrend mindegy!)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {isomers4_3.map((iso) => {
                const picked = enantPair4_3.includes(iso.key);
                return (
                  <button
                    key={iso.key}
                    type="button"
                    disabled={isCompleted4_3}
                    onClick={() => toggleEnantPick4_3(iso.key)}
                    className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs sm:text-sm font-medium min-h-[44px] ${
                      picked
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                        : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {picked && <Check className="w-3.5 h-3.5" />}
                    {iso.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-cyan-300">
              2. Melyik a mezovegyület?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {isomers4_3.map((iso) => (
                <button
                  key={iso.key}
                  type="button"
                  disabled={isCompleted4_3}
                  onClick={() => {
                    setMesoChoice(iso.key);
                    setErrors((p) => ({ ...p, '4.3': null }));
                  }}
                  className={`py-2.5 rounded-lg border text-xs sm:text-sm font-medium min-h-[44px] ${
                    mesoChoice === iso.key
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {iso.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-cyan-300">
              3. Mely párok állnak diasztereomer-viszonyban egymással?
            </p>
            <div className="space-y-2">
              {[
                { id: 'AC_only', label: 'Csak az A és C izomer diasztereomer.' },
                { id: 'AB_BC', label: 'Az A–B és a B–C párok (a mezovegyület és az enantiomerpár tagjai).' },
                { id: 'none', label: 'Egyik sem, mert mindhárom azonos összegképletű.' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isCompleted4_3}
                  onClick={() => {
                    setDiastChoice(opt.id);
                    setErrors((p) => ({ ...p, '4.3': null }));
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm min-h-[44px] ${
                    diastChoice === opt.id
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
            4. Miért optikailag inaktív a mezovegyület, annak ellenére, hogy aszimmetrikus szénatomokat tartalmaz? (Jelöld be mind a 3 igaz állítást!)
          </p>
          {MESO_REASONS_4_3.map((item) => {
            const checked = mesoReasons.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={isCompleted4_3}
                onClick={() => toggleMesoReason(item.id)}
                className={`w-full flex items-start gap-2.5 text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors min-h-[44px] ${
                  checked
                    ? 'border-teal-400 bg-teal-500/15 text-teal-100'
                    : 'border-slate-800 bg-[#080D16] text-slate-300 hover:border-slate-600'
                }`}
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked
                      ? 'border-teal-400 bg-teal-500 text-slate-950'
                      : 'border-slate-600 bg-transparent'
                  }`}
                >
                  {checked && <Check className="w-3 h-3" />}
                </span>
                <span>{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ChallengeFeedbackPanel
        challengeId="4.3"
        result={currentResult}
        attempts={currentAttempts}
        usedHint={currentUsedHint}
        hintText="Kapcsold be a Szimmetriavizsgálati módot, válaszd ki az Izomer B-t, és húzd a C2–C3 konformációs csúszkát 180°-ra! Így a két –CH₂OH és a két –OH csoport egymás tükörképeként áll szemben a molekula felezősíkjára nézve. A 4. kérdésben mindhárom a mezovegyület belső szimmetriájára és akiralitására vonatkozó állítás igaz."
        showHint={currentShowHint}
        onRequestHint={handleRequestHint}
        errorMessage={currentError}
        successMessage="Kiváló! Az Izomer B a mezo-eritrit: láthatod a 3D modellben megjelenő belső szimmetriasíkot (σ), amely megfelezi a molekulát. Az A és C izomerek egymás tükörképei (enantiomerek), míg mindkettő diasztereomer-viszonyban áll a mezo-formával."
        onCheck={check4_3}
        onNext={onFinishLevel}
        nextLabel="Részleg lezárása"
      />
    </div>
  );
};
