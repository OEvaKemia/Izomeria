import type {
  AtomData,
  BondData,
  ElementSymbol,
  MoleculeData,
  SubstituentGroup,
  Vec3,
} from '../types/chemistry';

export const BOND_LENGTHS = {
  CC_SINGLE: 1.54,
  CC_SP2: 1.5,
  CC_DOUBLE: 1.34,
  CC_AROM: 1.39,
  CH: 1.09,
  CO_SINGLE: 1.43,
  CO_DOUBLE: 1.22,
  OH: 0.96,
  CCl: 1.77,
  CN: 1.47,
  NH: 1.01,
} as const;

export const ELEMENT_RADII: Record<ElementSymbol, number> = {
  C: 0.42,
  H: 0.25,
  O: 0.39,
  N: 0.4,
  Cl: 0.5,
};

export const ELEMENT_COLORS: Record<ElementSymbol, string> = {
  C: '#333842', // sötétszürke
  H: '#F1F5F9', // fehér
  O: '#DC2626', // piros
  N: '#2563EB', // kék
  Cl: '#16A34A', // zöld
};

export const ELEMENT_NAMES_HU: Record<ElementSymbol, string> = {
  C: 'Szén (C)',
  H: 'Hidrogén (H)',
  O: 'Oxigén (O)',
  N: 'Nitrogén (N)',
  Cl: 'Klór (Cl)',
};

export const EXPECTED_VALENCE: Record<ElementSymbol, number> = {
  C: 4,
  H: 1,
  O: 2,
  N: 3,
  Cl: 1,
};

export function addVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function subVec(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scaleVec(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function dotVec(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossVec(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function lenVec(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

export function normVec(v: Vec3): Vec3 {
  const l = lenVec(v);
  if (l < 1e-9) return [1, 0, 0];
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Rotate vector `v` around unit axis `k` by `angleRad` (Rodrigues' formula). */
export function rotateAroundAxis(v: Vec3, k: Vec3, angleRad: number): Vec3 {
  const u = normVec(k);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const kCrossV = crossVec(u, v);
  const kDotV = dotVec(u, v);
  return [
    v[0] * cos + kCrossV[0] * sin + u[0] * kDotV * (1 - cos),
    v[1] * cos + kCrossV[1] * sin + u[1] * kDotV * (1 - cos),
    v[2] * cos + kCrossV[2] * sin + u[2] * kDotV * (1 - cos),
  ];
}

/** Orthogonal unit vector perpendicular to `v`. */
export function perpUnit(v: Vec3): Vec3 {
  const u = normVec(v);
  const ref: Vec3 = Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
  return normVec(crossVec(u, ref));
}

/**
 * Compute directions for the remaining 3 bonds of a tetrahedral sp3 atom
 * given one already-placed bond vector `existingDir` (pointing FROM center TO neighbor).
 * `torsionRad` rotates the 3 directions around `existingDir`.
 */
export function tetrahedralDirectionsFromOne(
  existingDir: Vec3,
  torsionRad = 0,
): [Vec3, Vec3, Vec3] {
  const d0 = normVec(existingDir);
  const back = scaleVec(d0, -1); // direction opposite to existing bond
  // Angle from `d0` is 109.4712° -> cos = -1/3, sin = sqrt(8)/3
  // Relative to `back`, angle is 70.5288° -> cos = 1/3, sin = sqrt(8)/3
  const cosA = 1 / 3;
  const sinA = Math.sqrt(8) / 3;
  const e1 = perpUnit(d0);
  const e2 = normVec(crossVec(d0, e1));

  const makeDir = (phi: number): Vec3 => {
    const radial = addVec(scaleVec(e1, Math.cos(phi)), scaleVec(e2, Math.sin(phi)));
    return normVec(addVec(scaleVec(back, cosA), scaleVec(radial, sinA)));
  };

  return [
    makeDir(torsionRad),
    makeDir(torsionRad + (2 * Math.PI) / 3),
    makeDir(torsionRad + (4 * Math.PI) / 3),
  ];
}

/**
 * Compute directions for the remaining 2 bonds of a tetrahedral sp3 atom
 * given TWO existing bond directions `dir1` and `dir2` (pointing FROM center TO neighbors).
 * `handedness` (+1 or -1) determines which side of the (dir1, dir2) plane gets the first vs second substituent.
 */
export function tetrahedralDirectionsFromTwo(
  dir1: Vec3,
  dir2: Vec3,
  handedness: 1 | -1 = 1,
): [Vec3, Vec3] {
  const u1 = normVec(dir1);
  const u2 = normVec(dir2);
  const bisector = normVec(addVec(u1, u2));
  const negBisector = scaleVec(bisector, -1);
  const planeNormal = normVec(crossVec(u1, u2));
  // For exact tetrahedral angle 109.47°, the two remaining bonds lie in the plane spanned by
  // `negBisector` and `planeNormal` at ±54.7356° from `negBisector`.
  const halfTet = Math.acos(-1 / 3) / 2; // 54.7356°
  const cosH = Math.cos(halfTet);
  const sinH = Math.sin(halfTet);

  const outA = normVec(
    addVec(scaleVec(negBisector, cosH), scaleVec(planeNormal, handedness * sinH)),
  );
  const outB = normVec(
    addVec(scaleVec(negBisector, cosH), scaleVec(planeNormal, -handedness * sinH)),
  );
  return [outA, outB];
}

/**
 * Compute the 2 remaining directions of a trigonal planar sp2 atom
 * given one existing bond direction `existingDir` (center -> neighbor) and plane normal `normal`.
 */
export function trigonalDirectionsFromOne(
  existingDir: Vec3,
  normal: Vec3 = [0, 0, 1],
): [Vec3, Vec3] {
  const u = normVec(existingDir);
  const n = normVec(normal);
  const m = normVec(crossVec(n, u));
  const cos60 = 0.5;
  const sin60 = Math.sqrt(3) / 2;
  const back = scaleVec(u, -1);
  const dirPlus = normVec(addVec(scaleVec(back, cos60), scaleVec(m, sin60)));
  const dirMinus = normVec(addVec(scaleVec(back, cos60), scaleVec(m, -sin60)));
  return [dirPlus, dirMinus];
}

/**
 * Helper class for building chemically accurate 3D molecules cleanly.
 */
export class MoleculeBuilder {
  atoms: AtomData[] = [];
  bonds: BondData[] = [];
  private atomMap = new Map<string, AtomData>();
  private hCounter = 0;

  addAtom(
    id: string,
    element: ElementSymbol,
    position: Vec3,
    extra: Partial<AtomData> = {},
  ): AtomData {
    const atom: AtomData = {
      id,
      element,
      position: [
        Number(position[0].toFixed(4)),
        Number(position[1].toFixed(4)),
        Number(position[2].toFixed(4)),
      ],
      ...extra,
    };
    this.atoms.push(atom);
    this.atomMap.set(id, atom);
    return atom;
  }

  getAtom(id: string): AtomData {
    const a = this.atomMap.get(id);
    if (!a) throw new Error(`Atom ${id} not found`);
    return a;
  }

  addBond(from: string, to: string, order: 1 | 2 | 3 = 1): BondData {
    const bond: BondData = {
      id: `${from}-${to}`,
      from,
      to,
      order,
    };
    this.bonds.push(bond);
    return bond;
  }

  /** Place a child atom at distance `length` along `dir` from `parentId`, and bond them. */
  extend(
    parentId: string,
    childId: string,
    element: ElementSymbol,
    dir: Vec3,
    length: number,
    order: 1 | 2 | 3 = 1,
    extra: Partial<AtomData> = {},
  ): AtomData {
    const parent = this.getAtom(parentId);
    const pos = addVec(parent.position, scaleVec(normVec(dir), length));
    const atom = this.addAtom(childId, element, pos, extra);
    this.addBond(parentId, childId, order);
    return atom;
  }

  /** Fill remaining sp3 hydrogens on an atom that already has 1, 2, or 3 bonds. */
  saturateCarbonWithH(
    carbonId: string,
    torsionRad = 0,
    markAttachedToChiral = false,
  ): void {
    const carbon = this.getAtom(carbonId);
    const neighbors = this.getNeighborIds(carbonId);
    if (neighbors.length === 0) {
      const dirs: Vec3[] = [
        [1, 1, 1],
        [1, -1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
      ];
      dirs.forEach((d) => {
        this.hCounter++;
        this.extend(
          carbonId,
          `${carbonId}_H${this.hCounter}`,
          'H',
          d,
          BOND_LENGTHS.CH,
          1,
          markAttachedToChiral ? { attachedToChiral: true } : {},
        );
      });
      return;
    }

    if (neighbors.length === 1) {
      const nPos = this.getAtom(neighbors[0]).position;
      const existingDir = subVec(nPos, carbon.position);
      const dirs = tetrahedralDirectionsFromOne(existingDir, torsionRad);
      dirs.forEach((d) => {
        this.hCounter++;
        this.extend(
          carbonId,
          `${carbonId}_H${this.hCounter}`,
          'H',
          d,
          BOND_LENGTHS.CH,
          1,
          markAttachedToChiral ? { attachedToChiral: true } : {},
        );
      });
      return;
    }

    if (neighbors.length === 2) {
      const d1 = subVec(this.getAtom(neighbors[0]).position, carbon.position);
      const d2 = subVec(this.getAtom(neighbors[1]).position, carbon.position);
      const [h1, h2] = tetrahedralDirectionsFromTwo(d1, d2, 1);
      [h1, h2].forEach((d) => {
        this.hCounter++;
        this.extend(
          carbonId,
          `${carbonId}_H${this.hCounter}`,
          'H',
          d,
          BOND_LENGTHS.CH,
          1,
          markAttachedToChiral ? { attachedToChiral: true } : {},
        );
      });
      return;
    }

    if (neighbors.length === 3) {
      const d1 = normVec(subVec(this.getAtom(neighbors[0]).position, carbon.position));
      const d2 = normVec(subVec(this.getAtom(neighbors[1]).position, carbon.position));
      const d3 = normVec(subVec(this.getAtom(neighbors[2]).position, carbon.position));
      const sum = addVec(addVec(d1, d2), d3);
      const hDir = normVec(scaleVec(sum, -1));
      this.hCounter++;
      this.extend(
        carbonId,
        `${carbonId}_H${this.hCounter}`,
        'H',
        hDir,
        BOND_LENGTHS.CH,
        1,
        markAttachedToChiral ? { attachedToChiral: true } : {},
      );
    }
  }

  /** Add methyl group (-CH3) at `carbonId` in direction `dir`. */
  addMethyl(
    parentId: string,
    methylCId: string,
    dir: Vec3,
    length: number = BOND_LENGTHS.CC_SINGLE,
    torsionRad = Math.PI / 3,
  ): AtomData {
    const c = this.extend(parentId, methylCId, 'C', dir, length, 1);
    this.saturateCarbonWithH(methylCId, torsionRad);
    return c;
  }

  /** Add hydroxyl group (-OH) at `parentId` in direction `dir`. */
  addHydroxyl(
    parentId: string,
    oId: string,
    dir: Vec3,
    hTorsionVec: Vec3 = [0, 0, 1],
  ): AtomData {
    const o = this.extend(parentId, oId, 'O', dir, BOND_LENGTHS.CO_SINGLE, 1);
    const parentPos = this.getAtom(parentId).position;
    const coDir = normVec(subVec(parentPos, o.position)); // O -> parent
    const perp = normVec(crossVec(coDir, hTorsionVec));
    const m = lenVec(perp) > 0.1 ? perp : perpUnit(coDir);
    // C-O-H bond angle ~109.5°
    const hDir = normVec(
      addVec(scaleVec(coDir, Math.cos((109.5 * Math.PI) / 180)), scaleVec(m, Math.sin((109.5 * Math.PI) / 180))),
    );
    this.extend(oId, `${oId}_H`, 'H', hDir, BOND_LENGTHS.OH, 1);
    return o;
  }

  /** Add carboxyl group (-COOH) at `parentId` along `dir`. */
  addCarboxyl(
    parentId: string,
    cId: string,
    dir: Vec3,
    planeNormal: Vec3 = [0, 0, 1],
  ): AtomData {
    const c = this.extend(parentId, cId, 'C', dir, BOND_LENGTHS.CC_SP2, 1);
    const backToParent = scaleVec(normVec(dir), -1);
    const [dO1, dO2] = trigonalDirectionsFromOne(backToParent, planeNormal);
    this.extend(cId, `${cId}_O1`, 'O', dO1, BOND_LENGTHS.CO_DOUBLE, 2);
    const o2 = this.extend(cId, `${cId}_O2`, 'O', dO2, BOND_LENGTHS.CO_SINGLE, 1);
    // H pointing outward away from =O
    const o2Back = normVec(subVec(c.position, o2.position));
    const hDir = normVec(addVec(scaleVec(o2Back, -0.34), scaleVec(normVec(dir), 0.94)));
    this.extend(`${cId}_O2`, `${cId}_OH_H`, 'H', hDir, BOND_LENGTHS.OH, 1);
    return c;
  }

  getNeighborIds(atomId: string): string[] {
    const res: string[] = [];
    for (const b of this.bonds) {
      if (b.from === atomId) res.push(b.to);
      else if (b.to === atomId) res.push(b.from);
    }
    return res;
  }
}

/** Center molecule coordinates around centroid at [0,0,0]. */
export function centerMolecule(mol: MoleculeData): MoleculeData {
  if (mol.atoms.length === 0) return mol;
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const a of mol.atoms) {
    sx += a.position[0];
    sy += a.position[1];
    sz += a.position[2];
  }
  const n = mol.atoms.length;
  const cx = sx / n;
  const cy = sy / n;
  const cz = sz / n;

  return {
    ...mol,
    atoms: mol.atoms.map((a) => ({
      ...a,
      position: [
        Number((a.position[0] - cx).toFixed(4)),
        Number((a.position[1] - cy).toFixed(4)),
        Number((a.position[2] - cz).toFixed(4)),
      ],
    })),
    symmetryPlane: mol.symmetryPlane
      ? {
          ...mol.symmetryPlane,
          point: [
            mol.symmetryPlane.point[0] - cx,
            mol.symmetryPlane.point[1] - cy,
            mol.symmetryPlane.point[2] - cz,
          ],
        }
      : undefined,
  };
}

/**
 * Create an exact mirror-image enantiomer of a molecule by reflecting across the X=0 (YZ) plane
 * (or custom axis). Preserves bond lengths, angles, and connectivity while inverting all chiral centers.
 */
export function mirrorMolecule(
  mol: MoleculeData,
  newId: string,
  newName: string,
  axis: 'x' | 'y' | 'z' = 'x',
): MoleculeData {
  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
  return {
    ...mol,
    id: newId,
    name: newName,
    atoms: mol.atoms.map((a) => {
      const pos: Vec3 = [...a.position];
      pos[idx] = -pos[idx];
      return { ...a, position: pos };
    }),
  };
}

/**
 * Rotate all atoms of a molecule rigidly in 3D space (e.g. for presenting the same stereoisomer
 * from a completely different viewing orientation in Level 4.2).
 */
export function rotateMoleculeRigid(
  mol: MoleculeData,
  newId: string,
  newName: string,
  axis: Vec3,
  angleDeg: number,
): MoleculeData {
  const rad = (angleDeg * Math.PI) / 180;
  const k = normVec(axis);
  return {
    ...mol,
    id: newId,
    name: newName,
    atoms: mol.atoms.map((a) => ({
      ...a,
      position: rotateAroundAxis(a.position, k, rad),
    })),
  };
}

/**
 * Perform a chemically valid single-bond conformational rotation around bond (atomA -> atomB)
 * by rotating the connected component on the `atomB` side by `angleDeg`.
 */
export function rotateConformationAroundBond(
  mol: MoleculeData,
  atomAId: string,
  atomBId: string,
  angleDeg: number,
): MoleculeData {
  if (Math.abs(angleDeg) < 1e-4) return mol;
  const atomA = mol.atoms.find((a) => a.id === atomAId);
  const atomB = mol.atoms.find((a) => a.id === atomBId);
  if (!atomA || !atomB) return mol;

  // BFS from atomB without crossing edge (atomA, atomB)
  const adj = new Map<string, string[]>();
  for (const a of mol.atoms) adj.set(a.id, []);
  for (const b of mol.bonds) {
    if ((b.from === atomAId && b.to === atomBId) || (b.from === atomBId && b.to === atomAId)) {
      continue;
    }
    adj.get(b.from)?.push(b.to);
    adj.get(b.to)?.push(b.from);
  }

  const movingSet = new Set<string>();
  const queue = [atomBId];
  movingSet.add(atomBId);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const next of adj.get(curr) || []) {
      if (!movingSet.has(next)) {
        movingSet.add(next);
        queue.push(next);
      }
    }
  }

  const axis = normVec(subVec(atomB.position, atomA.position));
  const origin = atomB.position;
  const rad = (angleDeg * Math.PI) / 180;

  return {
    ...mol,
    atoms: mol.atoms.map((a) => {
      if (!movingSet.has(a.id)) return a;
      const rel = subVec(a.position, origin);
      const rot = rotateAroundAxis(rel, axis, rad);
      return {
        ...a,
        position: addVec(origin, rot),
      };
    }),
  };
}

const SUBSTITUENT_PALETTE = [
  '#06B6D4', // cyan
  '#F59E0B', // amber
  '#10B981', // emerald
  '#EC4899', // pink
];

/**
 * Analyze the substituent branches attached to a selected atom (for inspecting chiral centers or C=C carbons).
 */
export function getSubstituentsAtAtom(
  mol: MoleculeData,
  centerAtomId: string,
): SubstituentGroup[] {
  const adj = new Map<string, string[]>();
  for (const a of mol.atoms) adj.set(a.id, []);
  for (const b of mol.bonds) {
    adj.get(b.from)?.push(b.to);
    adj.get(b.to)?.push(b.from);
  }

  const directNeighbors = adj.get(centerAtomId) || [];
  const atomById = new Map(mol.atoms.map((a) => [a.id, a]));

  // Check if center is inside a cycle: if two branches meet, handle gracefully via shortest-depth or non-overlapping BFS
  return directNeighbors.map((rootId, idx) => {
    const visited = new Set<string>([centerAtomId, rootId]);
    const queue = [rootId];
    const branchIds = [rootId];

    // Limit cyclic runaway by stopping if we hit another direct neighbor of centerAtomId
    const otherRoots = new Set(directNeighbors.filter((id) => id !== rootId));
    let isRingPath = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const next of adj.get(curr) || []) {
        if (otherRoots.has(next)) {
          isRingPath = true;
          continue;
        }
        if (!visited.has(next)) {
          visited.add(next);
          branchIds.push(next);
          queue.push(next);
        }
      }
    }

    const counts: Partial<Record<ElementSymbol, number>> = {};
    for (const id of branchIds) {
      const el = atomById.get(id)?.element;
      if (el) counts[el] = (counts[el] || 0) + 1;
    }

    const rootEl = atomById.get(rootId)?.element || 'C';
    const formulaLabel = formatSubstituentLabel(
      rootId,
      branchIds,
      counts,
      atomById,
      adj,
      centerAtomId,
      isRingPath,
    );

    return {
      rootAtomId: rootId,
      rootElement: rootEl,
      atomIds: branchIds,
      formulaLabel,
      color: SUBSTITUENT_PALETTE[idx % SUBSTITUENT_PALETTE.length],
    };
  });
}

function formatSubstituentLabel(
  rootId: string,
  branchIds: string[],
  counts: Partial<Record<ElementSymbol, number>>,
  atomById: Map<string, AtomData>,
  adj: Map<string, string[]>,
  centerAtomId: string,
  isRingPath: boolean,
): string {
  const rootAtom = atomById.get(rootId);
  if (!rootAtom) return '–?';

  if (branchIds.length === 1) {
    return `–${rootAtom.element}`;
  }

  // Common organic functional groups
  const c = counts.C || 0;
  const h = counts.H || 0;
  const o = counts.O || 0;
  const cl = counts.Cl || 0;
  const n = counts.N || 0;

  if (rootAtom.element === 'O' && c === 0 && h === 1 && o === 1) return '–OH';
  if (rootAtom.element === 'C' && c === 1 && h === 3 && o === 0 && cl === 0) return '–CH₃';
  if (rootAtom.element === 'C' && c === 1 && h === 1 && o === 2) return '–COOH';
  if (rootAtom.element === 'C' && c === 1 && h === 1 && o === 1) return '–CHO';
  if (rootAtom.element === 'C' && c === 1 && h === 3 && o === 1) return '–CH₂OH';
  if (rootAtom.element === 'C' && c === 2 && h === 5 && o === 0) return '–CH₂CH₃';
  if (isRingPath) {
    const rootNeighbors = (adj.get(rootId) || []).filter((id) => id !== centerAtomId);
    const hasDouble = rootNeighbors.some((id) => atomById.get(id)?.element === 'C');
    return hasDouble ? 'Gyűrűlánc (–CH₂–…)' : 'Gyűrűág';
  }

  const parts: string[] = [];
  if (c > 0) parts.push(`C${c > 1 ? toSubscript(c) : ''}`);
  if (h > 0) parts.push(`H${h > 1 ? toSubscript(h) : ''}`);
  if (o > 0) parts.push(`O${o > 1 ? toSubscript(o) : ''}`);
  if (n > 0) parts.push(`N${n > 1 ? toSubscript(n) : ''}`);
  if (cl > 0) parts.push(`Cl${cl > 1 ? toSubscript(cl) : ''}`);
  return `–${parts.join('')}`;
}

export function toSubscript(n: number): string {
  const subs = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  return String(n)
    .split('')
    .map((d) => subs[Number(d)] ?? d)
    .join('');
}

/**
 * Signed tetrahedral volume of the 4 neighbors around a chiral atom (used for deterministic chirality verification).
 */
export function signedChiralVolume(mol: MoleculeData, centerId: string): number {
  const adj: string[] = [];
  for (const b of mol.bonds) {
    if (b.from === centerId) adj.push(b.to);
    else if (b.to === centerId) adj.push(b.from);
  }
  if (adj.length !== 4) return 0;
  const p = adj.map((id) => mol.atoms.find((a) => a.id === id)!.position);
  const v1 = subVec(p[1], p[0]);
  const v2 = subVec(p[2], p[0]);
  const v3 = subVec(p[3], p[0]);
  return dotVec(v1, crossVec(v2, v3));
}
