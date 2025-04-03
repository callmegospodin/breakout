import React, { useEffect, useRef, useState } from 'react';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  visible: boolean;
}

interface GameState {
  paddle: { x: number; width: number; height: number };
  ball: { x: number; y: number; dx: number; dy: number; radius: number };
  bricks: Brick[];
  score: number;
  gameOver: boolean;
  gameWon: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 10;
const PADDLE_WIDTH = 100;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());

  function initializeGame(): GameState {
    const bricks: Brick[] = [];
    const brickWidth = (CANVAS_WIDTH - (BRICK_COLS + 1) * BRICK_PADDING) / BRICK_COLS;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * (brickWidth + BRICK_PADDING) + BRICK_PADDING,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 30,
          width: brickWidth,
          height: BRICK_HEIGHT,
          color: COLORS[row],
          visible: true,
        });
      }
    }

    return {
      paddle: {
        x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
      },
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 30,
        dx: 4,
        dy: -4,
        radius: BALL_RADIUS,
      },
      bricks,
      score: 0,
      gameOver: false,
      gameWon: false,
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const x = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, relativeX));
      
      setGameState(prev => ({
        ...prev,
        paddle: {
          ...prev.paddle,
          x,
        },
      }));
    }

    canvas.addEventListener('mousemove', handleMouseMove);

    function update() {
      setGameState(prev => {
        if (prev.gameOver || prev.gameWon) return prev;

        const newBall = {
          ...prev.ball,
          x: prev.ball.x + prev.ball.dx,
          y: prev.ball.y + prev.ball.dy,
        };

        // Wall collisions
        if (newBall.x + BALL_RADIUS > CANVAS_WIDTH || newBall.x - BALL_RADIUS < 0) {
          newBall.dx *= -1;
        }
        if (newBall.y - BALL_RADIUS < 0) {
          newBall.dy *= -1;
        }

        // Paddle collision
        if (
          newBall.y + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT &&
          newBall.x > prev.paddle.x &&
          newBall.x < prev.paddle.x + PADDLE_WIDTH
        ) {
          newBall.dy = -Math.abs(newBall.dy);
          // Add some randomness to the bounce
          newBall.dx += (newBall.x - (prev.paddle.x + PADDLE_WIDTH / 2)) * 0.05;
        }

        // Game over check
        if (newBall.y + BALL_RADIUS > CANVAS_HEIGHT) {
          return { ...prev, gameOver: true };
        }

        // Brick collisions
        const newBricks = [...prev.bricks];
        let newScore = prev.score;
        let bricksRemaining = false;

        for (let i = 0; i < newBricks.length; i++) {
          const brick = newBricks[i];
          if (!brick.visible) continue;

          bricksRemaining = true;
          if (
            newBall.x > brick.x &&
            newBall.x < brick.x + brick.width &&
            newBall.y > brick.y &&
            newBall.y < brick.y + brick.height
          ) {
            newBricks[i] = { ...brick, visible: false };
            newBall.dy *= -1;
            newScore += 10;
          }
        }

        if (!bricksRemaining) {
          return { ...prev, gameWon: true };
        }

        return {
          ...prev,
          ball: newBall,
          bricks: newBricks,
          score: newScore,
        };
      });

      // Render
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw paddle
      ctx.fillStyle = '#333';
      ctx.fillRect(
        gameState.paddle.x,
        CANVAS_HEIGHT - PADDLE_HEIGHT,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball
      ctx.beginPath();
      ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
      ctx.closePath();

      // Draw bricks
      gameState.bricks.forEach(brick => {
        if (brick.visible) {
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
      });

      // Draw score
      ctx.font = '20px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText(`Score: ${gameState.score}`, 8, 20);

      // Game over or win message
      if (gameState.gameOver || gameState.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.font = '48px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(
          gameState.gameWon ? 'YOU WIN!' : 'GAME OVER',
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2
        );
      }

      animationFrameId = requestAnimationFrame(update);
    }

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState]);

  const handleRestart = () => {
    setGameState(initializeGame());
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-300 rounded-lg shadow-lg"
      />
      {(gameState.gameOver || gameState.gameWon) && (
        <button
          onClick={handleRestart}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Play Again
        </button>
      )}
    </div>
  );
};

export default Game;