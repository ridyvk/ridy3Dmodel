import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { RabbitScene } from "./RabbitModel";

export default function RabbitCanvas({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      frameloop="always"
      shadows
      dpr={[0.7, 1.05]}
      camera={{ position: [3.55, 2.35, 5.35], fov: 35, near: 0.1, far: 30 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <Suspense fallback={null}>
        <RabbitScene onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
