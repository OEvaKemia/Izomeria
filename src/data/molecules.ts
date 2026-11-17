import type { MoleculeData, Vec3 } from '../types/chemistry';
import {
  BOND_LENGTHS,
  MoleculeBuilder,
  addVec,
  centerMolecule,
  crossVec,
  dotVec,
  mirrorMolecule,
  normVec,
  rotateAroundAxis,
  rotateConformationAroundBond,
  rotateMoleculeRigid,
  scaleVec,
  subVec,
  tetrahedralDirectionsFromOne,
  tetrahedralDirectionsFromTwo,
  trigonalDirectionsFromOne,
} from '../utils/chemistryGeometry';

// Standard tetrahedral zig-zag helpers in XY plane (C-C-C angle = 109.47°)
const HALF_TET = Math.acos(-1 / 3) / 2; // ~54.7356°
const SIN_HT = Math.sin(HALF_TET); // ~0.8165
const COS_HT = Math.cos(HALF_TET); // ~0.5774

function zigZagChainDir(stepIdx: number): Vec3 {
  // Alternating +Y and -Y in XY plane so C-C-C bond angle is exactly 109.47°
  return [SIN_HT, stepIdx % 2 === 0 ? COS_HT : -COS_HT, 0];
}

function buildAlkaneChain(
  id: string,
  name: string,
  formula: string,
  length: number,
  description?: string,
): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C1', 'C', [0, 0, 0]);
  for (let i = 2; i <= length; i++) {
    b.extend(`C${i - 1}`, `C${i}`, 'C', zigZagChainDir(i - 2), BOND_LENGTHS.CC_SINGLE);
  }
  for (let i = 1; i <= length; i++) {
    b.saturateCarbonWithH(`C${i}`, i % 2 === 0 ? 0 : Math.PI / 3);
  }
  return centerMolecule({
    id,
    name,
    formula,
    atoms: b.atoms,
    bonds: b.bonds,
    description,
  });
}

// ---------------------------------------------------------------------------
// LEVEL 1 MOLECULES
// ---------------------------------------------------------------------------

// 1.1 Pair 1: C6H14 (Hexán vs 2,2-dimetilbután)
export const HEXAN = buildAlkaneChain(
  'hexan',
  'Hexán',
  'C₆H₁₄',
  6,
  'Elágazásmentes, hat szénatomos telített szénhidrogén.',
);

function buildDimetilbutan22(): MoleculeData {
  const b = new MoleculeBuilder();
  // C1 - C2(CH3)2 - C3 - C4
  b.addAtom('C2', 'C', [0, 0, 0]);
  const tetDirs: Vec3[] = [
    [-SIN_HT, COS_HT, 0],
    [SIN_HT, COS_HT, 0],
    [0, -COS_HT, SIN_HT],
    [0, -COS_HT, -SIN_HT],
  ];
  b.addMethyl('C2', 'C1', tetDirs[0]);
  const c3 = b.extend('C2', 'C3', 'C', tetDirs[1], BOND_LENGTHS.CC_SINGLE);
  b.addMethyl('C2', 'C5', tetDirs[2]);
  b.addMethyl('C2', 'C6', tetDirs[3]);
  // Extend C4 from C3
  const c2ToC3 = subVec(c3.position, [0, 0, 0]);
  const [c4Dir] = tetrahedralDirectionsFromOne(scaleVec(c2ToC3, -1), 0);
  b.addMethyl('C3', 'C4', c4Dir);
  b.saturateCarbonWithH('C3');
  return centerMolecule({
    id: 'dimetilbutan_2_2',
    name: '2,2-dimetilbután',
    formula: 'C₆H₁₄',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Erősen elágazó szénláncú C₆H₁₄ izomer, két metilcsoporttal a C2 atomon.',
  });
}
export const DIMETILBUTAN_2_2 = buildDimetilbutan22();

// 1.1 Pair 2: C3H7Cl (1-klórpropán vs 2-klórpropán)
function buildKlorpropan1(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C1', 'C', [0, 0, 0]);
  b.extend('C1', 'C2', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  b.extend('C2', 'C3', 'C', zigZagChainDir(1), BOND_LENGTHS.CC_SINGLE);
  // Cl on C1
  const clDir: Vec3 = [-SIN_HT, -COS_HT, 0];
  b.extend('C1', 'Cl1', 'Cl', clDir, BOND_LENGTHS.CCl);
  b.saturateCarbonWithH('C1');
  b.saturateCarbonWithH('C2');
  b.saturateCarbonWithH('C3');
  return centerMolecule({
    id: 'klorpropan_1',
    name: '1-klórpropán',
    formula: 'C₃H₇Cl',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'A klóratom a láncvégi (C1) szénatomhoz kapcsolódik.',
  });
}
export const KLORPROPAN_1 = buildKlorpropan1();

function buildKlorpropan2(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C1', 'C', [0, 0, 0]);
  const c2 = b.extend('C1', 'C2', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  const c3 = b.extend('C2', 'C3', 'C', zigZagChainDir(1), BOND_LENGTHS.CC_SINGLE);
  // Cl on C2 (tetrahedral from C1 and C3)
  const d1 = subVec(b.getAtom('C1').position, c2.position);
  const d2 = subVec(c3.position, c2.position);
  const [clDir] = tetrahedralDirectionsFromTwo(d1, d2, 1);
  b.extend('C2', 'Cl1', 'Cl', clDir, BOND_LENGTHS.CCl);
  b.saturateCarbonWithH('C1');
  b.saturateCarbonWithH('C2');
  b.saturateCarbonWithH('C3');
  return centerMolecule({
    id: 'klorpropan_2',
    name: '2-klórpropán',
    formula: 'C₃H₇Cl',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'A klóratom a középső (C2) szénatomhoz kapcsolódik.',
  });
}
export const KLORPROPAN_2 = buildKlorpropan2();

// 1.1 Pair 3 & 1.3b: C3H6O (Propanal vs Propanon vs Prop-2-én-1-ol)
function buildPropanal(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C3', 'C', [0, 0, 0]);
  const c2 = b.extend('C3', 'C2', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  const c1 = b.extend('C2', 'C1', 'C', zigZagChainDir(1), BOND_LENGTHS.CC_SP2);
  const c1Back = subVec(c2.position, c1.position);
  const [oDir, hDir] = trigonalDirectionsFromOne(c1Back, [0, 0, 1]);
  b.extend('C1', 'O1', 'O', oDir, BOND_LENGTHS.CO_DOUBLE, 2);
  b.extend('C1', 'C1_H', 'H', hDir, BOND_LENGTHS.CH, 1);
  b.saturateCarbonWithH('C3');
  b.saturateCarbonWithH('C2');
  return centerMolecule({
    id: 'propanal',
    name: 'Propanal',
    formula: 'C₃H₆O',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Három szénatomos aldehid: a C=O csoport láncvégi (–CHO).',
  });
}
export const PROPANAL = buildPropanal();

function buildPropanon(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C2', 'C', [0, 0, 0]);
  b.extend('C2', 'O1', 'O', [0, 1, 0], BOND_LENGTHS.CO_DOUBLE, 2);
  const [dLeft, dRight] = trigonalDirectionsFromOne([0, 1, 0], [0, 0, 1]);
  b.addMethyl('C2', 'C1', dLeft, BOND_LENGTHS.CC_SP2);
  b.addMethyl('C2', 'C3', dRight, BOND_LENGTHS.CC_SP2);
  return centerMolecule({
    id: 'propanon',
    name: 'Propanon (aceton)',
    formula: 'C₃H₆O',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Keton: a karbonilcsoport (C=O) két szénatom között, a lánc belsejében van.',
  });
}
export const PROPANON = buildPropanon();

function buildProp2En1Ol(): MoleculeData {
  const b = new MoleculeBuilder();
  // CH2=CH-CH2-OH
  b.addAtom('C3', 'C', [0, 0, 0]);
  const c2 = b.extend('C3', 'C2', 'C', [1, 0, 0], BOND_LENGTHS.CC_DOUBLE, 2);
  const [c1Dir, c2HDir] = trigonalDirectionsFromOne([-1, 0, 0], [0, 0, 1]);
  const [c3H1, c3H2] = trigonalDirectionsFromOne([1, 0, 0], [0, 0, 1]);
  b.extend('C3', 'C3_H1', 'H', c3H1, BOND_LENGTHS.CH);
  b.extend('C3', 'C3_H2', 'H', c3H2, BOND_LENGTHS.CH);
  b.extend('C2', 'C2_H', 'H', c2HDir, BOND_LENGTHS.CH);
  const c1 = b.extend('C2', 'C1', 'C', c1Dir, BOND_LENGTHS.CC_SP2, 1);
  const c1Back = subVec(c2.position, c1.position);
  const [oDir] = tetrahedralDirectionsFromOne(c1Back, 0);
  b.addHydroxyl('C1', 'O1', oDir);
  b.saturateCarbonWithH('C1');
  return centerMolecule({
    id: 'prop_2_en_1_ol',
    name: 'Prop-2-én-1-ol',
    formula: 'C₃H₆O',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Telítetlen alkohol C=C kettős kötéssel és –OH csoporttal.',
  });
}
export const PROP_2_EN_1_OL = buildProp2En1Ol();

// 1.2 Pair A: Butánsav vs 2-metilpropánsav (C4H8O2 - láncizoméria)
function buildButansav(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C4', 'C', [0, 0, 0]);
  b.extend('C4', 'C3', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  const c2 = b.extend('C3', 'C2', 'C', zigZagChainDir(1), BOND_LENGTHS.CC_SINGLE);
  b.addCarboxyl('C2', 'C1', zigZagChainDir(2));
  b.saturateCarbonWithH('C4');
  b.saturateCarbonWithH('C3');
  b.saturateCarbonWithH('C2');
  void c2;
  return centerMolecule({
    id: 'butansav',
    name: 'Butánsav',
    formula: 'C₄H₈O₂',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Elágazásmentes négy szénatomos karbonsav.',
  });
}
export const BUTANSAV = buildButansav();

function buildMetilpropansav2(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C2', 'C', [0, 0, 0]);
  b.addCarboxyl('C2', 'C1', [SIN_HT, COS_HT, 0]);
  b.addMethyl('C2', 'C3', [-SIN_HT, COS_HT, 0]);
  const [c4Dir] = tetrahedralDirectionsFromTwo(
    [SIN_HT, COS_HT, 0],
    [-SIN_HT, COS_HT, 0],
    1,
  );
  b.addMethyl('C2', 'C4', c4Dir);
  b.saturateCarbonWithH('C2');
  return centerMolecule({
    id: 'metilpropansav_2',
    name: '2-metilpropánsav',
    formula: 'C₄H₈O₂',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Elágazó szénláncú karbonsav: a C2 atomhoz egy metilcsoport kapcsolódik.',
  });
}
export const METILPROPANSAV_2 = buildMetilpropansav2();

// 1.2 Pair B & 1.3a: Bután-1-ol vs Bután-2-ol vs 2-metilpropán-1-ol (C4H10O)
function buildButan1Ol(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C4', 'C', [0, 0, 0]);
  b.extend('C4', 'C3', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  b.extend('C3', 'C2', 'C', zigZagChainDir(1), BOND_LENGTHS.CC_SINGLE);
  b.extend('C2', 'C1', 'C', zigZagChainDir(2), BOND_LENGTHS.CC_SINGLE);
  b.addHydroxyl('C1', 'O1', zigZagChainDir(3));
  b.saturateCarbonWithH('C4');
  b.saturateCarbonWithH('C3');
  b.saturateCarbonWithH('C2');
  b.saturateCarbonWithH('C1');
  return centerMolecule({
    id: 'butan_1_ol',
    name: 'Bután-1-ol',
    formula: 'C₄H₁₀O',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Az –OH csoport a láncvégi C1 szénatomhoz kapcsolódik.',
  });
}
export const BUTAN_1_OL = buildButan1Ol();

function buildButan2Ol(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C4', 'C', [0, 0, 0]);
  const c3 = b.extend('C4', 'C3', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  const c2 = b.extend('C3', 'C2', 'C', zigZagChainDir(1), BOND_LENGTHS.CC_SINGLE);
  const c1 = b.extend('C2', 'C1', 'C', zigZagChainDir(2), BOND_LENGTHS.CC_SINGLE);
  const [ohDir] = tetrahedralDirectionsFromTwo(
    subVec(c3.position, c2.position),
    subVec(c1.position, c2.position),
    1,
  );
  b.addHydroxyl('C2', 'O1', ohDir);
  b.saturateCarbonWithH('C4');
  b.saturateCarbonWithH('C3');
  b.saturateCarbonWithH('C2');
  b.saturateCarbonWithH('C1');
  return centerMolecule({
    id: 'butan_2_ol',
    name: 'Bután-2-ol',
    formula: 'C₄H₁₀O',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Az –OH csoport a belső C2 szénatomhoz kapcsolódik.',
  });
}
export const BUTAN_2_OL = buildButan2Ol();

function buildMetilpropan1Ol(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C2', 'C', [0, 0, 0]);
  const c1 = b.extend('C2', 'C1', 'C', [SIN_HT, COS_HT, 0], BOND_LENGTHS.CC_SINGLE);
  b.addMethyl('C2', 'C3', [-SIN_HT, COS_HT, 0]);
  const [c4Dir] = tetrahedralDirectionsFromTwo(
    [SIN_HT, COS_HT, 0],
    [-SIN_HT, COS_HT, 0],
    1,
  );
  b.addMethyl('C2', 'C4', c4Dir);
  const [ohDir] = tetrahedralDirectionsFromOne(subVec([0, 0, 0], c1.position), 0);
  b.addHydroxyl('C1', 'O1', ohDir);
  b.saturateCarbonWithH('C2');
  b.saturateCarbonWithH('C1');
  return centerMolecule({
    id: 'metilpropan_1_ol',
    name: '2-metilpropán-1-ol',
    formula: 'C₄H₁₀O',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Elágazó szénláncú primer alkohol.',
  });
}
export const METILPROPAN_1_OL = buildMetilpropan1Ol();

// 1.2 Pair C: Propánsav vs Metil-acetát (C3H6O2 - funkcióscsoport-izoméria)
function buildPropansav(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C3', 'C', [0, 0, 0]);
  b.extend('C3', 'C2', 'C', zigZagChainDir(0), BOND_LENGTHS.CC_SINGLE);
  b.addCarboxyl('C2', 'C1', zigZagChainDir(1));
  b.saturateCarbonWithH('C3');
  b.saturateCarbonWithH('C2');
  return centerMolecule({
    id: 'propansav',
    name: 'Propánsav',
    formula: 'C₃H₆O₂',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Karbonsav: tartalmaz egy karboxilcsoportot (–COOH).',
  });
}
export const PROPANSAV = buildPropansav();

function buildMetilAcetat(): MoleculeData {
  const b = new MoleculeBuilder();
  // CH3 - C(=O) - O - CH3
  b.addAtom('C1', 'C', [0, 0, 0]);
  const [dLeft, dRight] = trigonalDirectionsFromOne([0, 1, 0], [0, 0, 1]);
  b.extend('C1', 'O_carb', 'O', [0, 1, 0], BOND_LENGTHS.CO_DOUBLE, 2);
  b.addMethyl('C1', 'C2', dLeft, BOND_LENGTHS.CC_SP2);
  const oEst = b.extend('C1', 'O_est', 'O', dRight, BOND_LENGTHS.CO_SINGLE, 1);
  // C-O-C angle ~112° in ester
  const oToC1 = normVec(subVec([0, 0, 0], oEst.position));
  const m = normVec(crossVec([0, 0, 1], oToC1));
  const cMetDir = normVec(addVec(scaleVec(oToC1, -Math.cos((68 * Math.PI) / 180)), scaleVec(m, Math.sin((68 * Math.PI) / 180))));
  b.addMethyl('O_est', 'C_met', cMetDir, BOND_LENGTHS.CO_SINGLE);
  return centerMolecule({
    id: 'metil_acetat',
    name: 'Metil-acetát',
    formula: 'C₃H₆O₂',
    atoms: b.atoms,
    bonds: b.bonds,
    description: 'Észter: –COO– észtercsoport kapcsol össze két szénrészletet.',
  });
}
export const METIL_ACETAT = buildMetilAcetat();

// ---------------------------------------------------------------------------
// LEVEL 2 MOLECULES (GEOMETRIC ISOMERISM)
// ---------------------------------------------------------------------------

function buildOctadecenoicAcid(isCis: boolean): MoleculeData {
  const b = new MoleculeBuilder();
  // Full open-chain C18H34O2:
  // C1(COOH) - C2 - C3 - C4 - C5 - C6 - C7 - C8 - C9=C10 - C11 - C12 - C13 - C14 - C15 - C16 - C17 - C18(CH3)
  b.addAtom('C9', 'C', [-0.67, 0, 0]);
  b.addAtom('C10', 'C', [0.67, 0, 0]);
  b.addBond('C9', 'C10', 2);

  const deg = (d: number): Vec3 => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180), 0];

  // Around C9 (sp2): C8 at +120° (up-left), H9 at -120° (down-left)
  b.extend('C9', 'C8', 'C', deg(120), BOND_LENGTHS.CC_SP2);
  b.extend('C9', 'C9_H', 'H', deg(-120), BOND_LENGTHS.CH);

  // Around C10 (sp2):
  // Cis (olajsav): C11 at +60° (same +Y side as C8), H10 at -60°
  // Trans (elaidinsav): C11 at -60° (opposite -Y side from C8), H10 at +60°
  b.extend('C10', 'C11', 'C', deg(isCis ? 60 : -60), BOND_LENGTHS.CC_SP2);
  b.extend('C10', 'C10_H', 'H', deg(isCis ? -60 : 60), BOND_LENGTHS.CH);

  // Left tail C8 -> C7 -> ... -> C2 -> C1(COOH)
  // Exact 109.4712° tetrahedral zig-zag moving monotonically toward -X:
  // alternates between 190.5288° (left-slightly-down) and 120° (up-left)
  const leftAngles = [190.5288, 120, 190.5288, 120, 190.5288, 120, 190.5288];
  const leftIds = ['C7', 'C6', 'C5', 'C4', 'C3', 'C2', 'C1'];
  let prevLeft = 'C8';
  for (let i = 0; i < leftIds.length; i++) {
    const dir = deg(leftAngles[i]);
    if (leftIds[i] === 'C1') {
      b.addCarboxyl(prevLeft, 'C1', dir, [0, 0, 1]);
    } else {
      b.extend(prevLeft, leftIds[i], 'C', dir, BOND_LENGTHS.CC_SINGLE);
      prevLeft = leftIds[i];
    }
  }

  // Right tail C11 -> C12 -> ... -> C17 -> C18(CH3)
  // Exact 109.4712° tetrahedral zig-zag moving monotonically toward +X:
  // For cis (+60°): alternates -10.5288° and +60°
  // For trans (-60°): alternates +10.5288° and -60°
  const rightIds = ['C12', 'C13', 'C14', 'C15', 'C16', 'C17', 'C18'];
  let prevRight = 'C11';
  for (let i = 0; i < rightIds.length; i++) {
    const angle = isCis
      ? i % 2 === 0
        ? -10.5288
        : 60
      : i % 2 === 0
        ? 10.5288
        : -60;
    const dir = deg(angle);
    if (rightIds[i] === 'C18') {
      b.addMethyl(prevRight, 'C18', dir, BOND_LENGTHS.CC_SINGLE, Math.PI / 3);
    } else {
      b.extend(prevRight, rightIds[i], 'C', dir, BOND_LENGTHS.CC_SINGLE);
      prevRight = rightIds[i];
    }
  }

  // Saturate saturated CH2 carbons C2..C8 and C11..C17
  for (let i = 2; i <= 8; i++) b.saturateCarbonWithH(`C${i}`, i % 2 === 0 ? 0 : Math.PI / 3);
  for (let i = 11; i <= 17; i++) b.saturateCarbonWithH(`C${i}`, i % 2 === 0 ? 0 : Math.PI / 3);

  return centerMolecule({
    id: isCis ? 'olajsav' : 'elaidinsav',
    name: isCis ? 'Olajsav (cisz-9-oktadecénsav)' : 'Elaidinsav (transz-9-oktadecénsav)',
    formula: 'C₁₈H₃₄O₂',
    atoms: b.atoms,
    bonds: b.bonds,
    doubleBondAtomIds: ['C9', 'C10'],
    description: isCis
      ? 'A kettős kötés azonos oldalán (cisz) helyezkedik el a két szénláncrész.'
      : 'A kettős kötés ellentétes oldalán (transz) helyezkedik el a két szénláncrész.',
  });
}

export const OLAJSAV = buildOctadecenoicAcid(true);
export const ELAIDINSAV = buildOctadecenoicAcid(false);

// 2.2 Fahéjaldehid (C9H8O) - C6H5-CH=CH-CHO
function buildFahejaldehid(isCis: boolean): MoleculeData {
  const b = new MoleculeBuilder();
  // Benzene ring in XY plane centered around (-3.0, 0, 0), with C_ring1 attached to C_alpha at (-1.5, 0, 0)
  const r = BOND_LENGTHS.CC_AROM;
  const ringCenter: Vec3 = [-0.67 - 1.5 - r, 0, 0];
  // Put vertex 0 at (+r, 0, 0) from ringCenter -> closest to alkene!
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    b.addAtom(`R${i}`, 'C', [
      ringCenter[0] + r * Math.cos(angle),
      ringCenter[1] + r * Math.sin(angle),
      0,
    ]);
  }
  for (let i = 0; i < 6; i++) {
    b.addBond(`R${i}`, `R${(i + 1) % 6}`, i % 2 === 0 ? 2 : 1);
    if (i !== 0) {
      const angle = (i * Math.PI) / 3;
      b.extend(`R${i}`, `R${i}_H`, 'H', [Math.cos(angle), Math.sin(angle), 0], BOND_LENGTHS.CH);
    }
  }

  // C_alpha = C_beta along tilted direction so trigonal angles are exact 120°
  const cAlpha = b.extend('R0', 'Ca', 'C', [1, 0, 0], BOND_LENGTHS.CC_SP2, 1);
  // Ca=Cb goes at +60° from +X
  const caToCbDir: Vec3 = [0.5, Math.sqrt(3) / 2, 0];
  const caHDir: Vec3 = [0.5, -Math.sqrt(3) / 2, 0];
  b.extend('Ca', 'Ca_H', 'H', caHDir, BOND_LENGTHS.CH);
  const cBeta = b.extend('Ca', 'Cb', 'C', caToCbDir, BOND_LENGTHS.CC_DOUBLE, 2);

  // At Cb, incoming bond is from Ca -> Cb.
  // The two trigonal directions from Cb are at ±60° relative to caToCbDir!
  // Note: R0-Ca is on the "upper-left / -X" side relative to Ca->Cb vector:
  // Cross(caToCbDir, [-1,0,0]) = (0, 0, +0.866) -> phenyl is on the LEFT of Ca->Cb!
  const leftPerp: Vec3 = [-caToCbDir[1], caToCbDir[0], 0];
  const choCisDir = normVec(addVec(scaleVec(caToCbDir, 0.5), scaleVec(leftPerp, Math.sqrt(3) / 2)));
  const choTransDir = normVec(addVec(scaleVec(caToCbDir, 0.5), scaleVec(leftPerp, -Math.sqrt(3) / 2)));

  const choDir = isCis ? choCisDir : choTransDir;
  const hBetaDir = isCis ? choTransDir : choCisDir;
  b.extend('Cb', 'Cb_H', 'H', hBetaDir, BOND_LENGTHS.CH);

  // Aldehyde carbon C_ald
  const cAld = b.extend('Cb', 'Cald', 'C', choDir, BOND_LENGTHS.CC_SP2, 1);
  const [oDir, hAldDir] = trigonalDirectionsFromOne(
    subVec(cBeta.position, cAld.position),
    [0, 0, 1],
  );
  b.extend('Cald', 'O1', 'O', oDir, BOND_LENGTHS.CO_DOUBLE, 2);
  b.extend('Cald', 'Cald_H', 'H', hAldDir, BOND_LENGTHS.CH, 1);

  void cAlpha;

  return centerMolecule({
    id: isCis ? 'cisz_fahejaldehid' : 'transz_fahejaldehid',
    name: isCis ? 'Fahéjaldehid (A konfiguráció)' : 'Fahéjaldehid (B konfiguráció)',
    formula: 'C₉H₈O',
    atoms: b.atoms,
    bonds: b.bonds,
    doubleBondAtomIds: ['Ca', 'Cb'],
    description: isCis
      ? 'A fenilcsoport és az aldehidcsoport a C=C kettős kötés azonos oldalán található (cisz).'
      : 'A fenilcsoport és az aldehidcsoport a C=C kettős kötés ellentétes oldalán található (transz).',
  });
}

export const CISZ_FAHEJALDEHID = buildFahejaldehid(true);
export const TRANSZ_FAHEJALDEHID = buildFahejaldehid(false);

// 2.3 Three alkenes: But-2-én, 1-klórpropén, 2-metilbut-2-én
function buildBut2En(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C2', 'C', [-0.67, 0, 0]);
  b.addAtom('C3', 'C', [0.67, 0, 0]);
  b.addBond('C2', 'C3', 2);
  const [d1, d2] = trigonalDirectionsFromOne([1, 0, 0], [0, 0, 1]);
  const [d3, d4] = trigonalDirectionsFromOne([-1, 0, 0], [0, 0, 1]);
  // Trans configuration
  const c1Dir = d1[1] > 0 ? d1 : d2;
  const h2Dir = d1[1] > 0 ? d2 : d1;
  const c4Dir = d3[1] < 0 ? d3 : d4;
  const h3Dir = d3[1] < 0 ? d4 : d3;
  b.addMethyl('C2', 'C1', c1Dir, BOND_LENGTHS.CC_SP2);
  b.extend('C2', 'C2_H', 'H', h2Dir, BOND_LENGTHS.CH);
  b.addMethyl('C3', 'C4', c4Dir, BOND_LENGTHS.CC_SP2);
  b.extend('C3', 'C3_H', 'H', h3Dir, BOND_LENGTHS.CH);
  return centerMolecule({
    id: 'but_2_en',
    name: 'But-2-én',
    formula: 'C₄H₈',
    atoms: b.atoms,
    bonds: b.bonds,
    doubleBondAtomIds: ['C2', 'C3'],
  });
}
export const BUT_2_EN = buildBut2En();

function buildKlorpropen1(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C1', 'C', [-0.67, 0, 0]);
  b.addAtom('C2', 'C', [0.67, 0, 0]);
  b.addBond('C1', 'C2', 2);
  const [d1, d2] = trigonalDirectionsFromOne([1, 0, 0], [0, 0, 1]);
  const [d3, d4] = trigonalDirectionsFromOne([-1, 0, 0], [0, 0, 1]);
  const clDir = d1[1] > 0 ? d1 : d2;
  const h1Dir = d1[1] > 0 ? d2 : d1;
  const c3Dir = d3[1] < 0 ? d3 : d4;
  const h2Dir = d3[1] < 0 ? d4 : d3;
  b.extend('C1', 'Cl1', 'Cl', clDir, BOND_LENGTHS.CCl);
  b.extend('C1', 'C1_H', 'H', h1Dir, BOND_LENGTHS.CH);
  b.addMethyl('C2', 'C3', c3Dir, BOND_LENGTHS.CC_SP2);
  b.extend('C2', 'C2_H', 'H', h2Dir, BOND_LENGTHS.CH);
  return centerMolecule({
    id: 'klorpropen_1',
    name: '1-klórpropén',
    formula: 'C₃H₅Cl',
    atoms: b.atoms,
    bonds: b.bonds,
    doubleBondAtomIds: ['C1', 'C2'],
  });
}
export const KLORPROPEN_1 = buildKlorpropen1();

function buildMetilbut2En2(): MoleculeData {
  const b = new MoleculeBuilder();
  // (CH3)2C2 = C3H - CH3  -> C2 is the offending carbon with TWO identical methyl groups!
  b.addAtom('C2', 'C', [-0.67, 0, 0]);
  b.addAtom('C3', 'C', [0.67, 0, 0]);
  b.addBond('C2', 'C3', 2);
  const [d1, d2] = trigonalDirectionsFromOne([1, 0, 0], [0, 0, 1]);
  const [d3, d4] = trigonalDirectionsFromOne([-1, 0, 0], [0, 0, 1]);
  // Two methyls on C2!
  b.addMethyl('C2', 'C1', d1, BOND_LENGTHS.CC_SP2);
  b.addMethyl('C2', 'C5', d2, BOND_LENGTHS.CC_SP2);
  // One methyl and one H on C3
  const c4Dir = d3[1] < 0 ? d3 : d4;
  const h3Dir = d3[1] < 0 ? d4 : d3;
  b.addMethyl('C3', 'C4', c4Dir, BOND_LENGTHS.CC_SP2);
  b.extend('C3', 'C3_H', 'H', h3Dir, BOND_LENGTHS.CH);
  return centerMolecule({
    id: 'metilbut_2_en_2',
    name: '2-metilbut-2-én',
    formula: 'C₅H₁₀',
    atoms: b.atoms,
    bonds: b.bonds,
    doubleBondAtomIds: ['C2', 'C3'],
  });
}
export const METILBUT_2_EN_2 = buildMetilbut2En2();

// ---------------------------------------------------------------------------
// LEVEL 3 MOLECULES (OPTICAL ISOMERISM)
// ---------------------------------------------------------------------------

// 3.1 Limonén (C10H16): Cyclohexene half-chair ring with C1=C2, CH3 on C1, isopropenyl on C4
function buildLimonen(): MoleculeData {
  const b = new MoleculeBuilder();
  // Half-chair cyclohexene ring coordinates (chemically accurate bond lengths ~1.34 for C1=C2, ~1.50-1.54 for others)
  // C1, C2, C3, C6 lie nearly in z=0 plane; C4 puckers +z, C5 puckers -z so C4 is genuinely chiral & puckered!
  b.addAtom('C1', 'C', [-0.67, 1.25, 0.0]);
  b.addAtom('C2', 'C', [0.67, 1.25, 0.0]);
  b.addAtom('C3', 'C', [1.45, 0.0, 0.14]);
  b.addAtom('C4', 'C', [0.76, -1.27, -0.34], { isChiralCenter: true });
  b.addAtom('C5', 'C', [-0.76, -1.27, 0.34]);
  b.addAtom('C6', 'C', [-1.45, 0.0, -0.14]);

  b.addBond('C1', 'C2', 2);
  b.addBond('C2', 'C3', 1);
  b.addBond('C3', 'C4', 1);
  b.addBond('C4', 'C5', 1);
  b.addBond('C5', 'C6', 1);
  b.addBond('C6', 'C1', 1);

  // Methyl on C1 (planar sp2)
  const c1Avg = normVec(
    addVec(
      subVec(b.getAtom('C2').position, b.getAtom('C1').position),
      subVec(b.getAtom('C6').position, b.getAtom('C1').position),
    ),
  );
  b.addMethyl('C1', 'C7', scaleVec(c1Avg, -1), BOND_LENGTHS.CC_SP2);

  // H on C2 (planar sp2)
  const c2Avg = normVec(
    addVec(
      subVec(b.getAtom('C1').position, b.getAtom('C2').position),
      subVec(b.getAtom('C3').position, b.getAtom('C2').position),
    ),
  );
  b.extend('C2', 'C2_H', 'H', scaleVec(c2Avg, -1), BOND_LENGTHS.CH);

  // Tetrahedral substituents on C4 (chiral center!): isopropenyl + H
  const dC4toC3 = subVec(b.getAtom('C3').position, b.getAtom('C4').position);
  const dC4toC5 = subVec(b.getAtom('C5').position, b.getAtom('C4').position);
  const [c8Dir, h4Dir] = tetrahedralDirectionsFromTwo(dC4toC3, dC4toC5, 1);
  const c8 = b.extend('C4', 'C8', 'C', c8Dir, BOND_LENGTHS.CC_SP2, 1);
  b.extend('C4', 'C4_H', 'H', h4Dir, BOND_LENGTHS.CH, 1, { attachedToChiral: true });

  // Isopropenyl at C8: =CH2 and -CH3
  const c8Back = subVec(b.getAtom('C4').position, c8.position);
  const [c9Dir, c10Dir] = trigonalDirectionsFromOne(c8Back, [0, 1, 0.3]);
  const c9 = b.extend('C8', 'C9', 'C', c9Dir, BOND_LENGTHS.CC_DOUBLE, 2);
  const [h9a, h9b] = trigonalDirectionsFromOne(
    subVec(c8.position, c9.position),
    [0, 1, 0.3],
  );
  b.extend('C9', 'C9_H1', 'H', h9a, BOND_LENGTHS.CH);
  b.extend('C9', 'C9_H2', 'H', h9b, BOND_LENGTHS.CH);
  b.addMethyl('C8', 'C10', c10Dir, BOND_LENGTHS.CC_SP2);

  // Saturate C3, C5, C6
  b.saturateCarbonWithH('C3');
  b.saturateCarbonWithH('C5');
  b.saturateCarbonWithH('C6');

  return centerMolecule({
    id: 'limonen_A',
    name: 'Limonén (A enantiomer)',
    formula: 'C₁₀H₁₆',
    atoms: b.atoms,
    bonds: b.bonds,
    chiralCenterIds: ['C4'],
    description: 'Narancs illatáért felelős monoterpén – egyetlen aszimmetrikus szénatommal (C4).',
  });
}
export const LIMONEN_A = buildLimonen();
export const LIMONEN_B = mirrorMolecule(
  LIMONEN_A,
  'limonen_B',
  'Limonén (B enantiomer – tükörkép)',
);

// 3.2 Tejsav (C3H6O3): CH3 - CH(OH) - COOH
function buildTejsav(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C2', 'C', [0, 0, 0], { isChiralCenter: true });
  const tetDirs: Vec3[] = [
    [-SIN_HT, COS_HT, 0], // -CH3
    [SIN_HT, COS_HT, 0],  // -COOH
    [0, -COS_HT, SIN_HT], // -OH
    [0, -COS_HT, -SIN_HT], // -H
  ];
  b.addMethyl('C2', 'C3', tetDirs[0], BOND_LENGTHS.CC_SINGLE);
  b.addCarboxyl('C2', 'C1', tetDirs[1], [0, 0, 1]);
  b.addHydroxyl('C2', 'O_oh', tetDirs[2], [1, 0, 0]);
  b.extend('C2', 'C2_H', 'H', tetDirs[3], BOND_LENGTHS.CH, 1, { attachedToChiral: true });
  return centerMolecule({
    id: 'tejsav_A',
    name: 'Tejsav (A enantiomer)',
    formula: 'C₃H₆O₃',
    atoms: b.atoms,
    bonds: b.bonds,
    chiralCenterIds: ['C2'],
    description: '2-hidroxipropánsav: a C2 atomhoz –H, –OH, –CH₃ és –COOH kapcsolódik.',
  });
}
export const TEJSAV_A = buildTejsav();
export const TEJSAV_B = mirrorMolecule(TEJSAV_A, 'tejsav_B', 'Tejsav (B enantiomer)');

// 3.3 Naproxén (C14H14O3): 2-(6-metoxinaftalin-2-il)propánsav
function buildNaproxen(): MoleculeData {
  const b = new MoleculeBuilder();
  const r = BOND_LENGTHS.CC_AROM;
  const dx = r * Math.sqrt(3); // ~2.4076 (center-to-center distance of fused rings)

  // Left hexagon centered at (-dx/2, 0, 0), Right hexagon centered at (+dx/2, 0, 0)
  // Shared bond: (0, +r/2) and (0, -r/2)
  const addHex = (cx: number, prefix: string, sharedTop?: string, sharedBot?: string) => {
    // Vertices starting top (90°), going clockwise:
    // 0: top (0, r), 1: top-right (dx/2, r/2), 2: bot-right (dx/2, -r/2),
    // 3: bot (0, -r), 4: bot-left (-dx/2, -r/2), 5: top-left (-dx/2, r/2)
    const offsets: Vec3[] = [
      [0, r, 0],
      [dx / 2, r / 2, 0],
      [dx / 2, -r / 2, 0],
      [0, -r, 0],
      [-dx / 2, -r / 2, 0],
      [-dx / 2, r / 2, 0],
    ];
    const ids: string[] = [];
    for (let i = 0; i < 6; i++) {
      if (i === 1 && sharedTop) {
        ids.push(sharedTop);
      } else if (i === 2 && sharedBot) {
        ids.push(sharedBot);
      } else {
        const id = `${prefix}${i}`;
        b.addAtom(id, 'C', [cx + offsets[i][0], offsets[i][1], 0]);
        ids.push(id);
      }
    }
    return ids;
  };

  // Ring A (left): A1 is top-right (0, r/2), A2 is bot-right (0, -r/2)
  const rA = addHex(-dx / 2, 'NA');
  // Ring B (right): B5 is top-left (0, r/2) = A1, B4 is bot-left (0, -r/2) = A2
  const offsetsB: Vec3[] = [
    [0, r, 0],
    [dx / 2, r / 2, 0],
    [dx / 2, -r / 2, 0],
    [0, -r, 0],
  ];
  const rB = [
    b.addAtom('NB0', 'C', [dx / 2 + offsetsB[0][0], offsetsB[0][1], 0]).id,
    b.addAtom('NB1', 'C', [dx / 2 + offsetsB[1][0], offsetsB[1][1], 0]).id,
    b.addAtom('NB2', 'C', [dx / 2 + offsetsB[2][0], offsetsB[2][1], 0]).id,
    b.addAtom('NB3', 'C', [dx / 2 + offsetsB[3][0], offsetsB[3][1], 0]).id,
    rA[2], // shared bottom
    rA[1], // shared top
  ];

  // Aromatic Kekulé bonds in naphthalene (all valences = 4):
  // Shared bond A1-A2 = single (order 1)
  // Ring A: A0=A1(1), A1-A2(1), A2=A3(2), A3-A4(1), A4=A5(2), A5-A0(1) -> wait! Let's make A1=A2(2) so both rings get proper valence 4!
  // With A1=A2 (2):
  // A0-A1(1), A1=A2(2), A2-A3(1), A3=A4(2), A4-A5(1), A5=A0(2) -> A1 has 1+2+B0(1)=4! A2 has 2+1+B3(1)=4!
  // Ring B: B0=B1(2), B1-B2(1), B2=B3(2), B3-B4(1), B5-B0(1) -> B0 has 2+1=3 (+1 H =4), B5(=A1) has 1(B0)+2(A2)+1(A0)=4!
  b.addBond(rA[0], rA[1], 1);
  b.addBond(rA[1], rA[2], 2);
  b.addBond(rA[2], rA[3], 1);
  b.addBond(rA[3], rA[4], 2);
  b.addBond(rA[4], rA[5], 1);
  b.addBond(rA[5], rA[0], 2);

  b.addBond(rB[5], rB[0], 1);
  b.addBond(rB[0], rB[1], 2);
  b.addBond(rB[1], rB[2], 1);
  b.addBond(rB[2], rB[3], 2);
  b.addBond(rB[3], rB[4], 1);

  // Add hydrogens on outer ring vertices except NA4 (6-methoxy) and NB1 (2-propanoic acid)
  const addRingH = (atomId: string, center: Vec3) => {
    const dir = normVec(subVec(b.getAtom(atomId).position, center));
    b.extend(atomId, `${atomId}_H`, 'H', dir, BOND_LENGTHS.CH);
  };
  addRingH(rA[0], [-dx / 2, 0, 0]);
  addRingH(rA[3], [-dx / 2, 0, 0]);
  addRingH(rA[5], [-dx / 2, 0, 0]);
  addRingH(rB[0], [dx / 2, 0, 0]);
  addRingH(rB[2], [dx / 2, 0, 0]);
  addRingH(rB[3], [dx / 2, 0, 0]);

  // 6-methoxy (-OCH3) on NA4
  const methoxyDir = normVec(subVec(b.getAtom(rA[4]).position, [-dx / 2, 0, 0]));
  const oMet = b.extend(rA[4], 'O_met', 'O', methoxyDir, BOND_LENGTHS.CO_SINGLE);
  const cMetDir = rotateAroundAxis(methoxyDir, [0, 0, 1], (-68 * Math.PI) / 180);
  b.addMethyl('O_met', 'C_met', cMetDir, BOND_LENGTHS.CO_SINGLE);
  void oMet;

  // Chiral propanoic acid side chain on NB1
  const propDir = normVec(subVec(b.getAtom(rB[1]).position, [dx / 2, 0, 0]));
  const cChiral = b.extend(rB[1], 'C_chiral', 'C', propDir, BOND_LENGTHS.CC_SP2, 1, {
    isChiralCenter: true,
  });
  const backDir = scaleVec(propDir, -1);
  const [d1, d2, d3] = tetrahedralDirectionsFromOne(backDir, 0.4);
  b.addCarboxyl('C_chiral', 'C_carb', d1, [0, 1, 0]);
  b.addMethyl('C_chiral', 'C_alpha_met', d2, BOND_LENGTHS.CC_SINGLE);
  b.extend('C_chiral', 'C_chiral_H', 'H', d3, BOND_LENGTHS.CH, 1, {
    attachedToChiral: true,
  });
  void cChiral;

  return centerMolecule({
    id: 'naproxen_A',
    name: 'Naproxén (A enantiomer)',
    formula: 'C₁₄H₁₄O₃',
    atoms: b.atoms,
    bonds: b.bonds,
    chiralCenterIds: ['C_chiral'],
    description: 'Fájdalomcsillapító hatóanyag naftalin vázzal, metoxicsoporttal és aszimmetrikus szénatommal.',
  });
}
export const NAPROXEN_A = buildNaproxen();
export const NAPROXEN_B = mirrorMolecule(
  NAPROXEN_A,
  'naproxen_B',
  'Naproxén (B enantiomer – tükörkép)',
);

// 3.4 Ibuprofén (C13H18O2): 2-(4-izobutilfenil)propánsav
function buildIbuprofen(): MoleculeData {
  const b = new MoleculeBuilder();
  const r = BOND_LENGTHS.CC_AROM;
  // Benzene ring in XY plane, vertex 0 at (+r, 0, 0) [para to vertex 3 at (-r, 0, 0)]
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    b.addAtom(`B${i}`, 'C', [r * Math.cos(a), r * Math.sin(a), 0]);
  }
  for (let i = 0; i < 6; i++) {
    b.addBond(`B${i}`, `B${(i + 1) % 6}`, i % 2 === 0 ? 2 : 1);
    if (i !== 0 && i !== 3) {
      const a = (i * Math.PI) / 3;
      b.extend(`B${i}`, `B${i}_H`, 'H', [Math.cos(a), Math.sin(a), 0], BOND_LENGTHS.CH);
    }
  }

  // Isobutyl group on B3 (-X side): -CH2 - CH(CH3)2
  const cIso1 = b.extend('B3', 'C_iso1', 'C', [-1, 0, 0], BOND_LENGTHS.CC_SP2);
  const [cIso2Dir] = tetrahedralDirectionsFromOne([1, 0, 0], 0);
  const cIso2 = b.extend('C_iso1', 'C_iso2', 'C', cIso2Dir, BOND_LENGTHS.CC_SINGLE);
  const [m1Dir, m2Dir] = tetrahedralDirectionsFromOne(
    subVec(cIso1.position, cIso2.position),
    0.8,
  );
  b.addMethyl('C_iso2', 'C_iso3', m1Dir);
  b.addMethyl('C_iso2', 'C_iso4', m2Dir);
  b.saturateCarbonWithH('C_iso1');
  b.saturateCarbonWithH('C_iso2');

  // Chiral propanoic acid side chain on B0 (+X side)
  const cChiral = b.extend('B0', 'C_chiral', 'C', [1, 0, 0], BOND_LENGTHS.CC_SP2, 1, {
    isChiralCenter: true,
  });
  const [d1, d2, d3] = tetrahedralDirectionsFromOne([-1, 0, 0], 0.4);
  b.addCarboxyl('C_chiral', 'C_carb', d1, [0, 1, 0]);
  b.addMethyl('C_chiral', 'C_alpha_met', d2, BOND_LENGTHS.CC_SINGLE);
  b.extend('C_chiral', 'C_chiral_H', 'H', d3, BOND_LENGTHS.CH, 1, {
    attachedToChiral: true,
  });
  void cChiral;

  return centerMolecule({
    id: 'ibuprofen',
    name: 'Ibuprofén',
    formula: 'C₁₃H₁₈O₂',
    atoms: b.atoms,
    bonds: b.bonds,
    chiralCenterIds: ['C_chiral'],
    description: 'Fájdalomcsillapító gyógyszerhatóanyag benzolgyűrűvel és izobutil-oldallánccal.',
  });
}
export const IBUPROFEN = buildIbuprofen();

// ---------------------------------------------------------------------------
// LEVEL 4 MOLECULES (ERYTHRITOL: HOCH2 - CH(OH) - CH(OH) - CH2OH, C4H10O4)
// ---------------------------------------------------------------------------

function buildErythritol(
  id: string,
  name: string,
  c2Handedness: 1 | -1,
  c3Handedness: 1 | -1,
  isMeso = false,
): MoleculeData {
  const b = new MoleculeBuilder();
  // Build in syn-periplanar (U-shaped) base geometry where C1-C2-C3-C4 lie in the XY plane:
  // C2 at (-0.77, 0, 0), C3 at (+0.77, 0, 0)
  // C1 at (-0.77 - 1.54*cos(70.5°), +1.54*sin(70.5°), 0)  [up-left]
  // C4 at (+0.77 + 1.54*cos(70.5°), +1.54*sin(70.5°), 0)  [up-right]
  // Look at that: the YZ plane at X = 0 is the exact mirror plane between C2 side and C3 side!
  const halfBond = BOND_LENGTHS.CC_SINGLE / 2;
  const c2 = b.addAtom('C2', 'C', [-halfBond, 0, 0], { isChiralCenter: true });
  const c3 = b.addAtom('C3', 'C', [halfBond, 0, 0], { isChiralCenter: true });
  b.addBond('C2', 'C3', 1);

  // Tetrahedral angle 109.47° from C2-C3 bond:
  const cosTet = -1 / 3;
  const sinTet = Math.sqrt(8) / 3;
  // C2->C3 is (+1, 0, 0). C2->C1 makes 109.47° with (+1,0,0), so x-component is -1/3, y-component is +sqrt(8)/3!
  const c2ToC1Dir: Vec3 = [cosTet, sinTet, 0];
  const c3ToC4Dir: Vec3 = [-cosTet, sinTet, 0];

  const c1 = b.extend('C2', 'C1', 'C', c2ToC1Dir, BOND_LENGTHS.CC_SINGLE);
  const c4 = b.extend('C3', 'C4', 'C', c3ToC4Dir, BOND_LENGTHS.CC_SINGLE);

  // On C2: existing dirs are (+1,0,0) [to C3] and c2ToC1Dir [to C1].
  // tetrahedralDirectionsFromTwo gives two dirs symmetric in ±Z!
  const [c2ZPlus, c2ZMinus] = tetrahedralDirectionsFromTwo([1, 0, 0], c2ToC1Dir, c2Handedness);
  b.addHydroxyl('C2', 'O2', c2ZPlus, [0, 1, 0]);
  b.extend('C2', 'C2_H', 'H', c2ZMinus, BOND_LENGTHS.CH, 1, { attachedToChiral: true });

  // On C3: existing dirs are (-1,0,0) [to C2] and c3ToC4Dir [to C4].
  // Note: cross((-1,0,0), (-cosTet, sinTet, 0)) = (0, 0, -sinTet) -> OPPOSITE Z sign to C2!
  // So if we pass `-c3Handedness` when we want same-Z (meso!), let's verify Z coordinate directly!
  const [c3A, c3B] = tetrahedralDirectionsFromTwo([-1, 0, 0], c3ToC4Dir, 1);
  const c3ZPlus = c3A[2] > 0 ? c3A : c3B;
  const c3ZMinus = c3A[2] > 0 ? c3B : c3A;

  // Determine C2's actual Z sign for OH:
  const c2OhIsPosZ = c2ZPlus[2] > 0;
  // If c3Handedness === c2Handedness -> SAME side in syn conformation -> MESO!
  // Wait: let's define `c3Handedness === 1` as OH on +Z, `-1` as OH on -Z!
  const c2OhDir = c2Handedness === 1 ? (c2ZPlus[2] > 0 ? c2ZPlus : c2ZMinus) : (c2ZPlus[2] < 0 ? c2ZPlus : c2ZMinus);
  const c2HDir = c2OhDir === c2ZPlus ? c2ZMinus : c2ZPlus;

  // Rebuild O2/C2_H cleanly using explicit Z check:
  void c2OhIsPosZ;

  // Actually, let's construct clean fresh builder so no duplicate atoms!
  const b2 = new MoleculeBuilder();
  b2.addAtom('C2', 'C', c2.position, { isChiralCenter: true });
  b2.addAtom('C3', 'C', c3.position, { isChiralCenter: true });
  b2.addBond('C2', 'C3', 1);
  b2.addAtom('C1', 'C', c1.position);
  b2.addBond('C2', 'C1', 1);
  b2.addAtom('C4', 'C', c4.position);
  b2.addBond('C3', 'C4', 1);

  const [c2P, c2M] = tetrahedralDirectionsFromTwo([1, 0, 0], c2ToC1Dir, 1);
  const c2PosZ = c2P[2] > 0 ? c2P : c2M;
  const c2NegZ = c2P[2] > 0 ? c2M : c2P;
  const oh2Dir = c2Handedness === 1 ? c2PosZ : c2NegZ;
  const h2Dir = c2Handedness === 1 ? c2NegZ : c2PosZ;
  b2.addHydroxyl('C2', 'O2', oh2Dir, [0, 1, 0]);
  b2.extend('C2', 'C2_H', 'H', h2Dir, BOND_LENGTHS.CH, 1, { attachedToChiral: true });

  const oh3Dir = c3Handedness === 1 ? c3ZPlus : c3ZMinus;
  const h3Dir = c3Handedness === 1 ? c3ZMinus : c3ZPlus;
  b2.addHydroxyl('C3', 'O3', oh3Dir, [0, -1, 0]);
  b2.extend('C3', 'C3_H', 'H', h3Dir, BOND_LENGTHS.CH, 1, { attachedToChiral: true });

  // Terminal -CH2OH groups: place O1 outward (-X) and O4 outward (+X) in XY plane!
  // Since C1->C2 is (+1/3, -sqrt(8)/3, 0), (-1, 0, 0) makes exact tetrahedral angle 109.47° with C1->C2!
  const o1Dir: Vec3 = [-1, 0, 0];
  b2.addHydroxyl('C1', 'O1', o1Dir, [0, 0, 1]);
  b2.saturateCarbonWithH('C1');

  // Mirror O1 direction across X=0 for C4 so meso has exact X=0 mirror symmetry!
  const o4Dir: Vec3 = [1, 0, 0];
  b2.addHydroxyl('C4', 'O4', o4Dir, [0, 0, -1]);
  b2.saturateCarbonWithH('C4');

  const base = centerMolecule({
    id,
    name,
    formula: 'C₄H₁₀O₄',
    atoms: b2.atoms,
    bonds: b2.bonds,
    chiralCenterIds: ['C2', 'C3'],
    rotatableBond: {
      atomA: 'C2',
      atomB: 'C3',
      defaultAngleDeg: 180,
      symmetryAngleDeg: 0,
    },
    symmetryPlane: isMeso
      ? {
          point: [0, 0, 0],
          normal: [1, 0, 0],
        }
      : undefined,
  });

  return base;
}

// Meso-erythritol: both OH on +Z in syn (0°) conformation -> internal mirror plane X=0!
// By default we display it in staggered (180°) conformation so its symmetry is NOT trivially obvious from a flat silhouette!
const ERITRIT_MESO_SYN = buildErythritol('eritrit_meso', 'Mezo-eritrit', 1, 1, true);
export const ERITRIT_MESO_STAGGERED: MoleculeData = {
  ...rotateConformationAroundBond(ERITRIT_MESO_SYN, 'C2', 'C3', 180),
  id: 'eritrit_meso',
  name: 'Eritrit – I. izomer',
  description: 'Két aszimmetrikus szénatomot tartalmazó sztereoizomer.',
};
export const ERITRIT_MESO_SYN_REF = ERITRIT_MESO_SYN;

// Rotated copy of meso-erythritol for 4.2 (same stereoisomer, rotated 155° in 3D space!)
export const ERITRIT_MESO_ALT_VIEW = rotateMoleculeRigid(
  rotateConformationAroundBond(ERITRIT_MESO_SYN, 'C2', 'C3', 180),
  'eritrit_meso_alt',
  'Eritrit – 3. modell',
  [0.4, 1, 0.2],
  165,
);

// Two chiral enantiomers (threitol pair): C2 +Z, C3 -Z and C2 -Z, C3 +Z
const ERITRIT_ENANT_A_SYN = buildErythritol('eritrit_enant_A', 'Eritrit – II. izomer', 1, -1, false);
export const ERITRIT_ENANT_A: MoleculeData = {
  ...rotateConformationAroundBond(ERITRIT_ENANT_A_SYN, 'C2', 'C3', 180),
  id: 'eritrit_enant_A',
  name: 'Eritrit – II. izomer',
};
export const ERITRIT_ENANT_B: MoleculeData = mirrorMolecule(
  ERITRIT_ENANT_A,
  'eritrit_enant_B',
  'Eritrit – III. izomer',
);

// ---------------------------------------------------------------------------
// FINAL MYSTERY MOLECULE: 2-hidroxibutánsav (CH3 - CH2 - CH(OH) - COOH, C4H8O3)
// ---------------------------------------------------------------------------

function buildHidroxibutansav(): MoleculeData {
  const b = new MoleculeBuilder();
  b.addAtom('C2', 'C', [0, 0, 0], { isChiralCenter: true });
  const tetDirs: Vec3[] = [
    [SIN_HT, COS_HT, 0],   // -COOH (C1)
    [-SIN_HT, COS_HT, 0],  // -CH2-CH3 (C3-C4)
    [0, -COS_HT, SIN_HT],  // -OH
    [0, -COS_HT, -SIN_HT], // -H
  ];
  b.addCarboxyl('C2', 'C1', tetDirs[0], [0, 0, 1]);
  const c3 = b.extend('C2', 'C3', 'C', tetDirs[1], BOND_LENGTHS.CC_SINGLE);
  const [c4Dir] = tetrahedralDirectionsFromOne(
    subVec([0, 0, 0], c3.position),
    Math.PI,
  );
  b.addMethyl('C3', 'C4', c4Dir, BOND_LENGTHS.CC_SINGLE);
  b.saturateCarbonWithH('C3');
  b.addHydroxyl('C2', 'O_oh', tetDirs[2], [1, 0, 0]);
  b.extend('C2', 'C2_H', 'H', tetDirs[3], BOND_LENGTHS.CH, 1, { attachedToChiral: true });
  return centerMolecule({
    id: 'hidroxibutansav_A',
    name: '2-hidroxibutánsav (A forma)',
    formula: 'C₄H₈O₃',
    atoms: b.atoms,
    bonds: b.bonds,
    chiralCenterIds: ['C2'],
    description: 'Négy szénatomos hidroxikarbonsav egy aszimmetrikus szénatommal (C2).',
  });
}

export const HIDROXIBUTANSAV_A = buildHidroxibutansav();
export const HIDROXIBUTANSAV_B = mirrorMolecule(
  HIDROXIBUTANSAV_A,
  'hidroxibutansav_B',
  '2-hidroxibutánsav (B forma)',
);

export const ALL_MOLECULES: MoleculeData[] = [
  HEXAN,
  DIMETILBUTAN_2_2,
  KLORPROPAN_1,
  KLORPROPAN_2,
  PROPANAL,
  PROPANON,
  PROP_2_EN_1_OL,
  BUTANSAV,
  METILPROPANSAV_2,
  BUTAN_1_OL,
  BUTAN_2_OL,
  METILPROPAN_1_OL,
  PROPANSAV,
  METIL_ACETAT,
  OLAJSAV,
  ELAIDINSAV,
  CISZ_FAHEJALDEHID,
  TRANSZ_FAHEJALDEHID,
  BUT_2_EN,
  KLORPROPEN_1,
  METILBUT_2_EN_2,
  LIMONEN_A,
  LIMONEN_B,
  TEJSAV_A,
  TEJSAV_B,
  NAPROXEN_A,
  NAPROXEN_B,
  IBUPROFEN,
  ERITRIT_MESO_STAGGERED,
  ERITRIT_MESO_ALT_VIEW,
  ERITRIT_ENANT_A,
  ERITRIT_ENANT_B,
  HIDROXIBUTANSAV_A,
  HIDROXIBUTANSAV_B,
];
