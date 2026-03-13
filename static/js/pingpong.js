/**
 * Ping Pong Game — Game Arcade
 *
 * A one-player Ping Pong game against a computer opponent,
 * rendered on an HTML5 Canvas. Game logic is separated from
 * rendering logic for testability.
 */

/* ===== Constants ===== */

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;
const CPU_SPEED = 3;
const PADDLE_MARGIN = 20;


/* ===== Game Logic (pure functions & state management) ===== */

/**
 * Create a fresh game state object.
 * @returns {object} Initial game state
 */
function createInitialState() {
  return {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      vy: BALL_SPEED * (Math.random() > 0.5 ? 0.8 : -0.8),
    },
    playerPaddle: {
      x: CANVAS_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    },
    cpuPaddle: {
      x: PADDLE_MARGIN,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    },
    playerScore: 0,
    cpuScore: 0,
    paused: false,
  };
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Move the CPU paddle toward the ball using simple AI.
 * @param {{y: number}} cpuPaddle
 * @param {{y: number}} ball
 * @returns {{y: number}} Updated CPU paddle
 */
function moveCpuPaddle(cpuPaddle, ball) {
  const paddleCenter = cpuPaddle.y + PADDLE_HEIGHT / 2;
  let newY = cpuPaddle.y;

  if (paddleCenter < ball.y - 5) {
    newY += CPU_SPEED;
  } else if (paddleCenter > ball.y + 5) {
    newY -= CPU_SPEED;
  }

  return { ...cpuPaddle, y: clamp(newY, 0, CANVAS_HEIGHT - PADDLE_HEIGHT) };
}

/**
 * Move the player paddle toward a target y position (e.g. mouse position).
 * @param {{y: number}} paddle
 * @param {number} targetY - Desired center y of the paddle
 * @returns {{y: number}} Updated player paddle
 */
function movePlayerPaddle(paddle, targetY) {
  const newY = targetY - PADDLE_HEIGHT / 2;
  return { ...paddle, y: clamp(newY, 0, CANVAS_HEIGHT - PADDLE_HEIGHT) };
}

/**
 * Detect whether the ball overlaps with a paddle rectangle.
 * @param {{x: number, y: number}} ball
 * @param {{x: number, y: number}} paddle
 * @returns {boolean}
 */
function ballHitsPaddle(ball, paddle) {
  return (
    ball.x < paddle.x + PADDLE_WIDTH &&
    ball.x + BALL_SIZE > paddle.x &&
    ball.y < paddle.y + PADDLE_HEIGHT &&
    ball.y + BALL_SIZE > paddle.y
  );
}

/**
 * Compute the result of a scoring event.
 * Returns updated scores and a reset ball.
 * @param {object} state
 * @param {'player'|'cpu'} scorer - Who scored the point
 * @returns {object} Partial state update with new scores and reset ball
 */
function applyScore(state, scorer) {
  const playerScore = scorer === 'player' ? state.playerScore + 1 : state.playerScore;
  const cpuScore = scorer === 'cpu' ? state.cpuScore + 1 : state.cpuScore;
  const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: BALL_SPEED * (scorer === 'player' ? -1 : 1),
    vy: BALL_SPEED * (Math.random() > 0.5 ? 0.8 : -0.8),
  };
  return { ...state, ball, playerScore, cpuScore };
}

/**
 * Advance the game by one frame. Returns a new state (does not mutate input).
 * @param {object} state - Current game state
 * @param {number} targetY - Current mouse/touch y position for player paddle
 * @returns {object} Updated game state
 */
function tick(state, targetY) {
  if (state.paused) {
    return state;
  }

  // Move player paddle toward mouse
  const playerPaddle = movePlayerPaddle(state.playerPaddle, targetY);

  // Move CPU paddle toward ball
  const cpuPaddle = moveCpuPaddle(state.cpuPaddle, state.ball);

  // Move ball
  let { x, y, vx, vy } = state.ball;
  x += vx;
  y += vy;

  // Bounce off top and bottom walls
  if (y <= 0) {
    y = 0;
    vy = Math.abs(vy);
  } else if (y + BALL_SIZE >= CANVAS_HEIGHT) {
    y = CANVAS_HEIGHT - BALL_SIZE;
    vy = -Math.abs(vy);
  }

  let ball = { x, y, vx, vy };

  // Bounce off player paddle (right side)
  if (vx > 0 && ballHitsPaddle(ball, playerPaddle)) {
    const hitOffset = (ball.y + BALL_SIZE / 2) - (playerPaddle.y + PADDLE_HEIGHT / 2);
    const normalizedOffset = hitOffset / (PADDLE_HEIGHT / 2);
    ball = {
      ...ball,
      x: playerPaddle.x - BALL_SIZE,
      vx: -Math.abs(vx),
      vy: normalizedOffset * BALL_SPEED,
    };
  }

  // Bounce off CPU paddle (left side)
  if (vx < 0 && ballHitsPaddle(ball, cpuPaddle)) {
    const hitOffset = (ball.y + BALL_SIZE / 2) - (cpuPaddle.y + PADDLE_HEIGHT / 2);
    const normalizedOffset = hitOffset / (PADDLE_HEIGHT / 2);
    ball = {
      ...ball,
      x: cpuPaddle.x + PADDLE_WIDTH,
      vx: Math.abs(vx),
      vy: normalizedOffset * BALL_SPEED,
    };
  }

  const newState = { ...state, ball, playerPaddle, cpuPaddle };

  // Ball exits left side — player scores
  if (ball.x + BALL_SIZE < 0) {
    return applyScore(newState, 'player');
  }

  // Ball exits right side — CPU scores
  if (ball.x > CANVAS_WIDTH) {
    return applyScore(newState, 'cpu');
  }

  return newState;
}


/* ===== Rendering ===== */

const COLORS = {
  background: '#0f0f1a',
  net: 'rgba(255, 255, 255, 0.15)',
  paddle: '#e94560',
  cpuPaddle: '#4ade80',
  ball: '#ffffff',
  scoreText: '#eee',
  scoreMuted: '#888',
};

/**
 * Render the current game state onto the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state
 */
function render(ctx, state) {
  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Net (dashed center line)
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = COLORS.net;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores
  ctx.fillStyle = COLORS.scoreText;
  ctx.font = 'bold 48px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(state.cpuScore, CANVAS_WIDTH / 4, 16);
  ctx.fillText(state.playerScore, (CANVAS_WIDTH / 4) * 3, 16);

  // Labels
  ctx.fillStyle = COLORS.scoreMuted;
  ctx.font = '13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('CPU', CANVAS_WIDTH / 4, 68);
  ctx.fillText('You', (CANVAS_WIDTH / 4) * 3, 68);

  // CPU paddle
  ctx.fillStyle = COLORS.cpuPaddle;
  ctx.beginPath();
  ctx.roundRect(
    state.cpuPaddle.x,
    state.cpuPaddle.y,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    4
  );
  ctx.fill();

  // Player paddle
  ctx.fillStyle = COLORS.paddle;
  ctx.beginPath();
  ctx.roundRect(
    state.playerPaddle.x,
    state.playerPaddle.y,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    4
  );
  ctx.fill();

  // Ball
  ctx.fillStyle = COLORS.ball;
  ctx.beginPath();
  ctx.roundRect(state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE, 3);
  ctx.fill();
}


/* ===== Game Controller (ties logic + rendering + input) ===== */

if (typeof document !== 'undefined') (function initGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const playerScoreEl = document.getElementById('player-score');
  const cpuScoreEl = document.getElementById('cpu-score');
  const restartButton = document.getElementById('restart');

  let state = createInitialState();
  let mouseY = CANVAS_HEIGHT / 2;
  let animationId = null;

  /** Update score display elements */
  function updateScoreDisplay() {
    playerScoreEl.textContent = state.playerScore;
    cpuScoreEl.textContent = state.cpuScore;
  }

  /** Reset to initial game state */
  function restart() {
    state = createInitialState();
    mouseY = CANVAS_HEIGHT / 2;
    updateScoreDisplay();
  }

  /** Track mouse position relative to canvas */
  function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseY = event.clientY - rect.top;
  }

  /** Track touch position for mobile */
  function handleTouchMove(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouseY = event.touches[0].clientY - rect.top;
  }

  /** Handle keyboard for paddle movement */
  const keys = {};
  function handleKeyDown(event) {
    keys[event.key] = true;
    if (event.key === ' ') {
      event.preventDefault();
      restart();
    }
  }
  function handleKeyUp(event) {
    keys[event.key] = false;
  }

  /**
   * Main game loop using requestAnimationFrame.
   */
  function gameLoop() {
    // Allow keyboard control (ArrowUp / ArrowDown / w / s)
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      mouseY = clamp(mouseY - PADDLE_SPEED * 2, 0, CANVAS_HEIGHT);
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
      mouseY = clamp(mouseY + PADDLE_SPEED * 2, 0, CANVAS_HEIGHT);
    }

    state = tick(state, mouseY);
    updateScoreDisplay();
    render(ctx, state);
    animationId = requestAnimationFrame(gameLoop);
  }

  // Attach event listeners
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  restartButton.addEventListener('click', restart);

  // Clean up on page unload
  function cleanup() {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('unload', cleanup);

  // Start game
  render(ctx, state);
  animationId = requestAnimationFrame(gameLoop);
})();


/* ===== Exports for testing ===== */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    PADDLE_WIDTH,
    PADDLE_HEIGHT,
    BALL_SIZE,
    BALL_SPEED,
    CPU_SPEED,
    PADDLE_MARGIN,
    createInitialState,
    clamp,
    moveCpuPaddle,
    movePlayerPaddle,
    ballHitsPaddle,
    applyScore,
    tick,
  };
}
