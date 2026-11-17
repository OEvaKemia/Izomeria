import React, { useState } from 'react';
import { ArrowLeftRight, Crosshair } from 'lucide-react';
import type { ChallengeId, ChallengeResult, MoleculeData } from '../../types/chemistry';
import {
  BUT_2_EN,
  CISZ_FAHEJALDEHID,
  ELAIDINSAV,
  KLORPROPEN_1,
  METILBUT_2_EN_2,
  OLAJSAV,
  TRANSZ_FAHEJALDEHID,
} from '../../data/molecules';
import { MoleculeViewer } from '../MoleculeViewer';
import { ChallengeFeedbackPanel, computeChallengeScore } from '../ChallengeShell';

interface Level2ViewProps {
  activeChallengeId: ChallengeId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  onCompleteChallenge: (result: ChallengeResult) => void;
  onNextChallenge: () => void;
  onFinishLevel: () => void;
}

const DIFF_OPTIONS_2_1 = [
  {
    id: 'diff_chain_length',
    text: 'Az olajsav 16, az elaidinsav 18 szénatomos láncból épül fel, és a kettős kötés helye is eltér.',
  },
  {
    id: 'diff_cis_trans',
    text: 'Az olajsavban a kettős kötéshez kapcsolódó két szénláncrész azonos oldalon (cisz), az elaidinsavban ellentétes oldalon (transz) helyezkedik el.',
  },
  {
    id: 'diff_ring',
    text: 'Az olajsav gyűrűs szerkezetű karbonsav, míg az elaidinsav nyílt láncú vegyület.',
  },
  {
    id: 'diff_chiral',
    text: 'A különbséget a két molekulában lévő aszimmetrikus szénatomok ellentétes térbeli elrendeződése okozza.',
  },
];

export const Level2View: React.FC<Level2ViewProps> = ({
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

  // 2.1 state (Left A = OLAJSAV cis, Right B = ELAIDINSAV trans)
  const [cisChoice2_1, setCisChoice2_1] = useState<'A_cis_B_trans' | 'A_trans_B_cis' | null>(null);
  const [diffChoice2_1, setDiffChoice2_1] = useState<string | null>(null);
  const [highlightDoubleBond2_1, setHighlightDoubleBond2_1] = useState(false);

  // 2.2 state
  const [fahejConfig, setFahejConfig] = useState<'cis' | 'trans'>('cis');
  const [fahejAnswer, setFahejAnswer] = useState<string | null>(null);

  // 2.3 state
  const [activeAlkeneId, setActiveAlkeneId] = useState<string>('but_2_en');
  const [selectedAtom2_3, setSelectedAtom2_3] = useState<string | null>(null);
  const [reason2_3, setReason2_3] = useState<string | null>(null);

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

  // ---------------- 2.1 AZ OLÍVAOLAJ REJTÉLYE ----------------
  if (activeChallengeId === '2.1') {
    const check2_1 = () => {
      if (!cisChoice2_1 || !diffChoice2_1) {
        recordFail('Válaszolj mindkét kérdésre az ellenőrzés előtt!');
        return;
      }
      if (cisChoice2_1 !== 'A_cis_B_trans') {
        recordFail(
          'Nagyíts rá mindkét molekulában a C9=C10 kettős kötésre (a két párhuzamos pálcikára)! Melyik modellben áll a két kapcsolódó szénláncrész a kettős kötés azonos oldalán, és melyikben az ellentétes oldalon?',
        );
        return;
      }
      if (diffChoice2_1 !== 'diff_cis_trans') {
        recordFail(
          'Ellenőrizd a lényegi térszerkezeti különbséget! Mindkét molekula nyílt láncú, C₁₈H₃₄O₂ összegképletű, a különbség kizárólag a kettős kötés körüli cisz/transz elrendeződésben van.',
        );
        return;
      }
      recordSuccess();
    };

    const doubleBondHighlightIds = highlightDoubleBond2_1 ? ['C9', 'C10'] : [];

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            2.1. Az olívaolaj rejtélye
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Mindkét 3D modell egy 18 szénatomos, nyílt láncú, egyetlen C=C kettős kötést (a 9. és 10. szénatom között) tartalmazó monokarbonsav (C₁₈H₃₄O₂). Vizsgáld meg a kettős kötés körüli térbeli elrendeződést!
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#0F172A]">
          <span className="text-xs text-slate-300">
            Forgasd és nagyítsd a modelleket! A C=C kettős kötés két párhuzamos pálcikaként jelenik meg a lánc közepén.
          </span>
          <button
            type="button"
            onClick={() => setHighlightDoubleBond2_1((v) => !v)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium min-h-[36px] transition-colors ${
              highlightDoubleBond2_1
                ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                : 'border-slate-700 text-slate-200 hover:border-amber-400/60'
            }`}
          >
            {highlightDoubleBond2_1 ? 'C9=C10 kiemelés kikapcsolása' : 'C9=C10 kettős kötés kiemelése'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <MoleculeViewer
            molecule={OLAJSAV}
            label="A modell"
            sublabel="C₁₈H₃₄O₂ · 9-oktadecénsav"
            heightClass="h-[290px] sm:h-[340px] lg:h-[380px]"
            highlightedAtomIds={doubleBondHighlightIds}
            highlightColor="#F59E0B"
          />
          <MoleculeViewer
            molecule={ELAIDINSAV}
            label="B modell"
            sublabel="C₁₈H₃₄O₂ · 9-oktadecénsav"
            heightClass="h-[290px] sm:h-[340px] lg:h-[380px]"
            highlightedAtomIds={doubleBondHighlightIds}
            highlightColor="#F59E0B"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3">
            <p className="text-xs font-semibold text-cyan-300">
              1. Azonosítsd a cisz- és transz-konfigurációjú modellt!
            </p>
            <div className="space-y-2">
              {[
                {
                  id: 'A_cis_B_trans' as const,
                  label: 'A modell: cisz-9-oktadecénsav (olajsav) · B modell: transz-9-oktadecénsav (elaidinsav)',
                },
                {
                  id: 'A_trans_B_cis' as const,
                  label: 'A modell: transz-9-oktadecénsav (elaidinsav) · B modell: cisz-9-oktadecénsav (olajsav)',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
                  onClick={() => setCisChoice2_1(opt.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-lg border text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                    cisChoice2_1 === opt.id
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-[#080D16] text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
            <p className="text-xs font-semibold text-cyan-300">
              2. Mi a lényegi térszerkezeti különbség az olajsav és az elaidinsav között?
            </p>
            <div className="space-y-2">
              {DIFF_OPTIONS_2_1.map((opt) => {
                const active = diffChoice2_1 === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={Boolean(currentResult?.completed)}
                    onClick={() => setDiffChoice2_1(opt.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors min-h-[44px] ${
                      active
                        ? 'border-teal-400 bg-teal-500/15 text-teal-100'
                        : 'border-slate-800 bg-[#080D16] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <ChallengeFeedbackPanel
          challengeId="2.1"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="Kapcsold be a „C9=C10 kettős kötés kiemelése” gombot, és szükség esetén rejtsd el a H-atomokat! Az A modellben a kettős kötéshez kapcsolódó két szénláncrész ugyanarra az oldalra (felfelé) indul el (cisz), míg a B modellben az egyik felfelé, a másik lefelé mutat (transz)."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Pontos! Az olajsavban (A modell) a C9=C10 kettős kötéshez kapcsolódó két szénláncrész azonos oldalon (cisz), az elaidinsavban (B modell) ellentétes oldalon (transz) helyezkedik el."
          onCheck={check2_1}
          checkDisabled={!cisChoice2_1 || !diffChoice2_1}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 2.2 A FAHÉJ ILLATMOLEKULÁJA ----------------
  if (activeChallengeId === '2.2') {
    const activeMol = fahejConfig === 'cis' ? CISZ_FAHEJALDEHID : TRANSZ_FAHEJALDEHID;

    const check2_2 = () => {
      if (fahejConfig !== 'trans') {
        recordFail(
          'Még mindig a kiindulási izomer látható! Használd a konfigurációváltó gombot a másik geometriai izomer létrehozásához.',
        );
        return;
      }
      if (fahejAnswer !== 'trans_opp') {
        recordFail(
          'Figyeld meg a gyűrű (fenilcsoport) és a piros O-atomot tartalmazó aldehidcsoport (–CHO) helyzetét a C=C kettős kötéshez képest!',
        );
        return;
      }
      recordSuccess();
    };

    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
            2.2. A fahéj illatmolekulája
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            A képernyőn a fahéjaldehid (C₉H₈O) egyik geometriai izomerje látható. Válts át a másik, kémiailag érvényes térszerkezeti konfigurációra, majd azonosítsd a létrehozott izomert!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7">
            <MoleculeViewer
              molecule={activeMol}
              label={`Fahéjaldehid – ${fahejConfig === 'cis' ? 'Kiindulási' : 'Átkapcsolt'} konfiguráció`}
              sublabel="C₉H₈O"
              heightClass="h-[320px] sm:h-[380px] lg:h-[420px]"
              extraControls={
                <button
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
                  onClick={() =>
                    setFahejConfig((c) => (c === 'cis' ? 'trans' : 'cis'))
                  }
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 text-xs font-semibold hover:bg-cyan-500/30 transition-colors min-h-[36px]"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Konfiguráció váltása
                </button>
              }
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-3">
              <p className="text-xs font-semibold text-cyan-300">
                1. Hozz létre másik geometriai izomert
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                A C=C kettős kötés nem forgatható el szabadon. A rendszer két elkülönített, kémiailag pontos térszerkezet közötti váltást biztosít.
              </p>
              <button
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() =>
                  setFahejConfig((c) => (c === 'cis' ? 'trans' : 'cis'))
                }
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-cyan-500/50 bg-cyan-500/10 text-cyan-200 font-semibold text-sm hover:bg-cyan-500/20 transition-colors min-h-[44px]"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {fahejConfig === 'cis'
                  ? 'Másik konfiguráció létrehozása (A → B)'
                  : 'Visszaváltás a kiindulásira (B → A)'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
              <p className="text-xs font-semibold text-cyan-300">
                2. Milyen konfigurációjú az újonnan létrehozott izomer?
              </p>
              {[
                {
                  id: 'cis_same',
                  label: 'Cisz-izomer: a benzolgyűrű és a –CHO csoport a C=C kötés azonos oldalán van.',
                },
                {
                  id: 'trans_opp',
                  label: 'Transz-izomer: a benzolgyűrű és a –CHO csoport a C=C kötés ellentétes oldalán van.',
                },
                {
                  id: 'enantiomer',
                  label: 'Enantiomer pár: a két forma egymás nem fedésbe hozható tükörképe.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(currentResult?.completed)}
                  onClick={() => setFahejAnswer(opt.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors min-h-[44px] ${
                    fahejAnswer === opt.id
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

        <ChallengeFeedbackPanel
          challengeId="2.2"
          result={currentResult}
          attempts={currentAttempts}
          usedHint={currentUsedHint}
          hintText="Nézd meg a síkbeli kettős kötést: ha a nagy benzolgyűrű és a –CHO csoport átlósan, a kötés ellentétes oldalára kerül, akkor transz-izomert hoztál létre (ez adja a fahéj jellegzetes illatát!)."
          showHint={currentShowHint}
          onRequestHint={handleRequestHint}
          errorMessage={currentError}
          successMessage="Kiváló! A fahéjaldehid természetes illatát adó molekula a transz-fahéjaldehid, amelyben a fenilcsoport és az aldehidcsoport a C=C kettős kötés ellentétes oldalán helyezkedik el."
          onCheck={check2_2}
          checkDisabled={!fahejAnswer}
          onNext={onNextChallenge}
        />
      </div>
    );
  }

  // ---------------- 2.3 A LEHETETLEN IZOMER ----------------
  const alkenes: MoleculeData[] = [BUT_2_EN, KLORPROPEN_1, METILBUT_2_EN_2];
  const activeAlkene =
    alkenes.find((m) => m.id === activeAlkeneId) || alkenes[0];

  const check2_3 = () => {
    if (activeAlkene.id !== 'metilbut_2_en_2') {
      recordFail(
        `A(z) ${activeAlkene.name} kettős kötésének mindkét szénatomjához két különböző atom/atomcsoport kapcsolódik, így létezik cisz- és transz-izomerje! Vizsgáld meg a többi alként is!`,
      );
      return;
    }
    if (!selectedAtom2_3) {
      recordFail(
        'Kattints közvetlenül a 3D modellben arra a szénatomra, amely megakadályozza a geometriai izoméria kialakulását!',
      );
      return;
    }
    if (selectedAtom2_3 !== 'C2') {
      recordFail(
        'Nem a megfelelő atomot jelölted ki! Keresd meg a C=C kettős kötésnek azt a szénatomját, amelyhez két teljesen egyforma csoport kapcsolódik (használhatod a „Kapcsolódó csoportok” gombot is!).',
      );
      return;
    }
    if (reason2_3 !== 'two_methyls') {
      recordFail('A kijelölt szénatom helyes, de pontosítsd a hozzá kapcsolódó azonos csoportok okát!');
      return;
    }
    recordSuccess();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-semibold text-white">
          2.3. A lehetetlen izomer
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          Vizsgáld meg az alábbi három alként! Válaszd ki azt a molekulát, amely <strong className="text-white">nem</strong> mutathat cisz–transz (geometriai) izomériát, kattints a 3D modellben a problémát okozó szénatomra, és jelöld meg az okot!
        </p>
      </div>

      {/* 3 Alkene selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {alkenes.map((m) => {
          const active = activeAlkene.id === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setActiveAlkeneId(m.id);
                setSelectedAtom2_3(null);
              }}
              className={`px-4 py-3 rounded-xl border text-left transition-colors min-h-[52px] ${
                active
                  ? 'border-cyan-400 bg-cyan-500/15 text-white'
                  : 'border-slate-800 bg-[#0D1526] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-sm">{m.name}</div>
              <div className="font-mono-tabular text-xs text-cyan-300">{m.formula}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <MoleculeViewer
            molecule={activeAlkene}
            label={activeAlkene.name}
            sublabel="Kattints a C=C kötés problémás szénatomjára!"
            selectable={!currentResult?.completed}
            selectedAtomIds={selectedAtom2_3 ? [selectedAtom2_3] : []}
            onSelectAtom={(id) => {
              setSelectedAtom2_3(id);
              setErrors((p) => ({ ...p, '2.3': null }));
            }}
            heightClass="h-[320px] sm:h-[380px] lg:h-[420px]"
          />
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Crosshair className="w-4 h-4" />
              <span>Kiválasztott molekula és atom</span>
            </div>
            <div className="text-sm text-slate-200 space-y-1">
              <div>
                Aktív alkén: <strong className="text-white">{activeAlkene.name}</strong>
              </div>
              <div>
                Kijelölt atom a 3D modellben:{' '}
                <span className="font-mono-tabular text-cyan-300">
                  {selectedAtom2_3 ? selectedAtom2_3 : 'Még nincs kijelölve (kattints egy atomra!)'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1526] p-4 space-y-2.5">
            <p className="text-xs font-semibold text-cyan-300">
              Miért nem mutathat geometriai izomériát ez az alkén?
            </p>
            {[
              {
                id: 'two_hydrogens',
                label: 'A kettős kötés kijelölt szénatomjához két azonos hidrogénatom (–H) kapcsolódik.',
              },
              {
                id: 'two_methyls',
                label: 'A kettős kötés kijelölt szénatomjához két azonos metilcsoport (–CH₃) kapcsolódik.',
              },
              {
                id: 'no_double',
                label: 'A molekula valójában nem tartalmaz C=C kettős kötést.',
              },
              {
                id: 'symmetric_chain',
                label: 'Mivel a molekula páros számú szénatomot tartalmaz, a cisz és transz alak azonos.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={Boolean(currentResult?.completed)}
                onClick={() => setReason2_3(opt.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors min-h-[44px] ${
                  reason2_3 === opt.id
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

      <ChallengeFeedbackPanel
        challengeId="2.3"
        result={currentResult}
        attempts={currentAttempts}
        usedHint={currentUsedHint}
        hintText="Geometriai izoméria csak akkor lép fel, ha a C=C kettős kötés MINDKÉT szénatomjához két egymástól KÜLÖNBÖZŐ csoport kapcsolódik. Vizsgáld meg a 2-metilbut-2-én kettős kötésének két szénatomját!"
        showHint={currentShowHint}
        onRequestHint={handleRequestHint}
        errorMessage={currentError}
        successMessage="Pontos! A 2-metilbut-2-én C2 szénatomjához két teljesen azonos metilcsoport (–CH₃) kapcsolódik. Ha felcseréljük őket, ugyanazt a molekulát kapjuk, ezért nincs cisz–transz izomériája."
        onCheck={check2_3}
        onNext={onFinishLevel}
        nextLabel="Részleg lezárása"
      />
    </div>
  );
};
