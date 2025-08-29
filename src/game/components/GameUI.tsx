import { GameState, LightState } from '../hooks/useGame';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface GameUIProps {
  gameState: GameState;
  lightState: LightState;
  timeLeft: number;
  countdown: number;
  progress: number;
  onStartGame: () => void;
  onResetGame: () => void;
}

export const GameUI = ({
  gameState,
  lightState,
  timeLeft,
  countdown,
  progress,
  onStartGame,
  onResetGame
}: GameUIProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top UI */}
      <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-8 pointer-events-auto">
        {/* Light State Indicator */}
        <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
          lightState === 'green' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {lightState === 'green' ? 'GREEN LIGHT' : 'RED LIGHT'}
        </div>
        
        {/* Timer */}
        <div className="text-3xl font-bold text-white bg-black/50 px-4 py-2 rounded-lg">
          {timeLeft}s
        </div>
      </div>

      {/* Center UI */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
        {gameState === 'waiting' && (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white mb-8">Red Light, Green Light</h1>
            <p className="text-xl text-white mb-4">Move during GREEN LIGHT, freeze during RED LIGHT!</p>
            <p className="text-lg text-white mb-8">Use WASD or Arrow Keys to move</p>
            <Button onClick={onStartGame} size="lg" className="text-xl px-8 py-4">
              Start Game
            </Button>
          </div>
        )}
        
        {gameState === 'countdown' && (
          <div className="text-8xl font-bold text-white">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        )}
        
        {gameState === 'won' && (
          <div className="space-y-4">
            <h2 className="text-6xl font-bold text-green-400">YOU WIN!</h2>
            <p className="text-xl text-white">You reached the finish line!</p>
            <Button onClick={onResetGame} size="lg" className="text-xl px-8 py-4">
              Play Again
            </Button>
          </div>
        )}
        
        {gameState === 'eliminated' && (
          <div className="space-y-4">
            <h2 className="text-6xl font-bold text-red-400">ELIMINATED!</h2>
            <p className="text-xl text-white">
              {timeLeft === 0 ? 'Time ran out!' : 'You moved during red light!'}
            </p>
            <Button onClick={onResetGame} size="lg" className="text-xl px-8 py-4">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Bottom UI */}
      {gameState === 'playing' && (
        <div className="absolute bottom-8 left-8 right-8 pointer-events-auto">
          <div className="bg-black/50 p-4 rounded-lg">
            <div className="text-white mb-2">Progress to Finish Line</div>
            <Progress value={progress * 100} className="h-4" />
          </div>
        </div>
      )}

      {/* Controls hint */}
      {gameState === 'playing' && (
        <div className="absolute bottom-4 right-4 text-white bg-black/50 px-3 py-2 rounded">
          WASD / Arrow Keys to move
        </div>
      )}
    </div>
  );
};