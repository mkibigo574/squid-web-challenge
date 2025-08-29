import { useRef, useEffect, Suspense, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LightState } from '../hooks/useGame';

interface DollProps {
  lightState: LightState;
  modelPath?: string;
}

// Fallback primitive doll component
const PrimitiveDoll = ({ lightState }: { lightState: LightState }) => {
  const dollRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  useEffect(() => {
    // Set target rotation based on light state
    targetRotation.current = lightState === 'red' ? Math.PI : 0;
  }, [lightState]);

  useFrame((state, delta) => {
    if (!dollRef.current) return;

    // Smooth rotation animation
    const rotationSpeed = 2; // radians per second
    const diff = targetRotation.current - currentRotation.current;
    
    if (Math.abs(diff) > 0.01) {
      const step = rotationSpeed * delta;
      if (diff > 0) {
        currentRotation.current = Math.min(currentRotation.current + step, targetRotation.current);
      } else {
        currentRotation.current = Math.max(currentRotation.current - step, targetRotation.current);
      }
      
      dollRef.current.rotation.y = currentRotation.current;
    }
  });

  return (
    <group ref={dollRef} position={[0, 0, 25]}>
      {/* Doll Base */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[1.5, 2, 4]} />
        <meshLambertMaterial color="#ff6b9d" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 5, 0]} castShadow>
        <sphereGeometry args={[1.2]} />
        <meshLambertMaterial color="#ffdbac" />
      </mesh>
      
      {/* Eyes (facing forward when red light) */}
      <mesh position={[-0.4, 5.2, 1]} castShadow>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.4, 5.2, 1]} castShadow>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      
      {/* Hair buns */}
      <mesh position={[-0.8, 6, 0]} castShadow>
        <sphereGeometry args={[0.4]} />
        <meshLambertMaterial color="#4a4a4a" />
      </mesh>
      <mesh position={[0.8, 6, 0]} castShadow>
        <sphereGeometry args={[0.4]} />
        <meshLambertMaterial color="#4a4a4a" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-1.5, 3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2]} />
        <meshLambertMaterial color="#ffdbac" />
      </mesh>
      <mesh position={[1.5, 3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2]} />
        <meshLambertMaterial color="#ffdbac" />
      </mesh>
      
      {/* Platform */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[3, 3, 1]} />
        <meshLambertMaterial color="#8b4513" />
      </mesh>
    </group>
  );
};

// Loading component for doll
const DollLoading = () => (
  <group position={[0, 0, 25]}>
    <mesh position={[0, 2, 0]}>
      <cylinderGeometry args={[1.5, 2, 4]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
    <mesh position={[0, 5, 0]}>
      <sphereGeometry args={[1.2]} />
      <meshBasicMaterial color="#666" wireframe />
    </mesh>
  </group>
);

// GLB Doll component (no state updates during render/Suspense)
const GLBDoll = ({ modelPath, lightState }: { 
  modelPath: string; 
  lightState: LightState;
}) => {
  const dollRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  const { scene } = useGLTF(modelPath);
    
    useEffect(() => {
      if (scene) {
        // Clone the scene to avoid issues with multiple instances
        const clonedScene = scene.clone();
        
        // Ensure shadows are enabled on all meshes
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Center and scale the model appropriately
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim; // Scale to roughly 4 units tall for doll
        
        clonedScene.scale.setScalar(scale);
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3());
        clonedScene.position.sub(center);
        
        return clonedScene;
      }
    }, [scene]);
    
    useEffect(() => {
      // Set target rotation based on light state
      targetRotation.current = lightState === 'red' ? Math.PI : 0;
    }, [lightState]);

    useFrame((state, delta) => {
      if (!dollRef.current) return;

      // Smooth rotation animation
      const rotationSpeed = 2; // radians per second
      const diff = targetRotation.current - currentRotation.current;
      
      if (Math.abs(diff) > 0.01) {
        const step = rotationSpeed * delta;
        if (diff > 0) {
          currentRotation.current = Math.min(currentRotation.current + step, targetRotation.current);
        } else {
          currentRotation.current = Math.max(currentRotation.current - step, targetRotation.current);
        }
        
        dollRef.current.rotation.y = currentRotation.current;
      }
    });
    
    return (
      <group ref={dollRef} position={[0, 0, 25]}>
        <primitive object={scene} />
      </group>
    );
};

export const Doll = ({ lightState, modelPath }: DollProps) => {
  const [usePrimitive, setUsePrimitive] = useState(!modelPath);
  useEffect(() => {
    if (!modelPath) setUsePrimitive(true);
  }, [modelPath]);

  return (
    <Suspense fallback={<DollLoading />}>
      {modelPath && !usePrimitive ? (
        <GLBDoll 
          modelPath={modelPath} 
          lightState={lightState} 
        />
      ) : (
        <PrimitiveDoll lightState={lightState} />
      )}
    </Suspense>
  );
};
