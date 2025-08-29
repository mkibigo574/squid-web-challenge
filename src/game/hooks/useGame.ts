import { useState, useEffect, useCallback } from 'react';

export type GameState = 'waiting' | 'countdown' | 'playing' | 'won' | 'eliminated';
export type LightState = 'green' | 'red';

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [lightState, setLightState] = useState<LightState>('green');
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [countdown, setCountdown] = useState(3);
  
  const FINISH_LINE = 30;
  const GAME_DURATION = 60;

  const startGame = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    setTimeLeft(GAME_DURATION);
    setPlayerPosition(0);
    setLightState('green');
  }, []);

  const resetGame = useCallback(() => {
    setGameState('waiting');
    setTimeLeft(GAME_DURATION);
    setPlayerPosition(0);
    setCountdown(3);
    setLightState('green');
  }, []);

  const eliminatePlayer = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('eliminated');
    }
  }, [gameState]);

  const updatePlayerPosition = useCallback((newPosition: number) => {
    setPlayerPosition(newPosition);
    if (newPosition >= FINISH_LINE && gameState === 'playing') {
      setGameState('won');
    }
  }, [gameState, FINISH_LINE]);

  // Countdown logic
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
    }
  }, [gameState, countdown]);

  // Game timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      setGameState('eliminated');
    }
  }, [gameState, timeLeft]);

  // Doll state changes
  useEffect(() => {
    if (gameState === 'playing') {
      const changeLight = () => {
        const randomDuration = Math.random() * 3000 + 3000; // 3-6 seconds
        setLightState(prev => prev === 'green' ? 'red' : 'green');
        setTimeout(changeLight, randomDuration);
      };
      
      const initialDelay = setTimeout(changeLight, Math.random() * 3000 + 3000);
      return () => clearTimeout(initialDelay);
    }
  }, [gameState]);

  return {
    gameState,
    lightState,
    timeLeft,
    playerPosition,
    countdown,
    startGame,
    resetGame,
    eliminatePlayer,
    updatePlayerPosition,
    progress: playerPosition / FINISH_LINE,
    FINISH_LINE
  };
};