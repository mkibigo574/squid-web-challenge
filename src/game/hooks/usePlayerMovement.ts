import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LightState } from './useGame';

export const usePlayerMovement = (
  lightState: LightState,
  onElimination: () => void,
  onPositionUpdate: (position: number) => void,
  gameActive: boolean
) => {
  const playerGroupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const keysPressed = useRef<Set<string>>(new Set());
  const wasMovingDuringRedLight = useRef(false);

  const MOVE_SPEED = 8;
  const FRICTION = 0.9;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameActive) return;
      keysPressed.current.add(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive]);

  useFrame((state, delta) => {
    if (!playerGroupRef.current || !gameActive) return;

    const velocity = velocityRef.current;
    const playerGroup = playerGroupRef.current;

    // Calculate movement based on input
    const moveVector = new THREE.Vector3(0, 0, 0);
    
    if (keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) {
      moveVector.z -= 1;
    }
    if (keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown')) {
      moveVector.z += 1;
    }
    if (keysPressed.current.has('KeyA') || keysPressed.current.has('ArrowLeft')) {
      moveVector.x -= 1;
    }
    if (keysPressed.current.has('KeyD') || keysPressed.current.has('ArrowRight')) {
      moveVector.x += 1;
    }

    moveVector.normalize();
    moveVector.multiplyScalar(MOVE_SPEED * delta);

    // Check for movement during red light
    const isMoving = moveVector.length() > 0;
    
    if (lightState === 'red' && isMoving) {
      wasMovingDuringRedLight.current = true;
      console.log('Movement detected during red light!');
      // Delay elimination slightly to show the movement
      setTimeout(() => {
        if (wasMovingDuringRedLight.current) {
          onElimination();
        }
      }, 100);
    } else if (lightState === 'green') {
      wasMovingDuringRedLight.current = false;
    }

    // Apply movement only during green light
    if (lightState === 'green') {
      velocity.add(moveVector);
      if (isMoving) {
        console.log('Moving during green light:', playerGroup.position.z);
      }
    }

    // Apply friction
    velocity.multiplyScalar(FRICTION);

    // Update position
    playerGroup.position.add(velocity);

    // Constrain movement
    playerGroup.position.x = Math.max(-10, Math.min(10, playerGroup.position.x));
    playerGroup.position.z = Math.max(-5, Math.min(25, playerGroup.position.z));

    // Update game position (forward progress)
    onPositionUpdate(Math.max(0, 5 + playerGroup.position.z));
  });

  return { playerGroupRef };
};