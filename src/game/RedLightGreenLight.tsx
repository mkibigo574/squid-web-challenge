import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGame } from './hooks/useGame';
import { Environment } from './components/Environment';
import { Player } from './components/Player';
import { Doll } from './components/Doll';
import { GameUI } from './components/GameUI';
import { ModelTester } from './components/ModelTester';
import { MODEL_CONFIG } from './config/models';
import { preloadAllModels } from './utils/modelPreloader';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const RedLightGreenLight = () => {
  const {
    gameState,
    lightState,
    timeLeft,
    playerPosition,
    countdown,
    progress,
    startGame,
    resetGame,
    eliminatePlayer,
    updatePlayerPosition
  } = useGame();

  const audioRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Preload all models when component mounts
  useEffect(() => {
    preloadAllModels();
  }, []);

  // Initialize audio (placeholder for now)
  useEffect(() => {
    // Placeholder audio elements - replace with actual files
    audioRef.current = {
      greenLight: new Audio(), // '/audio/green_light.mp3'
      redLight: new Audio(),   // '/audio/red_light.mp3'
      footsteps: new Audio(),  // '/audio/footsteps.mp3'
      buzzer: new Audio(),     // '/audio/buzzer.mp3'
    };
  }, []);

  // Play audio cues
  useEffect(() => {
    if (gameState === 'playing') {
      const audio = audioRef.current[lightState === 'green' ? 'greenLight' : 'redLight'];
      if (audio && audio.src) {
        audio.play().catch(() => {}); // Ignore autoplay restrictions
      }
    }
  }, [lightState, gameState]);

  useEffect(() => {
    if (gameState === 'eliminated') {
      const audio = audioRef.current.buzzer;
      if (audio && audio.src) {
        audio.play().catch(() => {});
      }
    }
  }, [gameState]);

  // Ensure a consistent, fixed camera that keeps the start, player, and finish in view
  const CameraReset = () => {
    const { camera, size } = useThree();
    useEffect(() => {
      const setCamera = () => {
        // Fit-to-bounds around the track: x in [-10,10], z in [-5,25]
        const boundsHalfWidthX = 12; // margin beyond rails
        const boundsHalfDepthZ = 17; // half of 30 + margin
        const target = new THREE.Vector3(0, 1, 10); // midpoint of track

        // Compute distance to fit both horizontally and vertically
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
        const fitRadius = Math.max(boundsHalfWidthX, boundsHalfDepthZ);
        const distH = fitRadius / Math.tan(hFov / 2);
        const distV = fitRadius / Math.tan(vFov / 2);
        const baseDistance = Math.max(distH, distV);

        // Place camera at an elevated angle looking toward target
        const elevationDeg = 50; // pleasant top-down view
        const elevation = THREE.MathUtils.degToRad(elevationDeg);
        const back = Math.cos(elevation) * baseDistance;
        const height = Math.sin(elevation) * baseDistance;

        camera.position.set(target.x, target.y + height, target.z - back);
        camera.near = 0.1;
        camera.far = 500;
        camera.updateProjectionMatrix();
        camera.lookAt(target);
      };

      setCamera(); // on mount

      // Reset camera when entering countdown/playing or on resize to preserve framing
      if (gameState === 'countdown' || gameState === 'playing') {
        setCamera();
      }
      // also when viewport resizes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, gameState, size.width, size.height]);
    return null;
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-blue-400 to-blue-600">
      <Canvas
        shadows
        camera={{ 
          position: [0, 24, -30],
          fov: 45,
          near: 0.1,
          far: 300
        }}
      >
        <CameraReset />
        <Environment />
        <Player
          lightState={lightState}
          gameState={gameState}
          onElimination={eliminatePlayer}
          onPositionUpdate={updatePlayerPosition}
          modelPath={MODEL_CONFIG.player.path}
        />
        <Doll lightState={lightState} modelPath={MODEL_CONFIG.doll.path} />
        
        {/* Camera controls - disabled during gameplay for better experience */}
        {/* Fixed camera for consistency; controls disabled to preserve framing */}
      </Canvas>
      
      <GameUI
        gameState={gameState}
        lightState={lightState}
        timeLeft={timeLeft}
        countdown={countdown}
        progress={progress}
        onStartGame={startGame}
        onResetGame={resetGame}
      />
      
      {/* Model tester for debugging - remove in production */}
      <ModelTester />
    </div>
  );
};