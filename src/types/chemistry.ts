export type ElementSymbol = 'C' | 'H' | 'O' | 'N' | 'Cl';

export type Vec3 = [number, number, number];

export interface AtomData {
  id: string;
  element: ElementSymbol;
  position: Vec3;
  label?: string;
  isChiralCenter?: boolean;
  attachedToChiral?: boolean;
}

export interface BondData {
  id: string;
  from: string;
  to: string;
  order: 1 | 2 | 3;
}

export interface MoleculeData {
  id: string;
  name: string;
  iupacName?: string;
  formula: string;
  formulaHtml?: string;
  atoms: AtomData[];
  bonds: BondData[];
  chiralCenterIds?: string[];
  doubleBondAtomIds?: [string, string];
  /** Optional symmetry plane bisecting the molecule (revealed only after answering in 4.3) */
  symmetryPlane?: {
    point: Vec3;
    normal: Vec3;
  };
  /** Optional single bond for conformational rotation (e.g., C2-C3 in erythritol) */
  rotatableBond?: {
    atomA: string;
    atomB: string;
    defaultAngleDeg?: number;
    /** Angle in degrees where the internal symmetry plane aligns clearly */
    symmetryAngleDeg?: number;
  };
  description?: string;
}

export interface SubstituentGroup {
  rootAtomId: string;
  rootElement: ElementSymbol;
  atomIds: string[];
  formulaLabel: string;
  color: string;
}

export type LevelId = 1 | 2 | 3 | 4 | 5 | 6; // 6 = Végső nyomozás

export type ChallengeId =
  | '1.1'
  | '1.2a'
  | '1.2b'
  | '1.2c'
  | '1.3a'
  | '1.3b'
  | '2.1'
  | '2.2'
  | '2.3'
  | '3.1'
  | '3.2'
  | '3.3'
  | '3.4'
  | '4.1'
  | '4.2'
  | '4.3'
  | '5.1'
  | '5.2'
  | '5.3'
  | 'final';

export interface ChallengeResult {
  challengeId: ChallengeId;
  completed: boolean;
  attempts: number;
  usedHint: boolean;
  score: number;
}

export interface GameState {
  teamName: string;
  started: boolean;
  currentScreen: 'start' | 'hub' | 'level' | 'summary';
  activeLevel: LevelId;
  activeChallengeIndex: number;
  unlockedLevel: LevelId;
  results: Partial<Record<ChallengeId, ChallengeResult>>;
  completedAt?: number;
}
