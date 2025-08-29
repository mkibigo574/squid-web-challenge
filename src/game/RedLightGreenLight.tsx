import { Canvas } from '@react-three/fiber';
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

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-blue-400 to-blue-600">
      <Canvas
        shadows
        camera={{ 
          position: [0, 8, -8], 
          fov: 60,
          near: 0.1,
          far: 100
        }}
      >
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
        {gameState === 'waiting' && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={20}
          />
        )}
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