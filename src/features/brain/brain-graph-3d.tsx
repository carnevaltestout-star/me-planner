import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls, Stars, Text, TransformControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { BrainNode } from "@/lib/brain/brain-types";
import { rootAncestorId } from "@/lib/brain/brain-tree";

// Node.position lives in a normalized -1..1 cube; this is the only place
// that scales it up to actual Three.js world units, so every other file
// can stay unit-agnostic. The boundary is now brain-shaped rather than a
// literal cube (see useBrainBoundaryGeometry below) but nodes still
// position themselves within the same normalized range as before.
const CUBE_SIZE = 5;
const HALF = CUBE_SIZE / 2;

// How far back the camera sits from whichever node it's focused on (see
// CameraFocus below) — large enough that the brain's overall silhouette is
// still visible around the focused node, rather than a tight close-up that
// loses the shape entirely.
const FOCUS_DISTANCE = 4.5;

// Radius of the invisible sphere used to catch clicks on empty space (see
// ClickToAddBackdrop) — comfortably past OrbitControls' own maxDistance
// below, so the camera can never end up outside it.
const BACKDROP_RADIUS = 40;
const ORBIT_MAX_DISTANCE = 20;
// How far along the click ray a new node gets placed, then clamped back
// toward the brain volume — see ClickToAddBackdrop.
const CLICK_PLACEMENT_DISTANCE = 4;
const CLICK_PLACEMENT_MAX_RADIUS = HALF * 1.15;
// A click and a drag-to-orbit both end in a "pointer up" on the same
// backdrop mesh — this is how far (in screen pixels) the pointer is
// allowed to have moved between down and up before it no longer counts as
// a click, so orbiting never also drops a new node.
const CLICK_MOVEMENT_THRESHOLD_PX = 6;
// How far a dragged node is allowed to end up from the brain's center —
// same reasoning as CLICK_PLACEMENT_MAX_RADIUS, just for repositioning an
// existing node instead of placing a new one.
const DRAG_MAX_RADIUS = HALF * 1.3;

// Deliberately fixed (not tied to the app's light/dark theme) — this is
// meant to read as a network/data-viz visualization regardless of which
// app theme is active, the same way the pixel-bunny mockup work earlier
// used fixed colors rather than theme tokens for a specific aesthetic.
const SCENE_BG = "#05070f";
const CLUSTER_COLORS = ["#5eead4", "#a78bfa", "#60a5fa", "#f472b6", "#fbbf24", "#34d399", "#f87171", "#818cf8"];

// Procedural "brain-shaped" boundary: a subdivided icosahedron pushed and
// pulled per-vertex with a few overlapping sine waves (for an organic,
// wrinkled-surface look) plus a central dent along the x=0 plane (echoing
// the brain's longitudinal fissure between hemispheres) and a vertical
// squash. No external 3D model/asset — everything here is generated code,
// so there's nothing to download or ship as a binary.
function useBrainBoundaryGeometry() {
  return useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(HALF * 1.08, 3);
    const position = geometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      const wrinkle = Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) * Math.sin(v.z * 3.4) * 0.14 + Math.sin(v.x * 7.2 + v.y * 5.3) * 0.05;
      const fissure = Math.exp(-(v.x * v.x) / 0.2) * 0.22;
      v.multiplyScalar(1 + wrinkle - fissure);
      v.y *= 0.76;
      position.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

export type BrainGraphMode = "select" | "move" | "connect";

interface BrainGraph3DProps {
  nodes: Record<string, BrainNode>;
  selectedId: string | null;
  // The most recently created/edited node — the camera opens zoomed in on
  // this one. Null when there's nothing to focus (brand new board, or the
  // last-touched node got deleted).
  focusNodeId: string | null;
  mode: BrainGraphMode;
  connectPendingId: string | null;
  onSelect: (id: string) => void;
  onCommitMove: (id: string, position: [number, number, number]) => void;
  onNodeClickInConnectMode: (id: string) => void;
  // Tapping empty space (not a node, not a drag) in Select mode adds a new
  // node at that spot — see ClickToAddBackdrop.
  onAddNodeAt: (position: [number, number, number]) => void;
  // Double-click (desktop) or press-and-hold (mobile) on a node in Select
  // mode — see NodeSphere's onDoubleClick/long-press handling below.
  onQuickEdit: (id: string) => void;
  // Click-and-hold-then-drag a node onto the floating trash bin — see the
  // drag state and TrashBin below.
  onDeleteNode: (id: string) => void;
}

// How long a press has to be held before it counts as a long-press rather
// than a tap, and how far the pointer may drift during that hold and still
// count — matching the same "small movement tolerance" reasoning
// ClickToAddBackdrop already uses for its own tap-vs-drag distinction.
const LONG_PRESS_MS = 550;
const LONG_PRESS_MOVEMENT_THRESHOLD_PX = 10;

function worldPos([x, y, z]: [number, number, number]): [number, number, number] {
  return [x * HALF, y * HALF, z * HALF];
}

// Groups nodes by their root ancestor — every node sharing a tree gets the
// same cluster color and sits inside the same translucent region blob;
// truly isolated nodes (own cluster of size 1) get neither, per the spec's
// "loose nodes hovering around" for anything not connected to anything else.
function useClusters(nodes: Record<string, BrainNode>) {
  return useMemo(() => {
    const byRoot = new Map<string, BrainNode[]>();
    Object.values(nodes).forEach((n) => {
      const root = rootAncestorId({ nodes }, n.id);
      const list = byRoot.get(root) ?? [];
      list.push(n);
      byRoot.set(root, list);
    });
    const colorByRoot = new Map<string, string>();
    let i = 0;
    byRoot.forEach((_, root) => {
      colorByRoot.set(root, CLUSTER_COLORS[i % CLUSTER_COLORS.length]);
      i++;
    });
    return { byRoot, colorByRoot };
  }, [nodes]);
}

// A single shooting star: a small bright head plus a short trailing line,
// grouped together so only the group's position/orientation needs a
// per-frame imperative update (the trail's own two points stay fixed in
// the group's local space, pointing back along the direction of travel).
// State lives in a ref, not React state, so this animates every frame
// without ever triggering a re-render.
function ShootingStar({ initialDelay }: { initialDelay: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef({
    active: false,
    start: 0,
    duration: 0,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    nextSpawn: initialDelay,
  });

  useFrame(() => {
    const s = stateRef.current;
    const t = performance.now() / 1000;
    const group = groupRef.current;
    if (!group) return;

    if (!s.active) {
      group.visible = false;
      if (t < s.nextSpawn) return;
      // Spawns somewhere on a large sphere around the scene and travels
      // toward a random point past the opposite side — reads as "crossing
      // the sky" rather than drifting toward the middle and stopping.
      const spawnRadius = BACKDROP_RADIUS * 0.7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 1.6 - 0.8);
      s.from.set(spawnRadius * Math.sin(phi) * Math.cos(theta), spawnRadius * Math.cos(phi) * 0.6 + spawnRadius * 0.25, spawnRadius * Math.sin(phi) * Math.sin(theta));
      s.to.set((Math.random() - 0.5) * spawnRadius * 1.4, (Math.random() - 0.5) * spawnRadius * 0.7, (Math.random() - 0.5) * spawnRadius * 1.4);
      s.dir.copy(s.to).sub(s.from).normalize();
      s.duration = 1 + Math.random() * 0.7;
      s.start = t;
      s.active = true;
      return;
    }

    const progress = (t - s.start) / s.duration;
    if (progress >= 1) {
      s.active = false;
      s.nextSpawn = t + 4 + Math.random() * 9;
      group.visible = false;
      return;
    }

    group.visible = true;
    group.position.lerpVectors(s.from, s.to, progress);
    group.lookAt(group.position.clone().add(s.dir));
    // Fades in for the first tenth of its flight and out over the last
    // quarter, instead of popping in/out abruptly at either end.
    const fadeIn = Math.min(1, progress / 0.1);
    const fadeOut = Math.min(1, (1 - progress) / 0.25);
    const opacity = Math.min(fadeIn, fadeOut);
    group.children.forEach((child) => {
      const mat = (child as THREE.Mesh | THREE.Line).material as THREE.Material & { opacity?: number };
      if (mat) mat.opacity = opacity;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} />
      </mesh>
      {/* Trail points toward local +z, which after lookAt(position + dir)
          faces opposite the direction of travel — i.e. behind the head. */}
      <Line points={[[0, 0, 0], [0, 0, 0.5]]} color="#bcd4ff" lineWidth={1} transparent opacity={0.6} />
    </group>
  );
}

const SHOOTING_STAR_COUNT = 4;

function ShootingStars() {
  const delays = useMemo(() => Array.from({ length: SHOOTING_STAR_COUNT }, (_, i) => i * 2.5 + Math.random() * 3), []);
  return (
    <>
      {delays.map((delay, i) => (
        <ShootingStar key={i} initialDelay={delay} />
      ))}
    </>
  );
}

// Invisible sphere (BackSide-rendered, fully transparent) that catches
// clicks on empty space — R3F only fires pointer events for objects the
// ray actually intersects, so without this, clicking past every node and
// the brain wireframe would hit nothing at all. Clicking directly on a
// node still works normally: NodeSphere's own onClick calls
// stopPropagation, which (since it's much closer to the camera) keeps the
// event from ever reaching this backdrop.
function ClickToAddBackdrop({ enabled, onAddNodeAt }: { enabled: boolean; onAddNodeAt: (position: [number, number, number]) => void }) {
  const downPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <mesh
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        downPos.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        const down = downPos.current;
        downPos.current = null;
        if (!enabled || !down) return;
        // A drag-to-orbit also ends with a pointer-up on this same
        // backdrop — only place a node if the pointer barely moved, i.e.
        // this was actually a tap/click and not a rotate gesture.
        const movedPx = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        if (movedPx > CLICK_MOVEMENT_THRESHOLD_PX) return;
        const point = e.ray.at(CLICK_PLACEMENT_DISTANCE, new THREE.Vector3());
        if (point.length() > CLICK_PLACEMENT_MAX_RADIUS) point.setLength(CLICK_PLACEMENT_MAX_RADIUS);
        onAddNodeAt([point.x / HALF, point.y / HALF, point.z / HALF]);
      }}
    >
      <sphereGeometry args={[BACKDROP_RADIUS, 16, 16]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// Moves the camera in close to targetWorldPos and re-centers OrbitControls
// on it whenever the target changes — the identity of the target (not its
// exact coordinates) is what should trigger this, so re-focusing happens
// once when a *different* node becomes the focus, not on every render.
function CameraFocus({ targetWorldPos, controlsRef }: { targetWorldPos: [number, number, number] | null; controlsRef: React.RefObject<OrbitControlsImpl> }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!targetWorldPos) return;
    const target = new THREE.Vector3(...targetWorldPos);
    const offset = new THREE.Vector3(1.1, 0.9, 1.1).normalize().multiplyScalar(FOCUS_DISTANCE);
    camera.position.copy(target.clone().add(offset));
    camera.lookAt(target);
    if (controlsRef.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
    // Keyed on the target's own coordinates (plain numbers) rather than a
    // node id or the nodes map, so this only re-runs when the focused
    // point actually moves — not on every unrelated render.
  }, [targetWorldPos?.[0], targetWorldPos?.[1], targetWorldPos?.[2]]);
  return null;
}

function RegionBlob({ members, color }: { members: BrainNode[]; color: string }) {
  const { center, radius } = useMemo(() => {
    const pts = members.map((n) => new THREE.Vector3(...worldPos(n.position)));
    const c = pts.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(pts.length);
    const r = Math.max(0.6, ...pts.map((p) => p.distanceTo(c) + 0.35));
    return { center: c, radius: r };
  }, [members]);

  return (
    <mesh position={center}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
    </mesh>
  );
}

function NodeSphere({
  node,
  color,
  isSelected,
  isConnectPending,
  mode,
  onSelect,
  onConnectClick,
  onQuickEdit,
  onDragStart,
  onDragMove,
  onDragEnd,
  registerRef,
}: {
  node: BrainNode;
  color: string;
  isSelected: boolean;
  isConnectPending: boolean;
  mode: BrainGraphMode;
  onSelect: (id: string) => void;
  onConnectClick: (id: string) => void;
  onQuickEdit: (id: string) => void;
  // Click-and-hold-to-move: onDragStart fires the moment a press-then-move
  // crosses the movement threshold (see isDraggingRef below), onDragMove on
  // every subsequent move while held, onDragEnd on release with the final
  // point and the release's screen coordinates (so the parent can tell
  // whether it landed on the floating trash bin).
  onDragStart: (id: string) => void;
  onDragMove: (id: string, point: [number, number, number], clientX: number, clientY: number) => void;
  onDragEnd: (id: string, point: [number, number, number], clientX: number, clientY: number) => void;
  registerRef: (id: string, obj: THREE.Object3D | null) => void;
}) {
  const pos = worldPos(node.position);
  const { gl } = useThree();
  const [isHovered, setIsHovered] = useState(false);
  // Long-press state — pointer events cover both touch and mouse in R3F, so
  // this same handling works for a mobile press-and-hold without needing to
  // branch on input type. A long-press that fires suppresses the click that
  // follows the eventual pointer-up, so it doesn't *also* re-select/re-open
  // as a plain click on top of the quick-edit that already happened. If the
  // press turns into a drag instead (movement past the threshold before the
  // timer fires), the timer is cancelled and dragging takes over — holding
  // still renames, holding-and-moving repositions.
  const longPressTimerRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const dragEndedRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane());
  const longPressFiredRef = useRef(false);
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  function clearLongPress() {
    window.clearTimeout(longPressTimerRef.current);
  }

  return (
    <group>
      {/* A larger invisible hit target, not the small visible sphere below,
          owns every interaction handler — the visible sphere alone (radius
          0.13) was easy to miss, and a miss falls through to
          ClickToAddBackdrop and drops a brand new node right on top of the
          one you were aiming for. Centered halfway up toward the text label
          (rather than on the node itself) and sized to reach past it, since
          the label floats a further 0.26 above the node and isn't
          clickable on its own — a same-center sphere would cover the node
          but still fall short of most of the label. Coexists fine with
          TransformControls' gizmo in Move mode — verified live, dragging
          in every direction still works with this present. */}
      <mesh
        position={[pos[0], pos[1] + 0.13, pos[2]]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = "auto";
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (mode !== "select") return;
          downPosRef.current = { x: e.clientX, y: e.clientY };
          longPressFiredRef.current = false;
          isDraggingRef.current = false;
          dragEndedRef.current = false;
          clearLongPress();
          longPressTimerRef.current = window.setTimeout(() => {
            longPressFiredRef.current = true;
            onQuickEdit(node.id);
          }, LONG_PRESS_MS);
          // Captured on the actual canvas element, not e.target (a THREE
          // object, not a real capturable DOM node — capturing on it is a
          // silent no-op) — without this, R3F's raycast-based pointermove
          // stops firing here the moment a fast drag carries the cursor off
          // whatever screen-space area this mesh currently occupies, since
          // there's nothing left forcing events back to it.
          gl.domElement.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          const down = downPosRef.current;
          if (!down) return;
          const movedPx = Math.hypot(e.clientX - down.x, e.clientY - down.y);
          if (!isDraggingRef.current) {
            if (movedPx <= LONG_PRESS_MOVEMENT_THRESHOLD_PX) return;
            clearLongPress();
            // A screen-facing plane through the node's current position —
            // the standard trick for turning a 2D drag into a 3D point:
            // intersecting the pointer ray with this plane as the pointer
            // moves gives a stable, camera-relative "follow the cursor"
            // point instead of one that swims as the ray angle changes.
            isDraggingRef.current = true;
            const normal = new THREE.Vector3();
            e.camera.getWorldDirection(normal);
            dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(pos[0], pos[1], pos[2]));
            onDragStart(node.id);
            return;
          }
          const hit = new THREE.Vector3();
          if (e.ray.intersectPlane(dragPlaneRef.current, hit)) onDragMove(node.id, [hit.x, hit.y, hit.z], e.clientX, e.clientY);
        }}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          clearLongPress();
          if (gl.domElement.hasPointerCapture(e.pointerId)) gl.domElement.releasePointerCapture(e.pointerId);
          if (!isDraggingRef.current) return;
          isDraggingRef.current = false;
          dragEndedRef.current = true;
          const hit = new THREE.Vector3();
          const landed = e.ray.intersectPlane(dragPlaneRef.current, hit) ? [hit.x, hit.y, hit.z] : pos;
          onDragEnd(node.id, landed as [number, number, number], e.clientX, e.clientY);
        }}
        onPointerLeave={clearLongPress}
        onDoubleClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (mode === "select") onQuickEdit(node.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (longPressFiredRef.current) {
            longPressFiredRef.current = false;
            return;
          }
          if (dragEndedRef.current) {
            dragEndedRef.current = false;
            return;
          }
          if (mode === "connect") onConnectClick(node.id);
          else onSelect(node.id);
        }}
      >
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Purely visual — the hit target above owns all interaction, this
          just renders the node and reacts to isHovered/isSelected. Scales up
          a little on hover, same idea as a button's hover state, so the
          highlight reads clearly even at a glance. */}
      <mesh ref={(obj) => registerRef(node.id, obj)} position={pos} scale={isHovered && !isSelected ? 1.25 : 1}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color={isSelected ? "#ffffff" : color}
          emissive={isConnectPending ? "#ffdd55" : isSelected ? "#ffffff" : color}
          emissiveIntensity={isConnectPending ? 0.9 : isSelected ? 0.6 : isHovered ? 0.85 : 0.4}
        />
      </mesh>
      <Text position={[pos[0], pos[1] + 0.26, pos[2]]} fontSize={0.15} color={isHovered ? "#ffffff" : "#e8eefc"} anchorX="center" anchorY="bottom" outlineWidth={0.01} outlineColor="#05070f">
        {node.title || "insert node name"}
      </Text>
    </group>
  );
}

export default function BrainGraph3D({
  nodes,
  selectedId,
  focusNodeId,
  mode,
  connectPendingId,
  onSelect,
  onCommitMove,
  onNodeClickInConnectMode,
  onAddNodeAt,
  onQuickEdit,
  onDeleteNode,
}: BrainGraph3DProps) {
  const objectRefs = useRef<Record<string, THREE.Object3D>>({});
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const brainGeometry = useBrainBoundaryGeometry();

  // Click-and-hold-to-move: while a node is being dragged, its position in
  // this local copy tracks the pointer instead of the real (still
  // unmodified) node data, so the sphere, its connection lines, and its
  // cluster blob all visibly follow the drag — none of it is written back
  // to real state until the drag ends (dropped on the trash bin deletes it
  // instead of committing a position at all).
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<[number, number, number] | null>(null);
  const [overBin, setOverBin] = useState(false);
  const binRef = useRef<HTMLDivElement>(null);

  const effectiveNodes =
    draggingId && dragPoint && nodes[draggingId]
      ? { ...nodes, [draggingId]: { ...nodes[draggingId], position: dragPoint.map((v) => v / HALF) as [number, number, number] } }
      : nodes;
  const { byRoot, colorByRoot } = useClusters(effectiveNodes);
  const focusNode = focusNodeId ? nodes[focusNodeId] : null;
  const focusWorldPos = focusNode ? worldPos(focusNode.position) : null;

  function registerRef(id: string, obj: THREE.Object3D | null) {
    if (obj) objectRefs.current[id] = obj;
    else delete objectRefs.current[id];
  }

  const selectedObject = selectedId ? objectRefs.current[selectedId] : undefined;

  function commitSelectedPosition() {
    if (!selectedId || !selectedObject) return;
    const p = selectedObject.position;
    onCommitMove(selectedId, [p.x / HALF, p.y / HALF, p.z / HALF]);
  }

  function isOverBin(clientX: number, clientY: number) {
    const rect = binRef.current?.getBoundingClientRect();
    return !!rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function handleNodeDragStart(id: string) {
    setDraggingId(id);
    setDragPoint(worldPos(nodes[id].position));
    setOrbitEnabled(false);
  }

  function handleNodeDragMove(id: string, point: [number, number, number], clientX: number, clientY: number) {
    if (id !== draggingId) return; // stale event from a drag that already ended
    // Clamped the same way a freshly click-placed node is — dragging
    // shouldn't be able to fling a node arbitrarily far from the brain.
    const v = new THREE.Vector3(...point);
    if (v.length() > DRAG_MAX_RADIUS) v.setLength(DRAG_MAX_RADIUS);
    setDragPoint([v.x, v.y, v.z]);
    setOverBin(isOverBin(clientX, clientY));
  }

  function handleNodeDragEnd(id: string, point: [number, number, number], clientX: number, clientY: number) {
    setDraggingId(null);
    setDragPoint(null);
    setOverBin(false);
    setOrbitEnabled(true);
    if (isOverBin(clientX, clientY)) {
      onDeleteNode(id);
      return;
    }
    const v = new THREE.Vector3(...point);
    if (v.length() > DRAG_MAX_RADIUS) v.setLength(DRAG_MAX_RADIUS);
    onCommitMove(id, [v.x / HALF, v.y / HALF, v.z / HALF]);
  }

  return (
    <div className="relative h-full w-full">
    <Canvas camera={{ position: [CUBE_SIZE * 1.1, CUBE_SIZE * 0.9, CUBE_SIZE * 1.1], fov: 45 }}>
      <color attach="background" args={[SCENE_BG]} />
      <fog attach="fog" args={[SCENE_BG, CUBE_SIZE * 2.5, CUBE_SIZE * 6]} />
      <Stars radius={CUBE_SIZE * 8} depth={40} count={2000} factor={2.5} fade speed={0.4} />
      <ShootingStars />
      <CameraFocus targetWorldPos={focusWorldPos} controlsRef={orbitControlsRef} />

      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#8fb8ff" />
      <pointLight position={[-5, -3, -4]} intensity={0.4} color="#c78fff" />

      {/* Catches clicks on empty space so Select mode can add a node there.
          JSX order doesn't matter for raycasting priority — three.js sorts
          hits by actual distance, and this sphere is always far past every
          real node, so NodeSphere's own stopPropagation() reliably keeps
          clicks on an actual node from ever reaching this backdrop. */}
      <ClickToAddBackdrop enabled={mode === "select"} onAddNodeAt={onAddNodeAt} />

      {/* Brain-shaped boundary — a wireframe over the procedural geometry
          above, standing in for the literal cube this used to be. */}
      <mesh geometry={brainGeometry}>
        <meshBasicMaterial color="#4a5fa8" wireframe transparent opacity={0.45} />
      </mesh>

      {/* Region blobs — one per cluster of 2+ nodes */}
      {Array.from(byRoot.entries())
        .filter(([, members]) => members.length >= 2)
        .map(([root, members]) => (
          <RegionBlob key={root} members={members} color={colorByRoot.get(root) ?? CLUSTER_COLORS[0]} />
        ))}

      {/* Connection lines to each node's parent — read from effectiveNodes
          so a line visibly follows whichever end (parent or child) is
          currently being dragged instead of looking disconnected mid-drag. */}
      {Object.values(effectiveNodes).map(
        (n) =>
          n.parentId &&
          effectiveNodes[n.parentId] && (
            <Line key={`edge-${n.id}`} points={[worldPos(n.position), worldPos(effectiveNodes[n.parentId].position)]} color="#7dd3fc" lineWidth={1.4} transparent opacity={0.75} />
          ),
      )}

      {Object.values(effectiveNodes).map((n) => (
        <NodeSphere
          key={n.id}
          node={n}
          color={colorByRoot.get(rootAncestorId({ nodes: effectiveNodes }, n.id)) ?? CLUSTER_COLORS[0]}
          isSelected={n.id === selectedId}
          isConnectPending={n.id === connectPendingId}
          mode={mode}
          onSelect={onSelect}
          onConnectClick={onNodeClickInConnectMode}
          onQuickEdit={onQuickEdit}
          onDragStart={handleNodeDragStart}
          onDragMove={handleNodeDragMove}
          onDragEnd={handleNodeDragEnd}
          registerRef={registerRef}
        />
      ))}

      {mode === "move" && selectedObject && (
        <TransformControls
          object={selectedObject}
          mode="translate"
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={() => {
            setOrbitEnabled(true);
            commitSelectedPosition();
          }}
        />
      )}

      <OrbitControls ref={orbitControlsRef} enabled={orbitEnabled && mode !== "move"} enablePan minDistance={2} maxDistance={ORBIT_MAX_DISTANCE} />
    </Canvas>
    {/* Floating trash bin — only shown while a node is actively being
        dragged (click-and-hold in Select mode). Plain HTML, not part of
        the 3D scene, since it only needs a fixed screen position; hit-
        testing against it is a simple client-rect comparison in
        isOverBin, not real 3D collision. */}
    {draggingId && (
      <div
        ref={binRef}
        className={`pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full border-2 text-2xl transition-all duration-150 ${
          overBin ? "h-16 w-16 border-[#ff6b6b] bg-[#ff6b6b]/80 scale-110" : "h-12 w-12 border-white/50 bg-black/60"
        }`}
      >
        🗑️
      </div>
    )}
    </div>
  );
}
