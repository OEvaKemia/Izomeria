import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import type { ChallengeId, ChallengeResult, GameState, LevelId } from './types/chemistry';
import { FINAL_LEVEL, LEVELS } from './data/challenges';
import { StartScreen } from './components/StartScreen';
import { LabHub } from './components/LabHub';
import { FinalSummary } from './components/FinalSummary';
import { Level1View } from './components/levels/Level1View';
import { Level2View } from './components/levels/Level2View';
import { Level3View } from './components/levels/Level3View';
import { Level4View } from './components/levels/Level4View';
import { Level5View } from './components/levels/Level5View';
import { FinalMysteryView } from './components/levels/FinalMysteryView';

interface ErrorBoundaryProps {
  resetKey: string;
  onReturnHub?: () => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ChallengeErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Ismeretlen megjelenítési hiba',
    };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-6 space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-white">
              A feladat modul betöltésekor hiba történt
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Az eddig elért eredményeid és pontszámod biztonságban megmaradtak. Próbáld meg újratölteni a nézetet, vagy lépj vissza a kutatási központba.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 min-h-[38px]"
            >
              Újrapróbálás
            </button>
            {this.props.onReturnHub && (
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  this.props.onReturnHub?.();
                }}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs font-medium hover:border-cyan-500/60 min-h-[38px]"
              >
                Vissza a kutatási központba
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STORAGE_KEY = 'molekularis_nyomozas_state_v1';

const INITIAL_STATE: GameState = {
  teamName: '',
  started: false,
  currentScreen: 'start',
  activeLevel: 1,
  activeChallengeIndex: 0,
  unlockedLevel: 1,
  results: {},
};

function loadInitialState(): GameState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== 'object') return INITIAL_STATE;
    const allLevels = [...LEVELS, FINAL_LEVEL];
    const validLevel = allLevels.find((l) => l.id === parsed.activeLevel)
      ? parsed.activeLevel
      : 1;
    const lvlMeta = allLevels.find((l) => l.id === validLevel) || LEVELS[0];
    const rawIdx = Number.isInteger(parsed.activeChallengeIndex)
      ? parsed.activeChallengeIndex
      : 0;
    const validIdx = Math.max(0, Math.min(lvlMeta.challengeIds.length - 1, rawIdx));
    return {
      ...INITIAL_STATE,
      ...parsed,
      activeLevel: validLevel,
      activeChallengeIndex: validIdx,
      results: parsed.results || {},
    };
  } catch {
    return INITIAL_STATE;
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(loadInitialState);
  const [levelBanner, setLevelBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch {
      // Ignore storage quota errors
    }
  }, [gameState]);

  const allLevels = useMemo(() => [...LEVELS, FINAL_LEVEL], []);
  const maxScore = useMemo(
    () => allLevels.reduce((acc, l) => acc + l.challengeIds.length * 10, 0),
    [allLevels],
  );

  const totalScore = useMemo(
    () =>
      Object.values(gameState.results).reduce(
        (acc, r) => acc + (r?.score || 0),
        0,
      ),
    [gameState.results],
  );

  const completedChallengesCount = useMemo(
    () =>
      Object.values(gameState.results).filter((r) => Boolean(r?.completed)).length,
    [gameState.results],
  );
  const totalChallengesCount = useMemo(
    () => allLevels.reduce((acc, l) => acc + l.challengeIds.length, 0),
    [allLevels],
  );

  const currentLevelMeta = useMemo(
    () => allLevels.find((l) => l.id === gameState.activeLevel) || LEVELS[0],
    [allLevels, gameState.activeLevel],
  );

  const activeChallengeId: ChallengeId =
    currentLevelMeta.challengeIds[gameState.activeChallengeIndex] ||
    currentLevelMeta.challengeIds[0];

  const handleStartGame = (teamName: string) => {
    setLevelBanner(null);
    setGameState({
      ...INITIAL_STATE,
      teamName,
      started: true,
      currentScreen: 'hub',
    });
  };

  const handleResetGame = () => {
    setLevelBanner(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setGameState(INITIAL_STATE);
  };

  const handleSelectLevel = (levelId: LevelId) => {
    setLevelBanner(null);
    const lvl = allLevels.find((l) => l.id === levelId) || LEVELS[0];
    // Start at first incomplete challenge in this level, or 0 if all done
    const firstIncomplete = lvl.challengeIds.findIndex(
      (cid) => !gameState.results[cid]?.completed,
    );
    setGameState((prev) => ({
      ...prev,
      currentScreen: 'level',
      activeLevel: levelId,
      activeChallengeIndex: firstIncomplete >= 0 ? firstIncomplete : 0,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteChallenge = (result: ChallengeResult) => {
    setGameState((prev) => {
      const nextResults = {
        ...prev.results,
        [result.challengeId]: result,
      };
      // Check if current level is now completely solved -> unlock next level!
      const lvlMeta = allLevels.find((l) => l.id === prev.activeLevel);
      let nextUnlocked = prev.unlockedLevel;
      if (lvlMeta && lvlMeta.challengeIds.every((id) => nextResults[id]?.completed)) {
        if (prev.activeLevel < 6 && prev.activeLevel + 1 > nextUnlocked) {
          nextUnlocked = (prev.activeLevel + 1) as LevelId;
        }
      }
      return {
        ...prev,
        results: nextResults,
        unlockedLevel: nextUnlocked,
      };
    });
  };

  const handleNextChallenge = () => {
    setGameState((prev) => {
      const nextIdx = Math.min(
        currentLevelMeta.challengeIds.length - 1,
        prev.activeChallengeIndex + 1,
      );
      return {
        ...prev,
        activeChallengeIndex: nextIdx,
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishLevel = () => {
    const banner =
      currentLevelMeta.completionBanner ||
      `${currentLevelMeta.code} (${currentLevelMeta.title}) sikeresen teljesítve!`;
    setLevelBanner(banner);
    setGameState((prev) => ({
      ...prev,
      currentScreen: 'hub',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishGame = () => {
    setGameState((prev) => ({
      ...prev,
      currentScreen: 'summary',
      completedAt: Date.now(),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!gameState.started || gameState.currentScreen === 'start') {
    return (
      <StartScreen
        initialTeamName={gameState.teamName}
        onStart={handleStartGame}
      />
    );
  }

  return (
    <div className="min-h-screen lab-grid-bg flex flex-col">
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#080D16]/95 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => {
              setLevelBanner(null);
              setGameState((p) => ({ ...p, currentScreen: 'hub' }));
            }}
            className="font-display font-bold text-base sm:text-lg tracking-tight text-white hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 text-left"
          >
            Molekuláris Nyomozás
          </button>

          {/* Zone 2: Nav / Progress links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm text-slate-300">
            <button
              type="button"
              onClick={() => {
                setLevelBanner(null);
                setGameState((p) => ({ ...p, currentScreen: 'hub' }));
              }}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Kutatási központ
            </button>
            <span className="text-slate-600">·</span>
            <span className="whitespace-nowrap shrink-0 text-slate-300">
              Csapat: <strong className="text-white">{gameState.teamName}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono-tabular whitespace-nowrap shrink-0 text-cyan-300">
              {completedChallengesCount}/{totalChallengesCount} feladat · {totalScore} pont
            </span>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="md:hidden font-mono-tabular text-xs text-cyan-300 whitespace-nowrap">
              {totalScore} p
            </span>
            <button
              type="button"
              onClick={handleResetGame}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:border-rose-500/60 hover:text-rose-200 transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Új kutatás</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {gameState.currentScreen === 'hub' && (
          <>
            {levelBanner && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/35 px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{levelBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLevelBanner(null)}
                    className="text-xs text-emerald-300 hover:text-white px-2 py-1"
                  >
                    Bezárás
                  </button>
                </div>
              </div>
            )}
            <LabHub
              teamName={gameState.teamName}
              unlockedLevel={gameState.unlockedLevel}
              results={gameState.results}
              totalScore={totalScore}
              maxScore={maxScore}
              onSelectLevel={handleSelectLevel}
              onOpenSummary={() =>
                setGameState((p) => ({ ...p, currentScreen: 'summary' }))
              }
            />
          </>
        )}

        {gameState.currentScreen === 'level' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Level Header & Challenge Stepper */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1324] p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setGameState((p) => ({ ...p, currentScreen: 'hub' }))
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors min-h-[36px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Vissza a központba
                </button>

                <div className="font-mono-tabular text-xs text-slate-300">
                  {currentLevelMeta.code} · {currentLevelMeta.topic} ·{' '}
                  <span className="text-cyan-300 font-semibold">
                    {totalScore} / {maxScore} pont
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {currentLevelMeta.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {currentLevelMeta.shortBrief}
                </p>
              </div>

              {/* Challenge Step Tabs */}
              {currentLevelMeta.challengeIds.length > 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentLevelMeta.challengeIds.map((cid, idx) => {
                    const isActive = idx === gameState.activeChallengeIndex;
                    const done = Boolean(gameState.results[cid]?.completed);
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() =>
                          setGameState((p) => ({ ...p, activeChallengeIndex: idx }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors min-h-[36px] ${
                          isActive
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                            : done
                              ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-300'
                              : 'border-slate-700 bg-[#080D16] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className="font-mono-tabular">{cid.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Level Content */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4 sm:p-6">
              <ChallengeErrorBoundary
                resetKey={`${gameState.activeLevel}-${activeChallengeId}`}
                onReturnHub={() =>
                  setGameState((p) => ({ ...p, currentScreen: 'hub' }))
                }
              >
                {gameState.activeLevel === 1 && (
                  <Level1View
                    activeChallengeId={activeChallengeId}
                    results={gameState.results}
                    onCompleteChallenge={handleCompleteChallenge}
                    onNextChallenge={handleNextChallenge}
                    onFinishLevel={handleFinishLevel}
                  />
                )}
                {gameState.activeLevel === 2 && (
                  <Level2View
                    activeChallengeId={activeChallengeId}
                    results={gameState.results}
                    onCompleteChallenge={handleCompleteChallenge}
                    onNextChallenge={handleNextChallenge}
                    onFinishLevel={handleFinishLevel}
                  />
                )}
                {gameState.activeLevel === 3 && (
                  <Level3View
                    activeChallengeId={activeChallengeId}
                    results={gameState.results}
                    onCompleteChallenge={handleCompleteChallenge}
                    onNextChallenge={handleNextChallenge}
                    onFinishLevel={handleFinishLevel}
                  />
                )}
                {gameState.activeLevel === 4 && (
                  <Level4View
                    activeChallengeId={activeChallengeId}
                    results={gameState.results}
                    onCompleteChallenge={handleCompleteChallenge}
                    onNextChallenge={handleNextChallenge}
                    onFinishLevel={handleFinishLevel}
                  />
                )}
                {gameState.activeLevel === 5 && (
                  <Level5View
                    activeChallengeId={activeChallengeId}
                    results={gameState.results}
                    onCompleteChallenge={handleCompleteChallenge}
                    onNextChallenge={handleNextChallenge}
                    onFinishLevel={handleFinishLevel}
                  />
                )}
                {gameState.activeLevel === 6 && (
                  <FinalMysteryView
                    result={gameState.results['final']}
                    onCompleteChallenge={handleCompleteChallenge}
                    onFinishGame={handleFinishGame}
                  />
                )}
              </ChallengeErrorBoundary>
            </div>
          </div>
        )}

        {gameState.currentScreen === 'summary' && (
          <FinalSummary
            teamName={gameState.teamName}
            results={gameState.results}
            totalScore={totalScore}
            maxScore={maxScore}
            onReturnHub={() =>
              setGameState((p) => ({ ...p, currentScreen: 'hub' }))
            }
            onResetGame={handleResetGame}
          />
        )}
      </main>
    </div>
  );
}
