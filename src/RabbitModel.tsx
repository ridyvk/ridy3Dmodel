import { ContactShadows, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import {
  ATTENTION_ACTION_SEQUENCE,
  BLINK_INTERVALS_SECONDS,
  EAR_ACTION_SEQUENCE,
  FOREPAW_ACTION_SEQUENCE,
  HINDPAW_ACTION_SEQUENCE,
  INITIAL_BLINK_DELAY_SECONDS,
  type AttentionActionKind,
  type EarActionKind,
  type ForepawActionKind,
  type HindpawActionKind,
} from "./motionSchedule";
import {
  nostrilOpenFromRise,
  nostrilSurfaceWeightFromOpen,
  nostrilTissueStrengthFromOpen,
} from "./noseMotion";
import {
  installNostrilTissueShader,
  type NostrilTissueUniform,
} from "./nostrilMaterial";

const RABBIT_MODEL_URL = `${import.meta.env.BASE_URL}models/ridy-rabbit-v1.glb`;

function playOneShot(action: THREE.AnimationAction | undefined) {
  if (!action) return;
  action
    .reset()
    .setLoop(THREE.LoopOnce, 1)
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1);
  action.clampWhenFinished = false;
  action.play();
}

function playAdditiveOneShot(action: THREE.AnimationAction | undefined) {
  if (!action) return;
  action.blendMode = THREE.AdditiveAnimationBlendMode;
  action
    .reset()
    .setLoop(THREE.LoopOnce, 1)
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1);
  action.clampWhenFinished = false;
  action.zeroSlopeAtStart = true;
  action.zeroSlopeAtEnd = true;
  action.play();
}

function prepareModel(object: THREE.Object3D, anisotropy: number) {
  const tissueUniforms: NostrilTissueUniform[] = [];
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = true;
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      for (const texture of [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.metalnessMap,
      ]) {
        if (!texture) continue;
        texture.anisotropy = Math.min(8, anisotropy);
        texture.needsUpdate = true;
      }
      if (
        child instanceof THREE.SkinnedMesh &&
        child.morphTargetDictionary?.Nostril_Open !== undefined
      ) {
        const tissueUniform: NostrilTissueUniform = { value: 0 };
        installNostrilTissueShader(material, tissueUniform);
        tissueUniforms.push(tissueUniform);
      }
    }
  });
  return tissueUniforms;
}

function applyNostrilTissueStrength(
  tissueUniforms: NostrilTissueUniform[],
  strength: number,
) {
  for (const tissueUniform of tissueUniforms) {
    tissueUniform.value = strength;
  }
}

function Rabbit({ onReady }: { onReady?: () => void }) {
  const viewport = useThree((state) => state.viewport);
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const readyReported = useRef(false);
  const modelPrepared = useRef(false);
  const { scene, animations } = useGLTF(RABBIT_MODEL_URL, false, true);
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, model);
  const noseRig = useRef<{
    noseBone: THREE.Bone | null;
    surface: THREE.SkinnedMesh | null;
    restY: number;
    morphIndex: number;
    tissueUniforms: NostrilTissueUniform[];
  }>({ noseBone: null, surface: null, restY: 0, morphIndex: -1, tissueUniforms: [] });
  const preparedTissueUniforms = useRef<NostrilTissueUniform[]>([]);

  useLayoutEffect(() => {
    if (!modelPrepared.current) {
      preparedTissueUniforms.current = prepareModel(model, anisotropy);
      modelPrepared.current = true;
    }
    const noseObject = model.getObjectByName("RabbitFaceNose")
      ?? model.getObjectByName("Rabbit.Face.Nose");
    const noseBone = noseObject instanceof THREE.Bone ? noseObject : null;
    const morphSurfaces: THREE.SkinnedMesh[] = [];
    model.traverse((object) => {
      if (
        object instanceof THREE.SkinnedMesh &&
        object.morphTargetDictionary?.Nostril_Open !== undefined
      ) {
        morphSurfaces.push(object);
      }
    });
    const surface = morphSurfaces[0] ?? null;
    noseRig.current = {
      noseBone,
      surface,
      restY: noseBone?.position.y ?? 0,
      morphIndex: surface?.morphTargetDictionary?.Nostril_Open ?? -1,
      tissueUniforms: preparedTissueUniforms.current,
    };
    return () => {
      noseRig.current = {
        noseBone: null,
        surface: null,
        restY: 0,
        morphIndex: -1,
        tissueUniforms: [],
      };
    };
  }, [anisotropy, model]);

  useFrame(() => {
    const { noseBone, surface, restY, morphIndex, tissueUniforms } = noseRig.current;
    if (!noseBone || !surface?.morphTargetInfluences || morphIndex < 0) return;
    const rise = noseBone.position.y - restY;
    const open = nostrilOpenFromRise(rise);
    surface.morphTargetInfluences[morphIndex] = nostrilSurfaceWeightFromOpen(open);
    applyNostrilTissueStrength(tissueUniforms, nostrilTissueStrengthFromOpen(open));
  });

  useEffect(() => {
    const idle = actions.Rabbit_Idle_Alive_v22;
    if (!idle) return;
    idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.35).play();
    return () => {
      idle.fadeOut(0.2).stop();
    };
  }, [actions]);

  useEffect(() => {
    const nose = actions.Rabbit_Nose_Twitch_v22;
    if (!nose) return;
    nose
      .reset()
      .setLoop(THREE.LoopRepeat, Infinity)
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(0.25)
      .play();
    return () => {
      nose.fadeOut(0.12).stop();
    };
  }, [actions]);

  useEffect(() => {
    const blink = actions.Rabbit_Blink_Natural_v22;
    if (!blink) return;

    let active = true;
    let intervalIndex = 0;
    let timer = 0;
    const schedule = (delaySeconds: number) => {
      timer = window.setTimeout(() => {
        if (!active) return;
        playOneShot(blink);
        const nextDelay = BLINK_INTERVALS_SECONDS[intervalIndex];
        intervalIndex = (intervalIndex + 1) % BLINK_INTERVALS_SECONDS.length;
        schedule(nextDelay);
      }, delaySeconds * 1000);
    };
    schedule(INITIAL_BLINK_DELAY_SECONDS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      blink.stop();
    };
  }, [actions]);

  useEffect(() => {
    const left = actions.Rabbit_Ear_L_v22;
    const right = actions.Rabbit_Ear_R_v22;
    if (!left || !right) return;

    let active = true;
    let sequenceIndex = 0;
    let timer = 0;
    const trigger = (kind: EarActionKind) => {
      if (kind === "left" || kind === "both") playOneShot(left);
      if (kind === "right" || kind === "both") playOneShot(right);
    };
    const scheduleNext = () => {
      const cue = EAR_ACTION_SEQUENCE[sequenceIndex];
      sequenceIndex = (sequenceIndex + 1) % EAR_ACTION_SEQUENCE.length;
      timer = window.setTimeout(() => {
        if (!active) return;
        trigger(cue.kind);
        scheduleNext();
      }, cue.delaySeconds * 1000);
    };
    scheduleNext();

    return () => {
      active = false;
      window.clearTimeout(timer);
      left.stop();
      right.stop();
    };
  }, [actions]);

  useEffect(() => {
    const left = actions.Rabbit_Forepaw_Adjust_L_v22;
    const right = actions.Rabbit_Forepaw_Adjust_R_v22;
    if (!left || !right) return;

    let active = true;
    let sequenceIndex = 0;
    let timer = 0;
    const trigger = (kind: ForepawActionKind) => {
      playAdditiveOneShot(kind === "left" ? left : right);
    };
    const scheduleNext = () => {
      const cue = FOREPAW_ACTION_SEQUENCE[sequenceIndex];
      sequenceIndex = (sequenceIndex + 1) % FOREPAW_ACTION_SEQUENCE.length;
      timer = window.setTimeout(() => {
        if (!active) return;
        trigger(cue.kind);
        scheduleNext();
      }, cue.delaySeconds * 1000);
    };
    scheduleNext();

    return () => {
      active = false;
      window.clearTimeout(timer);
      left.stop();
      right.stop();
    };
  }, [actions]);

  useEffect(() => {
    const left = actions.Rabbit_Hindpaw_Settle_L_v22;
    const right = actions.Rabbit_Hindpaw_Settle_R_v22;
    if (!left || !right) return;

    let active = true;
    let sequenceIndex = 0;
    let timer = 0;
    const trigger = (kind: HindpawActionKind) => {
      playAdditiveOneShot(kind === "left" ? left : right);
    };
    const scheduleNext = () => {
      const cue = HINDPAW_ACTION_SEQUENCE[sequenceIndex];
      sequenceIndex = (sequenceIndex + 1) % HINDPAW_ACTION_SEQUENCE.length;
      timer = window.setTimeout(() => {
        if (!active) return;
        trigger(cue.kind);
        scheduleNext();
      }, cue.delaySeconds * 1000);
    };
    scheduleNext();

    return () => {
      active = false;
      window.clearTimeout(timer);
      left.stop();
      right.stop();
    };
  }, [actions]);

  useEffect(() => {
    const left = actions.Rabbit_Attention_L_v22;
    const right = actions.Rabbit_Attention_R_v22;
    if (!left || !right) return;

    let active = true;
    let sequenceIndex = 0;
    let timer = 0;
    const trigger = (kind: AttentionActionKind) => {
      playAdditiveOneShot(kind === "left" ? left : right);
    };
    const scheduleNext = () => {
      const cue = ATTENTION_ACTION_SEQUENCE[sequenceIndex];
      sequenceIndex = (sequenceIndex + 1) % ATTENTION_ACTION_SEQUENCE.length;
      timer = window.setTimeout(() => {
        if (!active) return;
        trigger(cue.kind);
        scheduleNext();
      }, cue.delaySeconds * 1000);
    };
    scheduleNext();

    return () => {
      active = false;
      window.clearTimeout(timer);
      left.stop();
      right.stop();
    };
  }, [actions]);

  useEffect(() => {
    model.updateMatrixWorld(true);
    model.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) child.skeleton.update();
    });
    if (!readyReported.current) {
      readyReported.current = true;
      window.setTimeout(() => onReady?.(), 220);
    }
  }, [model, onReady]);

  return (
    <group position={[0, 0.015, 0]} scale={viewport.width < 5.5 ? 2.58 : 3.08}>
      <primitive object={model} />
    </group>
  );
}

export function RabbitScene({ onReady }: { onReady?: () => void }) {
  return (
    <>
      <fog attach="fog" args={["#dfd8cd", 7.4, 12]} />
      <ambientLight intensity={1.18} color="#fff8ef" />
      <hemisphereLight args={["#fffaf2", "#76685e", 1.62]} />
      <directionalLight position={[4.2, 6.4, 5.8]} intensity={3.1} color="#fff5e7" />
      <directionalLight position={[-4, 2.8, 1.8]} intensity={1.2} color="#c9d4cf" />
      <pointLight position={[0, 1.4, -4]} intensity={6.5} color="#c79c7f" distance={7} />

      <Rabbit onReady={onReady} />

      <mesh position={[0, -0.025, -0.08]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.4, 96]} />
        <meshStandardMaterial color="#d8d0c5" roughness={0.96} metalness={0} />
      </mesh>
      <ContactShadows
        position={[0, 0.002, -0.12]}
        opacity={0.4}
        scale={5.1}
        blur={2.2}
        far={2.4}
        resolution={384}
        frames={1}
        color="#59483c"
      />
      <OrbitControls
        makeDefault
        target={[0, 0.88, -0.08]}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        minDistance={3}
        maxDistance={7.4}
        minPolarAngle={0.42}
        maxPolarAngle={1.62}
        rotateSpeed={0.62}
        zoomSpeed={0.65}
      />
    </>
  );
}

useGLTF.preload(RABBIT_MODEL_URL, false, true);
