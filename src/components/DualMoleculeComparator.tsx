import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { FlipHorizontal2, Layers, RotateCw } from 'lucide-react';
import type { MoleculeData, Vec3 } from '../types/chemistry';
import { ELEMENT_COLORS, ELEMENT_RADII, rotateAroundAxis } from '../utils/chemistryGeometry';
import { MoleculeViewer } from './MoleculeViewer';

interface DualMoleculeComparatorProps {
  leftMolecule: MoleculeData;
  rightMolecule: MoleculeData;
  leftLabel?: string;
  rightLabel?: string;
  leftSublabel?: string;
  rightSublabel?: string;
  selectableLeft?: boolean;
  selectableRight?: boolean;
  selectedLeftAtomIds?: string[];
  selectedRightAtomIds?: string[];
  onSelectLeftAtom?: (atomId: string) => void;
  onSelectRightAtom?: (atomId: string) => void;
  allowOverlayAttempt?: boolean;
  allowMirrorPlaneToggle?: boolean;
  keepChiralHydrogens?: boolean;
}

function OverlayStage({
  molA,
  molB,
  rotB,
  offsetX,
}: {
  molA: MoleculeData;
  molB: MoleculeData;
  rotB: Vec3;
  offsetX: number;
}) {
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 16), []);
  const cylGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 12, 1), []);

  const transformedB = useMemo(() => {
    const rx = (rotB[0] * Math.PI) / 180;
    const ry = (rotB[1] * Math.PI) / 180;
    const rz = (rotB[2] * Math.PI) / 180;
    return molB.atoms.map((a) => {
      let p = rotateAroundAxis(a.position, [1, 0, 0], rx);
      p = rotateAroundAxis(p, [0, 1, 0], ry);
      p = rotateAroundAxis(p, [0, 0, 1], rz);
      return { ...a, position: [p[0] + offsetX, p[1], p[2]] as Vec3 };
    });
  }, [molB, rotB, offsetX]);

  const mapA = useMemo(() => new Map(molA.atoms.map((a) => [a.id, a])), [molA]);
  const mapB = useMemo(() => new Map(transformedB.map((a) => [a.id, a])), [transformedB]);

  const renderBonds = (mol: MoleculeData, map: Map<string, { position: Vec3 }>, tint: string) =>
    mol.bonds.map((b) => {
      const a1 = map.get(b.from);
      const a2 = map.get(b.to);
      if (!a1 || !a2) return null;
      const p1 = new THREE.Vector3(...a1.position);
      const p2 = new THREE.Vector3(...a2.position);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1);
      const len = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      );
      return (
        <mesh
          key={`${mol.id}-${b.id}`}
          position={mid}
          quaternion={quat}
          geometry={cylGeo}
          scale={[0.072, len, 0.072]}
        >
          <meshStandardMaterial color={tint} roughness={0.35} transparent opacity={0.85} />
        </mesh>
      );
    });

  return (
    <group>
      {/* Molecule A (anchored with cyan tint ring) */}
      <group position={[-offsetX, 0, 0]}>
        {molA.atoms.map((a) => {
          const r = ELEMENT_RADII[a.element];
          return (
            <mesh key={`A-${a.id}`} position={a.position} geometry={sphereGeo} scale={[r, r, r]}>
              <meshStandardMaterial color={ELEMENT_COLORS[a.element]} roughness={0.32} />
            </mesh>
          );
        })}
        {renderBonds(molA, mapA, '#38BDF8')}
      </group>

      {/* Molecule B (user-rotated with amber tint bonds so overlap differences stand out) */}
      <group>
        {transformedB.map((a) => {
          const r = ELEMENT_RADII[a.element] * 0.96;
          return (
            <mesh key={`B-${a.id}`} position={a.position} geometry={sphereGeo} scale={[r, r, r]}>
              <meshStandardMaterial
                color={ELEMENT_COLORS[a.element]}
                roughness={0.32}
                emissive="#F59E0B"
                emissiveIntensity={0.22}
              />
            </mesh>
          );
        })}
        {renderBonds(molB, mapB, '#F59E0B')}
      </group>
    </group>
  );
}

export const DualMoleculeComparator: React.FC<DualMoleculeComparatorProps> = ({
  leftMolecule,
  rightMolecule,
  leftLabel,
  rightLabel,
  leftSublabel,
  rightSublabel,
  selectableLeft = false,
  selectableRight = false,
  selectedLeftAtomIds = [],
  selectedRightAtomIds = [],
  onSelectLeftAtom,
  onSelectRightAtom,
  allowOverlayAttempt = false,
  allowMirrorPlaneToggle = false,
  keepChiralHydrogens = true,
}) => {
  const [mode, setMode] = useState<'split' | 'overlay'>('split');
  const [showMirrorPlane, setShowMirrorPlane] = useState(false);
  const [rotB, setRotB] = useState<Vec3>([0, 180, 0]);
  const [overlapProgress, setOverlapProgress] = useState(100); // 100 = fully overlapped at origin

  const offsetX = ((100 - overlapProgress) / 100) * 2.2;

  return (
    <div className="space-y-3">
      {(allowOverlayAttempt || allowMirrorPlaneToggle) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#0F172A]">
          <div className="flex flex-wrap items-center gap-2">
            {allowOverlayAttempt && (
              <div className="inline-flex rounded-lg bg-[#080D16] p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('split')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[34px] whitespace-nowrap ${
                    mode === 'split'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Külön nézet (egymás mellett)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('overlay')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[34px] whitespace-nowrap ${
                    mode === 'overlay'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Fedésbe hozási próba
                </button>
              </div>
            )}

            {allowMirrorPlaneToggle && mode === 'split' && (
              <button
                type="button"
                onClick={() => setShowMirrorPlane((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[36px] whitespace-nowrap ${
                  showMirrorPlane
                    ? 'border-teal-400/70 bg-teal-500/15 text-teal-300'
                    : 'border-slate-700 text-slate-300 hover:border-teal-500/50'
                }`}
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
                {showMirrorPlane ? 'Tükörsík elrejtése' : 'Tükörsík megjelenítése'}
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400">
            {mode === 'overlay'
              ? 'Forgasd a B molekulát (sárga kötések), és próbáld pontosan fedésbe hozni az A-val (cián kötések)!'
              : 'Mindkét 3D molekula egymástól függetlenül forgatható és nagyítható.'}
          </span>
        </div>
      )}

      {mode === 'split' ? (
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
          <MoleculeViewer
            molecule={leftMolecule}
            label={leftLabel ?? leftMolecule.name}
            sublabel={leftSublabel ?? leftMolecule.formula}
            heightClass="h-[290px] sm:h-[340px] lg:h-[380px]"
            selectable={selectableLeft}
            selectedAtomIds={selectedLeftAtomIds}
            onSelectAtom={onSelectLeftAtom}
            keepChiralHydrogens={keepChiralHydrogens}
          />

          {showMirrorPlane && (
            <div className="hidden md:flex pointer-events-none absolute inset-y-6 left-1/2 -translate-x-1/2 z-10 flex-col items-center justify-center">
              <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-400/80 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              <span className="mt-1 px-2 py-0.5 rounded bg-[#080D16] border border-cyan-500/50 text-[10px] font-mono-tabular text-cyan-300">
                TÜKÖRSÍK
              </span>
            </div>
          )}

          <MoleculeViewer
            molecule={rightMolecule}
            label={rightLabel ?? rightMolecule.name}
            sublabel={rightSublabel ?? rightMolecule.formula}
            heightClass="h-[290px] sm:h-[340px] lg:h-[380px]"
            selectable={selectableRight}
            selectedAtomIds={selectedRightAtomIds}
            onSelectAtom={onSelectRightAtom}
            keepChiralHydrogens={keepChiralHydrogens}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#0B1220] overflow-hidden">
          <div className="h-[340px] sm:h-[400px] w-full canvas-touch-surface bg-[#070C16] relative">
            <Canvas
              frameloop="always"
              camera={{ fov: 40, position: [0, 1.8, 8.2] }}
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            >
              <color attach="background" args={['#070C16']} />
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 6]} intensity={1.2} />
              <directionalLight position={[-5, -4, -5]} intensity={0.5} color="#38BDF8" />
              <OverlayStage
                molA={leftMolecule}
                molB={rightMolecule}
                rotB={rotB}
                offsetX={offsetX}
              />
              <OrbitControls
                enablePan={false}
                touches={{
                  ONE: THREE.TOUCH.ROTATE,
                  TWO: THREE.TOUCH.DOLLY_PAN,
                }}
              />
            </Canvas>

            <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-3 text-xs bg-[#080D16]/90 px-3 py-1.5 rounded border border-slate-800">
              <span className="text-cyan-300 font-medium">A molekula (rögzített, cián)</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-300 font-medium">B molekula (forgatott, sárga)</span>
            </div>
          </div>

          {/* Independent rotation controls for Molecule B */}
          <div className="p-3.5 bg-[#0F172A] border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
            <label className="flex flex-col gap-1 text-xs">
              <span className="flex justify-between text-slate-300">
                <span>B forgatás X tengely</span>
                <span className="font-mono-tabular text-amber-300">{rotB[0]}°</span>
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={rotB[0]}
                onChange={(e) => setRotB([Number(e.target.value), rotB[1], rotB[2]])}
                className="accent-amber-400 cursor-pointer"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="flex justify-between text-slate-300">
                <span>B forgatás Y tengely</span>
                <span className="font-mono-tabular text-amber-300">{rotB[1]}°</span>
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={rotB[1]}
                onChange={(e) => setRotB([rotB[0], Number(e.target.value), rotB[2]])}
                className="accent-amber-400 cursor-pointer"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="flex justify-between text-slate-300">
                <span>B forgatás Z tengely</span>
                <span className="font-mono-tabular text-amber-300">{rotB[2]}°</span>
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={rotB[2]}
                onChange={(e) => setRotB([rotB[0], rotB[1], Number(e.target.value)])}
                className="accent-amber-400 cursor-pointer"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col gap-1 text-xs">
                <span className="flex justify-between text-slate-300">
                  <span>Átfedés közelsége</span>
                  <span className="font-mono-tabular text-cyan-300">{overlapProgress}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={overlapProgress}
                  onChange={(e) => setOverlapProgress(Number(e.target.value))}
                  className="accent-cyan-400 cursor-pointer"
                />
              </label>
              <button
                type="button"
                onClick={() => setRotB([0, 180, 0])}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:border-amber-400/60"
              >
                <RotateCw className="w-3 h-3" />
                180°-os forgatás alaphelyzetbe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
