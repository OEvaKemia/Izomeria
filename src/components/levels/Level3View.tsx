import React, { useState } from 'react';
import { Crosshair, FlipHorizontal2 } from 'lucide-react';
import type { ChallengeId, ChallengeResult } from '../../types/chemistry';
import {
  IBUPROFEN,
  LIMONEN_A,
  LIMONEN_B,
  NAPROXEN_A,
  NAPROXEN_B,
  TEJSAV_A,
  TEJSAV_B,
} from '../../data/molecules';
import { MoleculeViewer } from '../MoleculeViewer';
import { DualMoleculeComparator } from '../DualMoleculeComparator';
import { ChallengeFeedbackPanel, computeChallengeScore } from '../ChallengeShell';

interface Level3ViewProps {
  activeChallengeId: ChallengeId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  onCompleteChallenge: (result: ChallengeResult) => void;
  onNextChallenge: () => void;
  onFinishLevel: () => void;
}

const SMELL_REASONS_3_1 = [
  {
    id: 'chiral_receptors',
    text: 'Az emberi szaglóreceptorok maguk is aszimmetrikus térszerkezetű fehérjék, így másként lépnek kölcsönhatásba a két tükörképi molekulával.',
    correct: true,
  },
  {
    id: 'different_formula',
    text: 'A két molekula összegképlete eltér, ezért eltérő illatanyagként érzékeljük őket.',
    correct: false,
  },
  {
    id: 'different_shape_fit',
    text: 'A két enantiomer ugyanazokat a kötéseket tartalmazza, de térbeli illeszkedésük a receptorokhoz eltérő (mint a jobb és bal kéz a kesztyűben).',
    correct: true,
  },
  {
    id: 'double_bond_cis_trans',
    text: 'Az illatkülönbséget a gyűrűben lévő kettős kötés cisz–transz átrendeződése okozza.',
    correct: false,
  },
];

const PHARMA_REASONS_3_3 = [
  {
    id: 'enzyme_fit',
    text: 'A gyógyszermolekulák térben illeszkednek a szervezet enzimjeihez és receptoraihoz, ezért gyakran csak az egyik enantiomer fejt ki kívánt hatást.',
    correct: true,
  },
  {
    id: 'side_effect',
    text: 'A tükörképi pár eltérő kölcsönhatásba léphet más receptorokkal, így hatástalan lehet vagy akár nem kívánt mellékhatást okozhat.',
    correct: true,
  },
  {
    id: 'same_effect',
    text: 'Mivel az enantiomerek olvadáspontja és összegképlete azonos, az élő szervezetben is mindig pontosan ugyanúgy hatnak.',
    correct: false,
  },
  {
    id: 'molar_mass',
    text: 'A két enantiomer moláris tömege eltér egymástól, ezért eltérő sebességgel szívódnak fel.',
    correct: false,
  },
];

export const Level3View: React.FC<Level3ViewProps> = ({
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

  // 3.1 Limonén
  const [selectedAtom3_1, setSelectedAtom3_1] = useState<string | null>(null);
  const [isomerCount3_1, setIsomerCount3_1] = useState<string>('');
  const [mirrorCreated3_1, setMirrorCreated3_1] = useState(false);
  const [reasons3_1, setReasons3_1] = useState<string[]>([]);

  // 3.2 Tejsav
  const [relation3_2, setRelation3_2] = useState<string | null>(null);

  // 3.3 Naproxén
  const [selectedAtom3_3, setSelectedAtom3_3] = useState<string | null>(null);
  const [isomerCount3_3, setIsomerCount3_3] = useState<string>('');
  const [mirrorCreated3_3, setMirrorCreated3_3] = useState(false);
  const [reasons3_3, setReasons3_3] = useState<string[]>([]);

  // 3.4 Izomerek vagy nem?
  const [isomerDecision3_4, setIsomerDecision3_4] = useState<string | null>(null);
  const [reason3_4, setReason3_4] = useState<string | null>(null);

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

  // ---------------- 3.1 LIMONÉN ----------------
  if (activeChallengeId === '3.1') {
    const toggleReason = (id: string) => {
      if (currentResult?.completed) return;
      setReasons3_1((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    };

    const check3_1 = () => {
      if (!selectedAtom3_1) {
        recordFail('Jelöld ki a 3D modellben a limonén aszimmetrikus szénatomját!');
        return;
      }
      if (selectedAtom3_1 !== 'C4') {
        recordFail(
          'A kijelölt atom nem aszimmetrikus szénatom! Keress olyan szénatomot, amelyhez négy különböző atom vagy atomcsoport kapcsolódik (használd a „Kapcsolódó csoportok” gombot az ellenőrzéshez).',
        );
        return;
      }
      if (isomerCount3_1 !== '2') {
        recordFail('Egy aszimmetrikus szénatomot tartalmazó molekulának hány optikai izomerje létezik?');
        return;
      }
      if (!mirrorCreated3_1) {
        recordFail('Hozd létre a másik enantiomer térszerkezetét is a tükörképi összehasonlításhoz!');
        return;
      }
      const correctIds = SMELL_REASONS_3_1.filter((r) => r.correct).map((r) => r.id);
      const exact =
        reasons3_1.length === correctIds.length &&
        correctIds.every((id) => reasons3_1.includes(id));
      if (!exact) {
        recordFail(
          'Ellenőrizd az illatérzet magyarázatát! Gondolj arra, hogyan ismeri fel a szervezet a térbeli molekulákat.',
        );
        return;
      }
      recordSuccess();
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            3.1. A citrusok titka – limonén
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            A limonén (C₁₀H₁₆) egyik tükörképi változata narancs-, a másik citromillatú. Keresd meg a 3D modellben az aszimmetrikus szénatomot (a hozzá kapcsolódó H-atom akkor is látható marad, ha a többi H-t elrejted!), hozd létre a tükörképi enantiomert, és magyarázd meg az eltérő illatot!
          </p>
        </div>

        {!mirrorCreated3_1 ? (
          <MoleculeViewer
            molecule={LIMONEN_A}
            label="Limonén – kiindulási enantiomer"
            sublabel="C₁₀H₁₆ · kattints az aszimmetrikus szénatomra!"
            selectable={!currentResult?.completed}
            selectedAtomIds={selectedAtom3_1 ? [selectedAtom3_1] : []}
            onSelectAtom={(id) => {
              setSelectedAtom3_1(id);
              setErrors((p) => ({ ...p, '3.1': null }));
            }}
            keepChiralHydrogens={true}
            extraControls={
              <button
                type="button"
                onClick={() => setMirrorCreated3_1(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/30 transition-colors min-h-[36px]"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
                Másik enantiomer (tükörkép) létrehozása
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            <DualMoleculeComparator
              leftMolecule={LIMONEN_A}
              rightMolecule={LIMONEN_B}
              leftLabel="Limonén (A enantiomer)"
              rightLabel="Limonén (B tükörképi enantiomer)"
              selectableLeft={!currentResult?.completed}
              selectedLeftAtomIds={selectedAtom3_1 ? [selectedAtom3_1] : []}
              onSelectLeftAtom={(id) => setSelectedAtom3_1(id)}
              allowMirrorPlaneToggle={true}
              keepChiralHydrogens={true}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4" />
                1. Aszimmetrikus szénatom a 3D modellben:
              </span>
              <span className="font-mono-tabular text-white">
                {selectedAtom3_1 || 'Nincs kijelölve'}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-cyan-300">
                2. Hány optikai izomerje van a limonénnek?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {['1', '2', '3', '4'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={Boolean(currentResult?.completed)}
                    onClick={() => setIsomerCount3_1(n)}
                    className={`py-2.5 rounded-lg border font-mono-tabular text-sm font-semibold min-h-[44px] ${
                      isomerCount3_1 === n
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                        : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {!mirrorCreated3_1 && (
              <button
                type="button"
                onClick={() => setMirrorCreated3_1(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-500/10 text-cyan-200 text-sm font-semibold hover:bg-cyan-500/20 min-h-[44px]"
              >
                <FlipHorizontal2 className="w-4 h-4" />
                Tükörképi enantiomer létrehozása
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2">
            <p className="text-xs font-semibold text-cyan-300">
              3. Miért vált ki eltérő illatérzetet a két enantiomer? (Válaszd ki a helyes indokokat!)
            </p>
            {SMELL_REASONS_3_1.map((item) => {
              const active = reasons3_1.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
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

        <ChallengeFeedbackPanel
          challengeId="3.1"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="A gyűrűben keresd azt az egyetlen szénatomot, amelyik nem kettős kötésben áll, nincs rajta két H-atom, és az egyik ágon a gyűrű kettős kötése felé, a másikon a telített ág felé halad, emellett egy elágazó csoport és egy H-atom kapcsolódik hozzá!"
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Pontos! A limonén C4 szénatomja aszimmetrikus, ezért két optikai izomerje (enantiomer párja) létezik. Bár fizikai adataik többsége azonos, aszimmetrikus szaglóreceptoraink eltérő módon érzékelik a két tükörképi alakot."
          onCheck={check3_1}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 3.2 TEJSAV ----------------
  if (activeChallengeId === '3.2') {
    const check3_2 = () => {
      if (!relation3_2) {
        recordFail('Válaszd ki a két tejsavmolekula közötti izomériaviszonyt!');
        return;
      }
      if (relation3_2 !== 'enantiomers') {
        recordFail(
          'Próbáld meg a „Fedésbe hozási próba” módban elforgatni a B molekulát! Ha két csoportot fedésbe hozol az aszimmetrikus szénatom körül, a másik kettő mindig felcserélődik.',
        );
        return;
      }
      recordSuccess();
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            3.2. A tejsav két változata
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Forgasd egymástól függetlenül a tejsav (C₃H₆O₃) két 3D-s modelljét, majd a <strong className="text-white">Fedésbe hozási próba</strong> segítségével ellenőrizd, hogy bármilyen térbeli forgatással tökéletes átfedésbe hozhatók-e!
          </p>
        </div>

        <DualMoleculeComparator
          leftMolecule={TEJSAV_A}
          rightMolecule={TEJSAV_B}
          leftLabel="Tejsav – A minta"
          rightLabel="Tejsav – B minta"
          allowOverlayAttempt={true}
          allowMirrorPlaneToggle={true}
          keepChiralHydrogens={true}
        />

        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
          <p className="text-xs font-semibold text-cyan-300">
            Milyen viszonyban áll egymással a tejsav két térszerkezeti változata?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                id: 'identical',
                label: 'Azonos molekulák: megfelelő 3D elforgatással tökéletesen fedésbe hozhatók.',
              },
              {
                id: 'enantiomers',
                label: 'Optikai izomerek (enantiomerek): egymás nem fedésbe hozható tükörképei.',
              },
              {
                id: 'cis_trans',
                label: 'Geometriai (cisz–transz) izomerek.',
              },
              {
                id: 'constitutional',
                label: 'Szerkezeti izomerek, mert az atomok kapcsolódási sorrendje eltérő.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setRelation3_2(opt.id)}
                className={`text-left px-4 py-3 rounded-xl border text-xs sm:text-sm transition-colors min-h-[48px] ${
                  relation3_2 === opt.id
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="3.2"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="A központi C2 atomhoz négy különböző csoport kapcsolódik: –H, –OH, –CH₃ és –COOH. Ha az Y tengely körül 180°-kal elforgatod a B molekulát és egymásra csúsztatod őket, láthatod, hogy míg a –CH₃ és –COOH fedésbe kerülhet, az –OH és a –H pontosan ellentétes irányba mutat!"
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Helyes! A tejsav két változata azonos kapcsolódású, egymás tükörképe, de semmilyen térbeli elforgatással sem hozhatók fedésbe – vagyis egy enantiomerpárt alkotnak."
          onCheck={check3_2}
          checkDisabled={!relation3_2}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 3.3 NAPROXÉN ----------------
  if (activeChallengeId === '3.3') {
    const toggleReason = (id: string) => {
      if (currentResult?.completed) return;
      setReasons3_3((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    };

    const check3_3 = () => {
      if (!selectedAtom3_3) {
        recordFail('Kattints a naproxén 3D modelljében az aszimmetrikus szénatomra!');
        return;
      }
      if (selectedAtom3_3 !== 'C_chiral') {
        recordFail(
          'Ez a szénatom nem rendelkezik négy különböző kapcsolódó csoporttal! Vizsgáld meg a naftalingyűrűhöz kapcsolódó oldallánc elágazását (ahol a –COOH, a –CH₃ és a –H is kapcsolódik).',
        );
        return;
      }
      if (isomerCount3_3 !== '2') {
        recordFail('Egyetlen aszimmetrikus szénatom esetén hány enantiomer létezik?');
        return;
      }
      if (!mirrorCreated3_3) {
        recordFail('Jelenítsd meg a naproxén tükörképi párját is az ellenőrzés előtt!');
        return;
      }
      const correctIds = PHARMA_REASONS_3_3.filter((r) => r.correct).map((r) => r.id);
      const exact =
        reasons3_3.length === correctIds.length &&
        correctIds.every((id) => reasons3_3.includes(id));
      if (!exact) {
        recordFail('Vizsgáld meg újra, miért döntő a térszerkezet a gyógyszerek biológiai hatásában!');
        return;
      }
      recordSuccess();
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            3.3. A gyógyszermolekula – naproxén
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            A naproxén (C₁₄H₁₄O₃) ismert fájdalomcsillapító és gyulladáscsökkentő hatóanyag, amelyből gyógyszerként csak az egyik enantiomert alkalmazzák. Jelöld ki az aszimmetrikus szénatomot, hozd létre a tükörképi párt, és indokold meg a térszerkezet jelentőségét!
          </p>
        </div>

        {!mirrorCreated3_3 ? (
          <MoleculeViewer
            molecule={NAPROXEN_A}
            label="Naproxén"
            sublabel="C₁₄H₁₄O₃ · jelöld ki az aszimmetrikus szénatomot!"
            selectable={!currentResult?.completed}
            selectedAtomIds={selectedAtom3_3 ? [selectedAtom3_3] : []}
            onSelectAtom={(id) => {
              setSelectedAtom3_3(id);
              setErrors((p) => ({ ...p, '3.3': null }));
            }}
            keepChiralHydrogens={true}
            extraControls={
              <button
                type="button"
                onClick={() => setMirrorCreated3_3(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/30 transition-colors min-h-[36px]"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
                Tükörképi pár megjelenítése
              </button>
            }
          />
        ) : (
          <DualMoleculeComparator
            leftMolecule={NAPROXEN_A}
            rightMolecule={NAPROXEN_B}
            leftLabel="Naproxén – A enantiomer"
            rightLabel="Naproxén – B tükörképi pár"
            selectableLeft={!currentResult?.completed}
            selectedLeftAtomIds={selectedAtom3_3 ? [selectedAtom3_3] : []}
            onSelectLeftAtom={(id) => setSelectedAtom3_3(id)}
            allowMirrorPlaneToggle={true}
            keepChiralHydrogens={true}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300">
                1. Kijelölt aszimmetrikus szénatom:
              </span>
              <span className="font-mono-tabular text-white">
                {selectedAtom3_3 || 'Nincs kijelölve'}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-cyan-300">
                2. Az enantiomerek száma:
              </p>
              <div className="grid grid-cols-4 gap-2">
                {['1', '2', '4', '6'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={Boolean(currentResult?.completed)}
                    onClick={() => setIsomerCount3_3(n)}
                    className={`py-2.5 rounded-lg border font-mono-tabular text-sm font-semibold min-h-[44px] ${
                      isomerCount3_3 === n
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                        : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {!mirrorCreated3_3 && (
              <button
                type="button"
                onClick={() => setMirrorCreated3_3(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-500/10 text-cyan-200 text-sm font-semibold hover:bg-cyan-500/20 min-h-[44px]"
              >
                <FlipHorizontal2 className="w-4 h-4" />
                Tükörképi pár megjelenítése
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2">
            <p className="text-xs font-semibold text-cyan-300">
              3. Miért meghatározó a térszerkezet a gyógyszer biológiai hatásában?
            </p>
            {PHARMA_REASONS_3_3.map((item) => {
              const active = reasons3_3.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
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

        <ChallengeFeedbackPanel
          challengeId="3.3"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="A kettős aromás gyűrűrendszer (naftalin) egyik végén metoxicsoport (–OCH₃), a másik végén propánsav-oldallánc található. Ennek az oldalláncnak a középső szénatomja kapcsolódik egyszerre a gyűrűhöz, a –COOH csoporthoz, a –CH₃ csoporthoz és egy H-atomhoz!"
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Pontos! A naproxén csak az egyik enantiomer formájában fejti ki biztonságosan a gyulladáscsökkentő hatását, mert a célfehérje kötőhelye térszerkezetileg szelektív."
          onCheck={check3_3}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 3.4 IZOMEREK VAGY NEM? ----------------
  const check3_4 = () => {
    if (!isomerDecision3_4 || !reason3_4) {
      recordFail('Válaszolj mindkét kérdésre az összehasonlítás alapján!');
      return;
    }
    if (isomerDecision3_4 !== 'no') {
      recordFail(
        'Hasonlítsd össze alaposan a két molekula összegképletét és szénvázát! Az egyikben két összeépült gyűrű (naftalin) és 3 oxigénatom van, a másikban egy gyűrű és 2 oxigénatom.',
      );
      return;
    }
    if (reason3_4 !== 'diff_formula') {
      recordFail('A válaszod iránya jó, de pontosítsd a kémiai indoklást az összegképletek alapján!');
      return;
    }
    recordSuccess();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
          3.4. Izomerek vagy nem?
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Hasonlítsd össze a naproxén és az ibuprofén 3D-s szerkezetét és összegképletét! Lehet-e a két gyógyszerhatóanyag egymás izomerje?
        </p>
      </div>

      <DualMoleculeComparator
        leftMolecule={NAPROXEN_A}
        rightMolecule={IBUPROFEN}
        leftLabel="Naproxén"
        rightLabel="Ibuprofén"
        leftSublabel="C₁₄H₁₄O₃"
        rightSublabel="C₁₃H₁₈O₂"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
          <p className="text-xs font-semibold text-cyan-300">
            1. Egymás izomerjei a naproxén és az ibuprofén?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'yes', label: 'Igen, egymás izomerjei' },
              { id: 'no', label: 'Nem, nem izomerjei egymásnak' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setIsomerDecision3_4(opt.id)}
                className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium min-h-[44px] ${
                  isomerDecision3_4 === opt.id
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                    : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2">
          <p className="text-xs font-semibold text-cyan-300">
            2. Indoklás az összegképletek alapján:
          </p>
          {[
            {
              id: 'same_group',
              label: 'Mindkettő tartalmaz karboxilcsoportot és aszimmetrikus szénatomot, ezért szerkezeti izomerek.',
            },
            {
              id: 'diff_formula',
              label: 'Összegképletük eltérő (C₁₄H₁₄O₃ vs. C₁₃H₁₈O₂), az izoméria alapfeltétele pedig az azonos összegképlet.',
            },
            {
              id: 'diff_chirality',
              label: 'Az egyik molekula optikailag aktív, a másik akirális, ezért nem lehetnek izomerek.',
            },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={Boolean(currentResult?.completed)}
              onClick={() => setReason3_4(opt.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm min-h-[44px] ${
                reason3_4 === opt.id
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                  : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ChallengeFeedbackPanel
        challengeId="3.4"
        result={currentResult}
        attempts={currentAttempts}
        usedHint={currentUsedHint}
        hintText="Nézd meg az összegképleteket: a naproxén 14 szén-, 14 hidrogén- és 3 oxigénatomot tartalmaz (C₁₄H₁₄O₃), míg az ibuprofén 13 szén-, 18 hidrogén- és 2 oxigénatomot (C₁₃H₁₈O₂)."
        showHint={currentShowHint}
        onRequestHint={handleRequestHint}
        errorMessage={currentError}
        successMessage="Pontos! Bár mindkettő aszimmetrikus szénatomot tartalmazó propánsav-származék, eltérő az összegképletük (C₁₄H₁₄O₃ ≠ C₁₃H₁₈O₂), ezért sem szerkezeti, sem térizomerjei nem lehetnek egymásnak."
        onCheck={check3_4}
        onNext={onFinishLevel}
        nextLabel="Részleg lezárása"
      />
    </div>
  );
};
