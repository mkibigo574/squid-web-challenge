import { useRef, useEffect, Suspense, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { LightState, GameState } from '../hooks/useGame';

interface PlayerProps {
  lightState: LightState;
  gameState: GameState;
  onElimination: () => void;
  onPositionUpdate: (position: number) => void;
  modelPath?: string;
}

// Fallback primitive player component
const PrimitivePlayer = () => (
  <>
    {/* Body */}
    <mesh position={[0, 1, 0]} castShadow>
      <boxGeometry args={[0.8, 1.6, 0.4]} />
      <meshLambertMaterial color="#4a90e2" />
    </mesh>
    
    {/* Head */}
    <mesh position={[0, 2.2, 0]} castShadow>
      <sphereGeometry args={[0.3]} />
      <meshLambertMaterial color="#ffdbac" />
    </mesh>
    
    {/* Arms */}
    <mesh position={[-0.6, 1.2, 0]} castShadow>
      <boxGeometry args={[0.2, 0.8, 0.2]} />
      <meshLambertMaterial color="#ffdbac" />
    </mesh>
    <mesh position={[0.6, 1.2, 0]} castShadow>
      <boxGeometry args={[0.2, 0.8, 0.2]} />
      <meshLambertMaterial color="#ffdbac" />
    </mesh>
    
    {/* Legs */}
    <mesh position={[-0.3, 0.2, 0]} castShadow>
      <boxGeometry args={[0.2, 0.8, 0.2]} />
      <meshLambertMaterial color="#333" />
    </mesh>
    <mesh position={[0.3, 0.2, 0]} castShadow>
      <boxGeometry args={[0.2, 0.8, 0.2]} />
      <meshLambertMaterial color="#333" />
    </mesh>
  </>
);

// Loading component
const PlayerLoading = () => (
  <group>
    <mesh position={[0, 1, 0]}>
      <sphereGeometry args={[0.5]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
  </group>
);

// GLB Player component (no state updates during render/Suspense)
const GLBPlayer = ({ modelPath, isMoving }: { modelPath: string; isMoving: boolean }) => {
  const { scene, animations } = useGLTF(modelPath);
  const mixerRef = useRef<THREE.AnimationMixer>();
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!scene) return;
    // Enable shadows on all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Setup animation mixer if clips are present
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      // Pick the first running-looking clip if present, else first
      const runClip = animations.find(a => /run|walk/i.test(a.name)) || animations[0];
      actionRef.current = mixerRef.current.clipAction(runClip);
      actionRef.current.play();
      actionRef.current.timeScale = 0; // start paused; unpause when moving
    }
  }, [scene, animations]);

  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
    if (actionRef.current) {
      // Unpause when moving, pause when idle via timeScale
      actionRef.current.timeScale = isMoving ? 1 : 0;
    }
  });

  useEffect(() => {
    return () => {
      try {
        if (actionRef.current) actionRef.current.stop();
        if (mixerRef.current) mixerRef.current.stopAllAction();
      } catch {}
    };
  }, []);

  return (
    <primitive 
      object={scene} 
      scale={[1, 1, 1]} 
      position={[0, 0, 0]}
    />
  );
};

export const Player = ({ lightState, gameState, onElimination, onPositionUpdate, modelPath }: PlayerProps) => {
  const eliminationAnimation = useRef(false);
  const [usePrimitive, setUsePrimitive] = useState(!modelPath);
  
  const [isMoving, setIsMoving] = useState(false);
  const [assetChecked, setAssetChecked] = useState(false);

  const { playerGroupRef } = usePlayerMovement(
    lightState,
    onElimination,
    onPositionUpdate,
    gameState === 'playing',
    setIsMoving
  );

  // Proactively verify model asset availability to avoid canvas crash
  useEffect(() => {
    let cancelled = false;
    if (!modelPath) {
      setUsePrimitive(true);
      setAssetChecked(true);
      return;
    }
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) setUsePrimitive(true);
        setAssetChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setUsePrimitive(true);
        setAssetChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [modelPath]);

  // If model path is missing, use primitive fallback
  useEffect(() => {
    if (!modelPath) setUsePrimitive(true);
  }, [modelPath]);

  // Elimination animation
  useEffect(() => {
    if (gameState === 'eliminated' && !eliminationAnimation.current) {
      eliminationAnimation.current = true;
      
      if (playerGroupRef.current) {
        // Fall backward animation
        const startRotation = playerGroupRef.current.rotation.x;
        const startTime = Date.now();
        const duration = 1000;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          if (playerGroupRef.current) {
            playerGroupRef.current.rotation.x = startRotation - (Math.PI / 2) * easeOut;
            // Keep the character above ground while falling
            playerGroupRef.current.position.y = Math.max(1, 1 - 0.2 * easeOut);
          }
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    } else if (gameState !== 'eliminated') {
      eliminationAnimation.current = false;
      if (playerGroupRef.current) {
        playerGroupRef.current.rotation.x = 0;
        playerGroupRef.current.position.y = 1;
      }
    }
  }, [gameState]);

  // Reset position when game starts and keep above ground during countdown/waiting
  useEffect(() => {
    if (!playerGroupRef.current) return;
    if (gameState === 'countdown') {
      playerGroupRef.current.position.set(0, 1, -5);
    } else if (gameState === 'waiting') {
      // Ensure idle pose is above ground
      playerGroupRef.current.position.y = 1;
    }
  }, [gameState]);

  return (
    <group ref={playerGroupRef} position={[0, 1, -5]}>
      <Suspense fallback={<PlayerLoading />}>
        {modelPath && !usePrimitive && assetChecked ? (
          <GLBPlayer modelPath={modelPath} isMoving={isMoving} />
        ) : (
          <PrimitivePlayer />
        )}
      </Suspense>
    </group>
  );
};
 