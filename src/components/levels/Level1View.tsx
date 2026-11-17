import React, { useMemo, useState } from 'react';
import { Link2, Unlink, Check, AlertTriangle } from 'lucide-react';
import type { ChallengeId, ChallengeResult, MoleculeData } from '../../types/chemistry';
import {
  BUTANSAV,
  BUTAN_1_OL,
  BUTAN_2_OL,
  DIMETILBUTAN_2_2,
  HEXAN,
  KLORPROPAN_1,
  KLORPROPAN_2,
  METILPROPANSAV_2,
  METILPROPAN_1_OL,
  METIL_ACETAT,
  PROPANAL,
  PROPANSAV,
  PROPANON,
  PROP_2_EN_1_OL,
} from '../../data/molecules';
import { STRUCTURAL_TYPE_LABELS, type StructuralIsomerismType } from '../../data/challenges';
import { MoleculeViewer } from '../MoleculeViewer';
import { DualMoleculeComparator } from '../DualMoleculeComparator';
import { ChallengeFeedbackPanel, computeChallengeScore } from '../ChallengeShell';

interface Level1ViewProps {
  activeChallengeId: ChallengeId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  onCompleteChallenge: (result: ChallengeResult) => void;
  onNextChallenge: () => void;
  onFinishLevel: () => void;
}

const PAIR_MOLECULES: MoleculeData[] = [
  HEXAN,
  KLORPROPAN_2,
  PROPANAL,
  DIMETILBUTAN_2_2,
  PROPANON,
  KLORPROPAN_1,
];

const TRUE_PAIRS: [string, string][] = [
  ['hexan', 'dimetilbutan_2_2'],
  ['klorpropan_1', 'klorpropan_2'],
  ['propanal', 'propanon'],
];

function isSamePair(a: string, b: string, target: [string, string]) {
  return (a === target[0] && b === target[1]) || (a === target[1] && b === target[0]);
}

export const Level1View: React.FC<Level1ViewProps> = ({
  activeChallengeId,
  results,
  onCompleteChallenge,
  onNextChallenge,
  onFinishLevel,
}) => {
  // Per-challenge interaction state
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [usedHints, setUsedHints] = useState<Record<string, boolean>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  // 1.1 State: pairing
  const [inspectedMolId, setInspectedMolId] = useState<string>(PAIR_MOLECULES[0].id);
  const [selectedForPair, setSelectedForPair] = useState<string | null>(null);
  const [pairs, setPairs] = useState<[string, string][]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 1.2 State
  const [selectedIsomerType, setSelectedIsomerType] = useState<
    Record<string, StructuralIsomerismType | null>
  >({});

  // 1.3 State
  const [faultField, setFaultField] = useState<Record<string, string | null>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<Record<string, string | null>>({});
  const [previewVariantId, setPreviewVariantId] = useState<Record<string, string>>({
    '1.3a': 'butan_1_ol',
    '1.3b': 'propanal',
  });

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

  // ---------------- 1.1: IZOMERPÁROK KERESÉSE ----------------
  const pairedMap = useMemo(() => {
    const map = new Map<string, number>();
    pairs.forEach(([a, b], idx) => {
      map.set(a, idx);
      map.set(b, idx);
    });
    return map;
  }, [pairs]);

  const inspectedMolecule = useMemo(
    () => PAIR_MOLECULES.find((m) => m.id === inspectedMolId) || PAIR_MOLECULES[0],
    [inspectedMolId],
  );

  const pairTwoMolecules = (idA: string, idB: string) => {
    if (idA === idB || currentResult?.completed) return;
    // Remove any existing pair containing idA or idB
    const filtered = pairs.filter(
      ([a, b]) => a !== idA && b !== idA && a !== idB && b !== idB,
    );
    setPairs([...filtered, [idA, idB]]);
    setSelectedForPair(null);
    setErrors((p) => ({ ...p, '1.1': null }));
  };

  const handleCardTap = (id: string) => {
    setInspectedMolId(id);
    if (currentResult?.completed) return;
    if (pairedMap.has(id)) return;
    if (!selectedForPair) {
      setSelectedForPair(id);
    } else if (selectedForPair === id) {
      setSelectedForPair(null);
    } else {
      pairTwoMolecules(selectedForPair, id);
    }
  };

  const removePair = (pairIndex: number) => {
    if (currentResult?.completed) return;
    setPairs(pairs.filter((_, i) => i !== pairIndex));
  };

  const check1_1 = () => {
    if (pairs.length < 3) {
      recordFail('Mind a hat molekulát párosítsd három izomerpárba az ellenőrzés előtt!');
      return;
    }
    const allMatch = TRUE_PAIRS.every((tp) =>
      pairs.some(([a, b]) => isSamePair(a, b, tp)),
    );
    if (allMatch) {
      recordSuccess();
    } else {
      recordFail(
        'Legalább egyik pár tagjainak nem egyezik meg az összegképlete (vagy a szén-, hidrogén-, klór- és oxigénatomok száma). Forgasd meg a 3D modelleket és hasonlítsd össze az atomszámokat!',
      );
    }
  };

  if (activeChallengeId === '1.1') {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            1.1. Izomerpárok keresése
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Vizsgáld meg a hat összekeveredett molekulát 3D-ben, és párosítsd az azonos összegképletű, de eltérő szerkezetű vegyületeket! Húzd az egyik kártyát a másikra, vagy érintsd meg egymás után a pár két tagját.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: 6 molecule cards + formed pairs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {PAIR_MOLECULES.map((mol) => {
                const pairIdx = pairedMap.get(mol.id);
                const isPaired = pairIdx !== undefined;
                const isSelected = selectedForPair === mol.id;
                const isInspected = inspectedMolId === mol.id;

                return (
                  <div
                    key={mol.id}
                    draggable={!isPaired && !currentResult?.completed}
                    onDragStart={() => setDraggedId(mol.id)}
                    onDragOver={(e) => {
                      if (!isPaired) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (draggedId && draggedId !== mol.id && !isPaired) {
                        pairTwoMolecules(draggedId, mol.id);
                        setDraggedId(null);
                      }
                    }}
                    onClick={() => handleCardTap(mol.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardTap(mol.id);
                      }
                    }}
                    className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors min-h-[54px] ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/15'
                        : isPaired
                          ? 'border-teal-500/40 bg-teal-950/20 opacity-75'
                          : isInspected
                            ? 'border-slate-500 bg-[#131F35]'
                            : 'border-slate-800 bg-[#0D1526] hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-slate-100 truncate">
                        {mol.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {isPaired
                          ? `${pairIdx! + 1}. párba sorolva`
                          : isSelected
                            ? 'Válaszd ki a párját!'
                            : 'Kattints a 3D vizsgálathoz / párosításhoz'}
                      </div>
                    </div>
                    <span className="text-xs font-mono-tabular text-cyan-300 shrink-0">
                      {isInspected ? '3D aktív' : 'Vizsgálat'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Formed pairs summary */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Összeállított párok ({pairs.length}/3)</span>
                <span>Kattints a bontáshoz</span>
              </div>
              {pairs.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  Még nincs kijelölt pár. Válassz két molekulát a fenti listából!
                </p>
              ) : (
                <div className="space-y-2">
                  {pairs.map(([idA, idB], idx) => {
                    const mA = PAIR_MOLECULES.find((m) => m.id === idA)!;
                    const mB = PAIR_MOLECULES.find((m) => m.id === idB)!;
                    return (
                      <div
                        key={`${idA}-${idB}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#111C31] border border-slate-700/70 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-slate-100 truncate">
                            {mA.name} ↔ {mB.name}
                          </span>
                        </div>
                        {!currentResult?.completed && (
                          <button
                            type="button"
                            onClick={() => removePair(idx)}
                            className="text-slate-400 hover:text-rose-300 p-1 shrink-0"
                            aria-label="Pár szétválasztása"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: 3D Molecule Inspector */}
          <div className="lg:col-span-7">
            <MoleculeViewer
              molecule={inspectedMolecule}
              label={inspectedMolecule.name}
              sublabel="3D előnézet · számold meg az atomokat és vizsgáld a kötéseket"
              heightClass="h-[320px] sm:h-[380px] lg:h-[420px]"
            />
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="1.1"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="Figyeld meg a 3D modellben a különböző színű atomokat (szürke: C, fehér: H, piros: O, zöld: Cl). Az egy párba tartozó molekulákban minden elemből pontosan ugyanannyi atom van: egy C₆H₁₄ láncizomer pár, egy C₃H₇Cl helyzeti izomer pár és egy C₃H₆O funkcióscsoport-izomer pár alkotja a hatost."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Mindhárom izomerpár pontos: Hexán ↔ 2,2-dimetilbután (C₆H₁₄, láncizoméria), 1-klórpropán ↔ 2-klórpropán (C₃H₇Cl, helyzeti izoméria), valamint Propanal ↔ Propanon (C₃H₆O, funkcióscsoport-izoméria)."
          onCheck={check1_1}
          checkDisabled={pairs.length < 3}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 1.2: MI VÁLTOZOTT MEG? ----------------
  const level1_2Cases: Record<
    string,
    {
      left: MoleculeData;
      right: MoleculeData;
      correct: StructuralIsomerismType;
      options: { id: StructuralIsomerismType; label: string }[];
      hint: string;
      explanation: string;
    }
  > = {
    '1.2a': {
      left: BUTANSAV,
      right: METILPROPANSAV_2,
      correct: 'chain',
      options: [
        { id: 'positional', label: STRUCTURAL_TYPE_LABELS.positional },
        { id: 'chain', label: STRUCTURAL_TYPE_LABELS.chain },
        { id: 'functional', label: STRUCTURAL_TYPE_LABELS.functional },
      ],
      hint: 'Nézd meg a piros oxigénatomokat tartalmazó csoportot: mindkét molekulában karboxilcsoport (–COOH) van. Mi változott akkor a négy szénatomos molekularészletben?',
      explanation:
        'Mindkét vegyület karbonsav (C₄H₈O₂), azaz a funkciós csoport azonos (–COOH). A különbség a szénváz elágazásában van: a butánsav lánca egyenes, míg a 2-metilpropánsavé elágazó → láncizoméria.',
    },
    '1.2b': {
      left: BUTAN_1_OL,
      right: BUTAN_2_OL,
      correct: 'positional',
      options: [
        { id: 'functional', label: STRUCTURAL_TYPE_LABELS.functional },
        { id: 'chain', label: STRUCTURAL_TYPE_LABELS.chain },
        { id: 'positional', label: STRUCTURAL_TYPE_LABELS.positional },
      ],
      hint: 'Számold meg a szénlánc hosszát és figyeld meg, hol található a piros oxigénatomhoz kapcsolódó –OH csoport!',
      explanation:
        'Mindkét molekula elágazásmentes négy szénatomos alkohol (C₄H₁₀O). A szénváz és a hidroxilcsoport (–OH) is azonos, csupán az –OH csoport kapcsolódási helye változik (C1 vs C2) → helyzeti izoméria.',
    },
    '1.2c': {
      left: PROPANSAV,
      right: METIL_ACETAT,
      correct: 'functional',
      options: [
        { id: 'chain', label: STRUCTURAL_TYPE_LABELS.chain },
        { id: 'functional', label: STRUCTURAL_TYPE_LABELS.functional },
        { id: 'positional', label: STRUCTURAL_TYPE_LABELS.positional },
      ],
      hint: 'Figyeld meg a két piros oxigénatom elhelyezkedését: az egyik molekulában láncvégi –COOH csoportot alkotnak, a másikban azonban az egyik oxigénatom két szénatom közé ékelődik!',
      explanation:
        'Bár mindkét vegyület összegképlete C₃H₆O₂, a propánsav karbonsav (–COOH), míg a metil-acetát észter (–COO–) → eltérő funkciós csoport, vagyis funkcióscsoport-izoméria.',
    },
  };

  if (activeChallengeId in level1_2Cases) {
    const cfg = level1_2Cases[activeChallengeId];
    const picked = selectedIsomerType[activeChallengeId] || null;

    const check1_2 = () => {
      if (!picked) {
        recordFail('Válaszd ki az izoméria típusát!');
        return;
      }
      if (picked === cfg.correct) {
        recordSuccess();
      } else {
        recordFail(
          'Hasonlítsd össze a 3D modellek szénvázát és a funkciós csoportok (piros O-atomok) elhelyezkedését. Kérdezd meg magadtól: a szénlánc elágazása, a csoport helyzete vagy maga a funkciós csoport típusa változott meg?',
        );
      }
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            1.2. Mi változott meg?
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Forgasd meg és hasonlítsd össze a két 3D-s molekulát egymás mellett, majd határozd meg, milyen típusú szerkezeti izoméria áll fenn közöttük!
          </p>
        </div>

        <DualMoleculeComparator
          leftMolecule={cfg.left}
          rightMolecule={cfg.right}
          leftLabel={cfg.left.name}
          rightLabel={cfg.right.name}
          leftSublabel={cfg.left.formula}
          rightSublabel={cfg.right.formula}
        />

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400">Válaszd ki a szerkezeti izoméria típusát:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {cfg.options.map((opt) => {
              const active = picked === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
                  onClick={() =>
                    setSelectedIsomerType((p) => ({ ...p, [activeChallengeId]: opt.id }))
                  }
                  className={`px-4 py-3 rounded-xl border text-left text-sm font-medium transition-colors min-h-[48px] ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-[#0D1526] text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId={activeChallengeId}
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText={cfg.hint}
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage={cfg.explanation}
          onCheck={check1_2}
          checkDisabled={!picked}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 1.3: HIBÁS MOLEKULAADATLAP ----------------
  const level1_3Cases: Record<
    string,
    {
      displayedName: string;
      displayedFormula: string;
      corruptedModel: MoleculeData;
      variants: { id: string; label: string; mol: MoleculeData }[];
      correctField: 'name' | 'formula' | 'model';
      correctVariantId: string;
      hint: string;
      explanation: string;
    }
  > = {
    '1.3a': {
      displayedName: 'Bután-2-ol',
      displayedFormula: 'C₄H₁₀O',
      corruptedModel: BUTAN_1_OL,
      variants: [
        { id: 'butan_1_ol', label: 'A szerkezeti változat', mol: BUTAN_1_OL },
        { id: 'butan_2_ol', label: 'B szerkezeti változat', mol: BUTAN_2_OL },
        { id: 'metilpropan_1_ol', label: 'C szerkezeti változat', mol: METILPROPAN_1_OL },
      ],
      correctField: 'model',
      correctVariantId: 'butan_2_ol',
      hint: 'A név (Bután-2-ol) és az összegképlet (C₄H₁₀O) összhangban van egymással. Nézd meg viszont a 3D modellben, hanyadik szénatomhoz kapcsolódik a piros oxigénatom!',
      explanation:
        'A hibás adat a 3D-s szerkezeti modell volt: eredetileg a bután-1-ol szerkezetét töltötte be a rendszer, ahol az –OH csoport az 1-es szénatomon áll. A B változat mutatja a valódi bután-2-ol szerkezetet.',
    },
    '1.3b': {
      displayedName: 'Propanon (aceton)',
      displayedFormula: 'C₃H₆O',
      corruptedModel: PROPANAL,
      variants: [
        { id: 'propanal', label: 'A szerkezeti változat', mol: PROPANAL },
        { id: 'prop_2_en_1_ol', label: 'B szerkezeti változat', mol: PROP_2_EN_1_OL },
        { id: 'propanon', label: 'C szerkezeti változat', mol: PROPANON },
      ],
      correctField: 'model',
      correctVariantId: 'propanon',
      hint: 'A propanon keton, vagyis a C=O kettős kötés a középső szénatomon található. A betöltött 3D modellben viszont a lánc végén látható!',
      explanation:
        'Az adatlap a propanon (C₃H₆O) adatait tartalmazta, de a tévesen csatolt modell a propanal (aldehid) szerkezete volt. A C változat a helyes propanon (keton).',
    },
  };

  if (activeChallengeId in level1_3Cases) {
    const cfg = level1_3Cases[activeChallengeId];
    const pickedField = faultField[activeChallengeId] || null;
    const pickedVarId = selectedVariantId[activeChallengeId] || null;
    const activePreviewId = previewVariantId[activeChallengeId] || cfg.variants[0].id;
    const previewMol =
      cfg.variants.find((v) => v.id === activePreviewId)?.mol || cfg.corruptedModel;
    const isLastOfLevel1 = activeChallengeId === '1.3b';

    const check1_3 = () => {
      if (!pickedField || !pickedVarId) {
        recordFail('Először jelöld meg, melyik adat hibás az adatlapon, majd válaszd ki a javító 3D szerkezeti változatot!');
        return;
      }
      if (pickedField !== cfg.correctField) {
        recordFail(
          'Ellenőrizd újra a vegyület nevét és összegképletét: a megadott név és összegképlet megfelel egymásnak. A tárolt 3D modell viszont egy másik izomert ábrázol!',
        );
        return;
      }
      if (pickedVarId !== cfg.correctVariantId) {
        recordFail(
          'A kiválasztott szerkezeti változat nem egyezik az adatlapon szereplő vegyülettel. Forgasd meg mindhárom 3D változatot, és ellenőrizd a funkciós csoport helyzetét!',
        );
        return;
      }
      recordSuccess();
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            1.3. Hibás molekulaadatlap
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Az alábbi adatlap három eleme (név, összegképlet, 3D szerkezet) közül az egyik hibás. Azonosítsd a hibás adatot, majd válaszd ki a helyes 3D szerkezeti változatot!
          </p>
        </div>

        {/* Corrupted datasheet summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Sérült adatbázis-bejegyzés</span>
              </div>
              <div className="space-y-2 text-sm border-t border-slate-800 pt-3">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Vegyület neve:</span>
                  <span className="font-semibold text-white">{cfg.displayedName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Összegképlet:</span>
                  <span className="font-mono-tabular text-cyan-300">{cfg.displayedFormula}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Csatolt 3D modell:</span>
                  <span className="text-slate-200">Jobb oldali nézetben</span>
                </div>
              </div>
            </div>

            {/* Step 1: Identify corrupted field */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-300">1. Melyik adat hibás?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'name', label: 'A név' },
                  { id: 'formula', label: 'Az összegképlet' },
                  { id: 'model', label: 'A 3D modell' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    disabled={Boolean(currentResult?.completed)}
                    onClick={() => setFaultField((p) => ({ ...p, [activeChallengeId]: f.id }))}
                    className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                      pickedField === f.id
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                        : 'border-slate-800 bg-[#0D1526] text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Pick structural variant */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-300">
                2. Vizsgáld meg és válaszd ki a javított 3D modellt:
              </p>
              <div className="space-y-2">
                {cfg.variants.map((v) => {
                  const isPreviewing = activePreviewId === v.id;
                  const isChosen = pickedVarId === v.id;
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                        isChosen
                          ? 'border-cyan-400 bg-cyan-500/15'
                          : isPreviewing
                            ? 'border-slate-600 bg-[#121D33]'
                            : 'border-slate-800 bg-[#0D1526]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVariantId((p) => ({ ...p, [activeChallengeId]: v.id }))
                        }
                        className="text-left flex-1 text-sm font-medium text-slate-100 hover:text-cyan-300 px-1.5 py-1"
                      >
                        {v.label}{' '}
                        <span className="text-xs text-slate-400">
                          {isPreviewing ? '(3D-ben aktív)' : '(kattints a 3D-hez)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(currentResult?.completed)}
                        onClick={() => {
                          setPreviewVariantId((p) => ({ ...p, [activeChallengeId]: v.id }));
                          setSelectedVariantId((p) => ({ ...p, [activeChallengeId]: v.id }));
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] shrink-0 transition-colors ${
                          isChosen
                            ? 'bg-cyan-500 text-slate-950'
                            : 'border border-slate-700 text-slate-200 hover:border-cyan-500/60'
                        }`}
                      >
                        {isChosen && <Check className="w-3.5 h-3.5" />}
                        {isChosen ? 'Kiválasztva' : 'Ezt választom'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <MoleculeViewer
              molecule={previewMol}
              label={`Előnézet: ${
                cfg.variants.find((v) => v.id === activePreviewId)?.label || 'Csatolt 3D modell'
              }`}
              sublabel={cfg.displayedFormula}
              heightClass="h-[320px] sm:h-[380px] lg:h-[420px]"
            />
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId={activeChallengeId}
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText={cfg.hint}
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage={
            isLastOfLevel1
              ? `${cfg.explanation} Az első adatbázis helyreállítva.`
              : cfg.explanation
          }
          onCheck={check1_3}
          checkDisabled={!pickedField || !pickedVarId}
          onNext={isLastOfLevel1 ? onFinishLevel : onNextChallenge}
          nextLabel={isLastOfLevel1 ? 'Részleg lezárása' : 'Következő feladat'}
        />
      </div>
    );
  }

  return null;
};
