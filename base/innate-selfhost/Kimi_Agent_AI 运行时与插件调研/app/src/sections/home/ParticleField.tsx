import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 150;

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const { originalPositions, displacements } = useMemo(() => {
    const origPos = new Float32Array(PARTICLE_COUNT * 3);
    const disp = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 10;
      origPos[i * 3] = x;
      origPos[i * 3 + 1] = y;
      origPos[i * 3 + 2] = z;
      disp[i * 3] = 0;
      disp[i * 3 + 1] = 0;
      disp[i * 3 + 2] = 0;
    }
    return { originalPositions: origPos, displacements: disp };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => {
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const color1 = new THREE.Color('#7B61FF');
    const color2 = new THREE.Color('#6366F1');
    const color3 = new THREE.Color('#EC4899');
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = Math.random();
      const c = r < 0.33 ? color1 : r < 0.66 ? color2 : color3;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return col;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    mouseRef.current.x += (state.pointer.x * 10 - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (state.pointer.y * 6 - mouseRef.current.y) * 0.05;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      // Gentle floating motion
      const floatX = Math.sin(time * 0.3 + i * 0.1) * 0.3;
      const floatY = Math.cos(time * 0.2 + i * 0.15) * 0.2;

      // Mouse repulsion
      const dx = ox + floatX - mouseRef.current.x;
      const dy = oy + floatY - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 3;
      if (dist < repelRadius && dist > 0.01) {
        const force = (1 - dist / repelRadius) * 0.5;
        displacements[i3] += (dx / dist) * force;
        displacements[i3 + 1] += (dy / dist) * force;
      }

      // Decay displacement
      displacements[i3] *= 0.95;
      displacements[i3 + 1] *= 0.95;
      displacements[i3 + 2] *= 0.95;

      dummy.position.set(
        ox + floatX + displacements[i3],
        oy + floatY + displacements[i3 + 1],
        oz + displacements[i3 + 2]
      );

      // Scale pulses gently
      const s = 0.04 + Math.sin(time * 0.5 + i * 0.2) * 0.015;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 8, 8]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereGeometry>
      <meshBasicMaterial vertexColors transparent opacity={0.6} />
    </instancedMesh>
  );
}

export default function ParticleField() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: true }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
