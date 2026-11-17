import type { ChallengeId, LevelId } from '../types/chemistry';

export interface LevelMeta {
  id: LevelId;
  code: string;
  title: string;
  topic: string;
  shortBrief: string;
  challengeIds: ChallengeId[];
  completionBanner?: string;
}

export const LEVELS: LevelMeta[] = [
  {
    id: 1,
    code: 'I. részleg',
    title: 'Az adatbázis hibája',
    topic: 'Szerkezeti izoméria',
    shortBrief:
      'A központi nyilvántartásban azonos összegképletű vegyületek szerkezeti adatai keveredtek össze. Párosítsd az izomereket, azonosítsd a különbségeket, és javítsd ki a sérült adatlapokat.',
    challengeIds: ['1.1', '1.2a', '1.2b', '1.2c', '1.3a', '1.3b'],
    completionBanner: 'Az első adatbázis helyreállítva.',
  },
  {
    id: 2,
    code: 'II. részleg',
    title: 'A térszerkezet nyomai',
    topic: 'Geometriai izoméria',
    shortBrief:
      'A kettős kötések körüli gátolt elfordulás eltérő térbeli alakot eredményez. Vizsgáld meg a kettős kötések térszerkezetét, válts konfigurációt, és szűrd ki a lehetetlen izomert.',
    challengeIds: ['2.1', '2.2', '2.3'],
  },
  {
    id: 3,
    code: 'III. részleg',
    title: 'A tükörképek laboratóriuma',
    topic: 'Optikai izoméria',
    shortBrief:
      'Több bioaktív molekula tükörképi adatai ütköztek a rendszerben. Keresd meg az aszimmetrikus szénatomokat, vizsgáld a fedésbe hozhatóságot, és hasonlítsd össze a hatóanyagok képletét.',
    challengeIds: ['3.1', '3.2', '3.3', '3.4'],
  },
  {
    id: 4,
    code: 'IV. részleg',
    title: 'A szimmetria paradoxona',
    topic: 'Több aszimmetrikus szénatom, diasztereomerek és mezovegyületek',
    shortBrief:
      'Az eritrit térszerkezeti modelljei ellentmondásosnak tűnnek: négy helyett csak három valódi sztereoizomer létezik. Derítsd fel a rejtett szimmetriát!',
    challengeIds: ['4.1', '4.2', '4.3'],
  },
  {
    id: 5,
    code: 'V. részleg',
    title: 'Az optikai egyensúly',
    topic: 'Racém elegyek és optikai aktivitás',
    shortBrief:
      'A polarimetriai laboratóriumban helyre kell állítani a racém elegyek optikai egyensúlyát. Számítsd ki a hiányzó anyagmennyiségeket, térfogatokat és elfordulási szögeket.',
    challengeIds: ['5.1', '5.2', '5.3'],
  },
];

export const FINAL_LEVEL: LevelMeta = {
  id: 6,
  code: 'Központi laboratórium',
  title: 'A végső nyomozás',
  topic: 'Az anomália forrása',
  shortBrief:
    'Mind az öt részleg adatai helyreálltak. A központi elemző két látszólag azonos összegképletű és kapcsolódású molekulát talált, amelyek mégsem viselkednek ugyanúgy.',
  challengeIds: ['final'],
};

export interface ChallengeMeta {
  id: ChallengeId;
  levelId: LevelId;
  title: string;
  topicTag: string;
}

export const CHALLENGES_META: Record<ChallengeId, ChallengeMeta> = {
  '1.1': { id: '1.1', levelId: 1, title: '1.1. Izomerpárok keresése', topicTag: 'Szerkezeti izoméria' },
  '1.2a': { id: '1.2a', levelId: 1, title: '1.2. Mi változott meg? (1/3)', topicTag: 'Szerkezeti izoméria' },
  '1.2b': { id: '1.2b', levelId: 1, title: '1.2. Mi változott meg? (2/3)', topicTag: 'Szerkezeti izoméria' },
  '1.2c': { id: '1.2c', levelId: 1, title: '1.2. Mi változott meg? (3/3)', topicTag: 'Szerkezeti izoméria' },
  '1.3a': { id: '1.3a', levelId: 1, title: '1.3. Hibás molekulaadatlap (1/2)', topicTag: 'Szerkezeti izoméria' },
  '1.3b': { id: '1.3b', levelId: 1, title: '1.3. Hibás molekulaadatlap (2/2)', topicTag: 'Szerkezeti izoméria' },
  '2.1': { id: '2.1', levelId: 2, title: '2.1. Az olívaolaj rejtélye', topicTag: 'Geometriai izoméria' },
  '2.2': { id: '2.2', levelId: 2, title: '2.2. A fahéj illatmolekulája', topicTag: 'Geometriai izoméria' },
  '2.3': { id: '2.3', levelId: 2, title: '2.3. A lehetetlen izomer', topicTag: 'Geometriai izoméria' },
  '3.1': { id: '3.1', levelId: 3, title: '3.1. A citrusok titka – limonén', topicTag: 'Optikai izoméria' },
  '3.2': { id: '3.2', levelId: 3, title: '3.2. A tejsav két változata', topicTag: 'Optikai izoméria' },
  '3.3': { id: '3.3', levelId: 3, title: '3.3. A gyógyszermolekula – naproxén', topicTag: 'Optikai izoméria' },
  '3.4': { id: '3.4', levelId: 3, title: '3.4. Izomerek vagy nem?', topicTag: 'Optikai izoméria' },
  '4.1': { id: '4.1', levelId: 4, title: '4.1. Az eritrit szerkezete', topicTag: 'Mezovegyületek' },
  '4.2': { id: '4.2', levelId: 4, title: '4.2. Három vagy négy?', topicTag: 'Sztereoizomerek' },
  '4.3': { id: '4.3', levelId: 4, title: '4.3. A mezovegyület felismerése', topicTag: 'Mezovegyületek' },
  '5.1': { id: '5.1', levelId: 5, title: '5.1. A racém elegy', topicTag: 'Racém elegyek' },
  '5.2': { id: '5.2', levelId: 5, title: '5.2. A hiányzó enantiomer', topicTag: 'Racém elegyek' },
  '5.3': { id: '5.3', levelId: 5, title: '5.3. Az ellentétes forgatás', topicTag: 'Optikai aktivitás' },
  final: { id: 'final', levelId: 6, title: 'Végső vizsgálat – 2-hidroxibutánsav', topicTag: 'Összegző szintézis' },
};

export type StructuralIsomerismType = 'chain' | 'positional' | 'functional';

export const STRUCTURAL_TYPE_LABELS: Record<StructuralIsomerismType, string> = {
  chain: 'Láncizoméria (szénvázizoméria)',
  positional: 'Helyzeti izoméria',
  functional: 'Funkcióscsoport-izoméria',
};
