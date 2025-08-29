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
const GLBPlayer = ({ modelPath }: { modelPath: string }) => {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    if (!scene) return;
    // Enable shadows on all meshes
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

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
  
  const { playerGroupRef } = usePlayerMovement(
    lightState,
    onElimination,
    onPositionUpdate,
    gameState === 'playing'
  );

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
            playerGroupRef.current.position.y = -0.5 * easeOut;
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
        playerGroupRef.current.position.y = 0;
      }
    }
  }, [gameState]);

  // Reset position when game starts
  useEffect(() => {
    if (gameState === 'countdown' && playerGroupRef.current) {
      playerGroupRef.current.position.set(0, 0, -5);
    }
  }, [gameState]);

  return (
    <group ref={playerGroupRef} position={[0, 0, -5]}>
      <Suspense fallback={<PlayerLoading />}>
        {modelPath && !usePrimitive ? (
          <GLBPlayer modelPath={modelPath} />
        ) : (
          <PrimitivePlayer />
        )}
      </Suspense>
    </group>
  );
};
 