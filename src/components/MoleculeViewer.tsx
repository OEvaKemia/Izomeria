import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Eye, EyeOff, Layers, RotateCcw } from 'lucide-react';
import type { AtomData, BondData, MoleculeData, SubstituentGroup, Vec3 } from '../types/chemistry';
import {
  ELEMENT_COLORS,
  ELEMENT_NAMES_HU,
  ELEMENT_RADII,
  crossVec,
  getSubstituentsAtAtom,
  lenVec,
  normVec,
  perpUnit,
  subVec,
} from '../utils/chemistryGeometry';

const IS_SOFTWARE_GL = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

interface MoleculeViewerProps {
  molecule: MoleculeData;
  heightClass?: string;
  selectable?: boolean;
  selectedAtomIds?: string[];
  onSelectAtom?: (atomId: string) => void;
  showHydrogensDefault?: boolean;
  keepChiralHydrogens?: boolean;
  allowHydrogenToggle?: boolean;
  allowSubstituentInspect?: boolean;
  showSymmetryPlane?: boolean;
  showExternalMirrorPlane?: boolean;
  highlightedAtomIds?: string[];
  highlightColor?: string;
  label?: string;
  sublabel?: string;
  /** Initial rigid rotation in degrees [x, y, z] */
  initialRotation?: Vec3;
  /** External controlled camera reset token */
  resetToken?: number;
  /** Optional interactive extra toolbar controls */
  extraControls?: React.ReactNode;
}

const ZERO_ROTATION: Vec3 = [0, 0, 0];
const CAMERA_CONFIG = { fov: 40, near: 0.05, far: 150, position: [0, 1.5, 8] as Vec3 };
const GL_CONFIG = {
  antialias: !IS_SOFTWARE_GL,
  powerPreference: 'high-performance' as const,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.12,
};
const TOUCH_CONFIG = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
};
const NO_RAYCAST = () => null;

function SceneEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    room.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function InvalidateOnChange({ deps }: { deps: unknown[] }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
}

function CameraAutoFit({
  moleculeId,
  radius,
  resetSignal,
  controlsRef,
}: {
  moleculeId: string;
  radius: number;
  resetSignal: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, invalidate } = useThree();
  const radiusRef = useRef(radius);
  radiusRef.current = radius;

  useEffect(() => {
    const r = radiusRef.current;
    const dist = Math.max(5.2, r * 2.35 + 1.8);
    camera.position.set(dist * 0.28, dist * 0.22, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    invalidate();
  }, [moleculeId, resetSignal, camera, controlsRef, invalidate]);
  return null;
}

function getDoubleBondOffsetDir(
  bond: BondData,
  atomMap: Map<string, AtomData>,
  adjMap: Map<string, string[]>,
): Vec3 {
  const a1 = atomMap.get(bond.from);
  const a2 = atomMap.get(bond.to);
  if (!a1 || !a2) return [0, 1, 0];
  const bondVec = normVec(subVec(a2.position, a1.position));

  // Find a third neighbor to determine the sp2 molecular plane!
  const neighbors = [
    ...(adjMap.get(bond.from) || []).filter((id) => id !== bond.to),
    ...(adjMap.get(bond.to) || []).filter((id) => id !== bond.from),
  ];
  for (const nid of neighbors) {
    const nAtom = atomMap.get(nid);
    if (!nAtom) continue;
    const toN = subVec(nAtom.position, a1.position);
    const normal = crossVec(bondVec, toN);
    if (lenVec(normal) > 0.1) {
      return normVec(crossVec(normal, bondVec));
    }
  }
  return perpUnit(bondVec);
}

interface ComputedBondMesh {
  id: string;
  order: 1 | 2 | 3;
  length: number;
  quaternion: THREE.Quaternion;
  positions: THREE.Vector3[];
  bothHighlighted: boolean;
}

interface MoleculeMeshGroupProps {
  molecule: MoleculeData;
  showHydrogens: boolean;
  keepChiralHydrogens: boolean;
  selectable: boolean;
  selectedAtomIds: string[];
  highlightedSet: Set<string>;
  highlightColor: string;
  onSelectAtom?: (atomId: string) => void;
  onHoverAtom?: (atom: AtomData | null) => void;
  showSymmetryPlane: boolean;
  showExternalMirrorPlane: boolean;
  initialRotation?: Vec3;
}

function MoleculeMeshGroup({
  molecule,
  showHydrogens,
  keepChiralHydrogens,
  selectable,
  selectedAtomIds,
  highlightedSet,
  highlightColor,
  onSelectAtom,
  onHoverAtom,
  showSymmetryPlane,
  showExternalMirrorPlane,
  initialRotation,
}: MoleculeMeshGroupProps) {
  const { invalidate } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const selectedSet = useMemo(() => new Set(selectedAtomIds), [selectedAtomIds]);

  const atomMap = useMemo(
    () => new Map(molecule.atoms.map((a) => [a.id, a])),
    [molecule.atoms],
  );

  const adjMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of molecule.atoms) m.set(a.id, []);
    for (const b of molecule.bonds) {
      m.get(b.from)?.push(b.to);
      m.get(b.to)?.push(b.from);
    }
    return m;
  }, [molecule]);

  const visibleAtoms = useMemo(() => {
    return molecule.atoms.filter((a) => {
      if (a.element !== 'H') return true;
      if (showHydrogens) return true;
      if (keepChiralHydrogens && a.attachedToChiral) return true;
      return false;
    });
  }, [molecule.atoms, showHydrogens, keepChiralHydrogens]);

  const visibleAtomSet = useMemo(
    () => new Set(visibleAtoms.map((a) => a.id)),
    [visibleAtoms],
  );

  const visibleBonds = useMemo(() => {
    return molecule.bonds.filter(
      (b) => visibleAtomSet.has(b.from) && visibleAtomSet.has(b.to),
    );
  }, [molecule.bonds, visibleAtomSet]);

  const computedBonds = useMemo<ComputedBondMesh[]>(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const out: ComputedBondMesh[] = [];
    for (const bond of visibleBonds) {
      const a1 = atomMap.get(bond.from);
      const a2 = atomMap.get(bond.to);
      if (!a1 || !a2) continue;

      const p1 = new THREE.Vector3(...a1.position);
      const p2 = new THREE.Vector3(...a2.position);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1);
      const length = dir.length();
      if (length < 0.001) continue;

      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
      const bothHighlighted =
        highlightedSet.has(bond.from) && highlightedSet.has(bond.to);

      if (bond.order === 2) {
        const offsetVec = getDoubleBondOffsetDir(bond, atomMap, adjMap);
        const off = new THREE.Vector3(...offsetVec).multiplyScalar(0.082);
        out.push({
          id: bond.id,
          order: 2,
          length,
          quaternion,
          positions: [mid.clone().add(off), mid.clone().sub(off)],
          bothHighlighted,
        });
      } else if (bond.order === 3) {
        const offsetVec = getDoubleBondOffsetDir(bond, atomMap, adjMap);
        const off = new THREE.Vector3(...offsetVec).multiplyScalar(0.095);
        out.push({
          id: bond.id,
          order: 3,
          length,
          quaternion,
          positions: [mid, mid.clone().add(off), mid.clone().sub(off)],
          bothHighlighted,
        });
      } else {
        out.push({
          id: bond.id,
          order: 1,
          length,
          quaternion,
          positions: [mid],
          bothHighlighted,
        });
      }
    }
    return out;
  }, [visibleBonds, atomMap, adjMap, highlightedSet]);

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 20), []);
  const cylGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 14, 1), []);
  const haloGeo = useMemo(() => new THREE.TorusGeometry(1.28, 0.09, 12, 32), []);
  const symmetryEdgesGeo = useMemo(() => {
    const plane = new THREE.PlaneGeometry(5.8, 5.8);
    const edges = new THREE.EdgesGeometry(plane);
    plane.dispose();
    return edges;
  }, []);

  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      cylGeo.dispose();
      haloGeo.dispose();
      symmetryEdgesGeo.dispose();
    };
  }, [sphereGeo, cylGeo, haloGeo, symmetryEdgesGeo]);

  useEffect(() => {
    hoveredIdRef.current = null;
    setHoveredId(null);
    onHoverAtom?.(null);
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto';
      }
    };
  }, [molecule.id, selectable, onHoverAtom]);

  const handleAtomClick = (e: ThreeEvent<MouseEvent>, atom: AtomData) => {
    e.stopPropagation();
    if (!selectable || !onSelectAtom) return;
    if (e.delta > 6) return; // ignore orbit drag
    onSelectAtom(atom.id);
    invalidate();
  };

  const symmetryQuaternion = useMemo(() => {
    if (!molecule.symmetryPlane) return new THREE.Quaternion();
    const n = new THREE.Vector3(...normVec(molecule.symmetryPlane.normal));
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  }, [molecule.symmetryPlane]);

  return (
    <group rotation={initialRotation ?? ZERO_ROTATION}>
      {/* Atoms */}
      {visibleAtoms.map((atom) => {
        const baseRadius = ELEMENT_RADII[atom.element];
        const isSelected = selectedSet.has(atom.id);
        const isHighlighted = highlightedSet.has(atom.id);
        const isHovered = hoveredId === atom.id;
        // Never scale geometry on hover so zoomed raycasts remain completely steady
        const radius = baseRadius * (isSelected ? 1.1 : 1);

        const color = ELEMENT_COLORS[atom.element];
        let emissive = '#000000';
        let emissiveIntensity = 0;

        if (isSelected) {
          emissive = '#06B6D4';
          emissiveIntensity = 0.55;
        } else if (isHighlighted) {
          emissive = highlightColor;
          emissiveIntensity = 0.4;
        } else if (isHovered && selectable) {
          emissive = '#38BDF8';
          emissiveIntensity = 0.35;
        }

        return (
          <group key={atom.id} position={atom.position}>
            <mesh
              geometry={sphereGeo}
              scale={[radius, radius, radius]}
              onClick={(e) => handleAtomClick(e, atom)}
              onPointerOver={(e) => {
                if (!selectable) return;
                e.stopPropagation();
                if (hoveredIdRef.current !== atom.id) {
                  hoveredIdRef.current = atom.id;
                  setHoveredId(atom.id);
                  onHoverAtom?.(atom);
                  document.body.style.cursor = 'pointer';
                  invalidate();
                }
              }}
              onPointerOut={(e) => {
                if (!selectable) return;
                e.stopPropagation();
                if (hoveredIdRef.current === atom.id) {
                  hoveredIdRef.current = null;
                  setHoveredId(null);
                  onHoverAtom?.(null);
                  document.body.style.cursor = 'auto';
                  invalidate();
                }
              }}
            >
              <meshStandardMaterial
                color={color}
                roughness={atom.element === 'H' ? 0.25 : 0.34}
                metalness={atom.element === 'C' ? 0.18 : 0.1}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
            {(isSelected || isHighlighted) && (
              <mesh
                geometry={haloGeo}
                scale={[baseRadius, baseRadius, baseRadius]}
                rotation={[Math.PI / 2, 0, 0]}
                raycast={NO_RAYCAST}
              >
                <meshBasicMaterial
                  color={isSelected ? '#22D3EE' : highlightColor}
                  transparent
                  opacity={isSelected ? 0.95 : 0.75}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Bonds */}
      {computedBonds.map((bond) => {
        const bondColor = bond.bothHighlighted ? highlightColor : '#94A3B8';
        const stickRadius = bond.order === 1 ? 0.082 : bond.order === 2 ? 0.058 : 0.048;

        if (bond.order === 1) {
          return (
            <mesh
              key={bond.id}
              position={bond.positions[0]}
              quaternion={bond.quaternion}
              geometry={cylGeo}
              scale={[stickRadius, bond.length, stickRadius]}
            >
              <meshStandardMaterial
                color={bondColor}
                roughness={0.38}
                metalness={0.22}
              />
            </mesh>
          );
        }

        return (
          <group key={bond.id}>
            {bond.positions.map((pos, idx) => (
              <mesh
                key={`${bond.id}-${idx}`}
                position={pos}
                quaternion={bond.quaternion}
                geometry={cylGeo}
                scale={[stickRadius, bond.length, stickRadius]}
              >
                <meshStandardMaterial
                  color={bondColor}
                  roughness={0.35}
                  metalness={0.25}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Internal Symmetry Plane (revealed only after answer in 4.3) */}
      {showSymmetryPlane && molecule.symmetryPlane && (
        <group position={molecule.symmetryPlane.point} quaternion={symmetryQuaternion}>
          <mesh renderOrder={5} raycast={NO_RAYCAST}>
            <planeGeometry args={[5.8, 5.8]} />
            <meshStandardMaterial
              color="#06B6D4"
              transparent
              opacity={0.24}
              side={THREE.DoubleSide}
              depthWrite={false}
              emissive="#0891B2"
              emissiveIntensity={0.35}
            />
          </mesh>
          <lineSegments geometry={symmetryEdgesGeo} raycast={NO_RAYCAST}>
            <lineBasicMaterial color="#22D3EE" transparent opacity={0.85} />
          </lineSegments>
        </group>
      )}

      {/* Optional External Mirror Plane */}
      {showExternalMirrorPlane && (
        <group position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh renderOrder={5} raycast={NO_RAYCAST}>
            <planeGeometry args={[5.5, 5.5]} />
            <meshStandardMaterial
              color="#2DD4BF"
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Isolated corner HUD so hovering an atom never re-renders the Canvas or shifts header layout */
function HoverAtomHud({
  registerSetter,
  selectable,
}: {
  registerSetter: (fn: (atom: AtomData | null) => void) => void;
  selectable: boolean;
}) {
  const [hoveredAtom, setHoveredAtom] = useState<AtomData | null>(null);

  useEffect(() => {
    registerSetter(setHoveredAtom);
  }, [registerSetter]);

  if (!selectable || !hoveredAtom) return null;

  return (
    <div className="pointer-events-none absolute top-2.5 right-3 z-10 bg-[#080D16]/90 px-2.5 py-1 rounded border border-cyan-500/40 text-xs text-cyan-300 font-medium">
      {ELEMENT_NAMES_HU[hoveredAtom.element]} · <span className="font-mono-tabular">{hoveredAtom.id}</span>
    </div>
  );
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({
  molecule,
  heightClass = 'h-[340px] sm:h-[420px] lg:h-[460px]',
  selectable = false,
  selectedAtomIds = [],
  onSelectAtom,
  showHydrogensDefault = true,
  keepChiralHydrogens = true,
  allowHydrogenToggle = true,
  allowSubstituentInspect = true,
  showSymmetryPlane = false,
  showExternalMirrorPlane = false,
  highlightedAtomIds = [],
  highlightColor = '#F59E0B',
  label,
  sublabel,
  initialRotation,
  resetToken = 0,
  extraControls,
}) => {
  const [showHydrogens, setShowHydrogens] = useState(showHydrogensDefault);
  const [inspectSubstituents, setInspectSubstituents] = useState(false);
  const [activeBranchIndex, setActiveBranchIndex] = useState<number | null>(null);
  const [localReset, setLocalReset] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const hoverSetterRef = useRef<((atom: AtomData | null) => void) | null>(null);

  const registerHoverSetter = useMemo(
    () => (fn: (atom: AtomData | null) => void) => {
      hoverSetterRef.current = fn;
    },
    [],
  );

  const handleHoverAtom = useMemo(
    () => (atom: AtomData | null) => {
      hoverSetterRef.current?.(atom);
    },
    [],
  );

  useEffect(() => {
    setShowHydrogens(showHydrogensDefault);
  }, [showHydrogensDefault, molecule.id]);

  useEffect(() => {
    setActiveBranchIndex(null);
  }, [molecule.id, selectedAtomIds]);

  // Calculate molecule bounding radius for auto-fit camera
  const boundingRadius = useMemo(() => {
    let maxR = 1.6;
    for (const a of molecule.atoms) {
      const r = Math.hypot(a.position[0], a.position[1], a.position[2]) + 0.6;
      if (r > maxR) maxR = r;
    }
    return maxR;
  }, [molecule.atoms]);

  // Substituents of the last selected atom (for inspecting attached groups!)
  const inspectedAtomId =
    selectedAtomIds.length > 0 ? selectedAtomIds[selectedAtomIds.length - 1] : null;
  const inspectedAtom = useMemo(
    () => molecule.atoms.find((a) => a.id === inspectedAtomId) || null,
    [molecule.atoms, inspectedAtomId],
  );
  const substituents: SubstituentGroup[] = useMemo(() => {
    if (!inspectedAtomId || !allowSubstituentInspect) return [];
    return getSubstituentsAtAtom(molecule, inspectedAtomId);
  }, [molecule, inspectedAtomId, allowSubstituentInspect]);

  const effectiveHighlightedSet = useMemo(() => {
    const set = new Set<string>(highlightedAtomIds);
    if (inspectSubstituents && activeBranchIndex !== null && substituents[activeBranchIndex]) {
      substituents[activeBranchIndex].atomIds.forEach((id) => set.add(id));
    }
    return set;
  }, [highlightedAtomIds, inspectSubstituents, activeBranchIndex, substituents]);

  const effectiveHighlightColor =
    inspectSubstituents && activeBranchIndex !== null && substituents[activeBranchIndex]
      ? substituents[activeBranchIndex].color
      : highlightColor;

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-[#0B1220] overflow-hidden">
      {/* Header strip (fixed single-line height so canvas never shifts) */}
      {(label || sublabel) && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800/80 bg-[#0F172A] min-h-[42px]">
          <div className="flex items-baseline gap-2.5 min-w-0 w-full">
            {label && (
              <span className="font-display font-semibold text-sm sm:text-base text-slate-100 truncate shrink-0 max-w-[60%]">
                {label}
              </span>
            )}
            {sublabel && (
              <span className="font-mono-tabular text-xs text-cyan-400 truncate min-w-0">
                {sublabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3D Viewport */}
      <div className={`relative w-full ${heightClass} canvas-touch-surface bg-[#070C16]`}>
        <HoverAtomHud registerSetter={registerHoverSetter} selectable={selectable} />

        {contextLost ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-300">
            A 3D megjelenítő grafikus kontextusa megszakadt. Kattints az újratöltéshez.
          </div>
        ) : (
          <Canvas
            frameloop="demand"
            dpr={IS_SOFTWARE_GL ? 1 : [1, 2]}
            camera={CAMERA_CONFIG}
            gl={GL_CONFIG}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', (ev) => {
                ev.preventDefault();
                setContextLost(true);
              });
              canvas.addEventListener('webglcontextrestored', () => {
                setContextLost(false);
              });
            }}
          >
            <color attach="background" args={['#070C16']} />
            <SceneEnvironment />
            <hemisphereLight args={['#BAE6FD', '#0F172A', 0.65]} />
            <directionalLight position={[6, 8, 7]} intensity={1.35} color="#FFF7ED" />
            <directionalLight position={[-6, -4, -5]} intensity={0.55} color="#38BDF8" />

            <CameraAutoFit
              moleculeId={molecule.id}
              radius={boundingRadius}
              resetSignal={resetToken + localReset}
              controlsRef={controlsRef}
            />

            <InvalidateOnChange
              deps={[
                molecule,
                showHydrogens,
                selectedAtomIds,
                effectiveHighlightedSet,
                showSymmetryPlane,
                showExternalMirrorPlane,
              ]}
            />

            <MoleculeMeshGroup
              molecule={molecule}
              showHydrogens={showHydrogens}
              keepChiralHydrogens={keepChiralHydrogens}
              selectable={selectable}
              selectedAtomIds={selectedAtomIds}
              highlightedSet={effectiveHighlightedSet}
              highlightColor={effectiveHighlightColor}
              onSelectAtom={onSelectAtom}
              onHoverAtom={handleHoverAtom}
              showSymmetryPlane={showSymmetryPlane}
              showExternalMirrorPlane={showExternalMirrorPlane}
              initialRotation={initialRotation}
            />

            <OrbitControls
              ref={controlsRef}
              makeDefault
              enablePan={false}
              enableDamping={!IS_SOFTWARE_GL}
              dampingFactor={0.08}
              zoomSpeed={0.85}
              rotateSpeed={0.85}
              minDistance={1.4}
              maxDistance={Math.max(20, boundingRadius * 5)}
              touches={TOUCH_CONFIG}
            />
          </Canvas>
        )}

        {/* Minimal corner CPK legend + interaction hint */}
        <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-2.5 bg-[#080D16]/85 px-2.5 py-1 rounded border border-slate-800">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#333842] border border-slate-500 inline-block" />
              C
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F1F5F9] inline-block" />
              H
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626] inline-block" />
              O
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] inline-block" />
              Cl
            </span>
          </div>
          <span className="bg-[#080D16]/85 px-2.5 py-1 rounded border border-slate-800 hidden sm:inline">
            Forgatás: húzás · Nagyítás: görgő / két ujj{selectable ? ' · Kijelölés: kattintás atomra' : ''}
          </span>
        </div>
      </div>

      {/* Interactive Toolbar below canvas */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-[#0F172A] border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLocalReset((v) => v + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 text-slate-200 hover:border-cyan-500/60 hover:text-cyan-300 transition-colors min-h-[36px] whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nézet alaphelyzetbe
          </button>

          {allowHydrogenToggle && (
            <button
              type="button"
              onClick={() => setShowHydrogens((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[36px] whitespace-nowrap ${
                showHydrogens
                  ? 'border-slate-700 text-slate-200 hover:border-cyan-500/60'
                  : 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
              }`}
            >
              {showHydrogens ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showHydrogens ? 'H atomok elrejtése' : 'H atomok mutatása'}
            </button>
          )}

          {allowSubstituentInspect && selectable && inspectedAtom && (
            <button
              type="button"
              onClick={() => {
                setInspectSubstituents((v) => !v);
                setActiveBranchIndex(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[36px] whitespace-nowrap ${
                inspectSubstituents
                  ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                  : 'border-slate-700 text-slate-200 hover:border-amber-500/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Kapcsolódó csoportok ({substituents.length})
            </button>
          )}
        </div>

        {extraControls && <div className="flex flex-wrap items-center gap-2">{extraControls}</div>}
      </div>

      {/* Substituent Inspector Panel when an atom is selected */}
      {inspectSubstituents && inspectedAtom && substituents.length > 0 && (
        <div className="px-3.5 py-2.5 bg-[#0C1526] border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-slate-300 font-medium">
              Kijelölt atom (<span className="font-mono-tabular text-cyan-300">{inspectedAtom.id}</span>) kapcsolódó csoportjai — kattints egy csoportra a 3D kiemeléshez:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {substituents.map((sub, idx) => {
              const active = activeBranchIndex === idx;
              return (
                <button
                  key={sub.rootAtomId}
                  type="button"
                  onClick={() => setActiveBranchIndex(active ? null : idx)}
                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono-tabular transition-colors min-h-[34px] ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/15 text-white'
                      : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span>{sub.formulaLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
