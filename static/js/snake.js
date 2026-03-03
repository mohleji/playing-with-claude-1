/**
 * Snake Game — Game Arcade
 *
 * A classic Snake game rendered on an HTML5 Canvas.
 * Game logic is separated from rendering logic for testability.
 */

/* ===== Game Logic (pure functions & state management) ===== */

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;    // ms between ticks
const SPEED_INCREMENT = 2;    // ms faster per food eaten
const MIN_SPEED = 60;         // fastest possible tick rate

/** Direction vectors mapped by name */
const DIRECTIONS = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1  },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0  },
};

/** Opposite directions — used to prevent 180-degree turns */
const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/**
 * Create a fresh game state object.
 * @returns {object} Initial game state
 */
function createInitialState() {
  const midX = Math.floor(GRID_SIZE / 2);
  const midY = Math.floor(GRID_SIZE / 2);

  const state = {
    snake: [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ],
    direction: 'right',
    nextDirection: 'right',
    food: null,
    score: 0,
    gameOver: false,
    speed: INITIAL_SPEED,
  };

  state.food = spawnFood(state.snake);
  return state;
}

/**
 * Spawn food at a random unoccupied cell.
 * @param {Array<{x: number, y: number}>} snake - Current snake segments
 * @returns {{x: number, y: number}} Food position
 */
function spawnFood(snake) {
  const occupied = new Set(snake.map(seg => `${seg.x},${seg.y}`));
  const free = [];

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }

  if (free.length === 0) {
    return null; // board is full — player wins
  }

  return free[Math.floor(Math.random() * free.length)];
}

/**
 * Compute the next head position based on direction.
 * @param {{x: number, y: number}} head - Current head position
 * @param {string} direction - Direction name
 * @returns {{x: number, y: number}} New head position
 */
function getNextHead(head, direction) {
  const dir = DIRECTIONS[direction];
  return {
    x: head.x + dir.x,
    y: head.y + dir.y,
  };
}

/**
 * Check whether a position collides with a wall.
 * @param {{x: number, y: number}} pos
 * @returns {boolean}
 */
function collidesWithWall(pos) {
  return pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE;
}

/**
 * Check whether a position collides with any snake segment.
 * @param {{x: number, y: number}} pos
 * @param {Array<{x: number, y: number}>} snake
 * @returns {boolean}
 */
function collidesWithSnake(pos, snake) {
  return snake.some(seg => seg.x === pos.x && seg.y === pos.y);
}

/**
 * Advance the game by one tick. Returns a new state (does not mutate input).
 * @param {object} state - Current game state
 * @returns {object} Updated game state
 */
function tick(state) {
  if (state.gameOver) {
    return state;
  }

  const direction = state.nextDirection;
  const head = state.snake[0];
  const nextHead = getNextHead(head, direction);

  // Collision with walls
  if (collidesWithWall(nextHead)) {
    return { ...state, direction, gameOver: true };
  }

  // Collision with self (check against all segments except the tail,
  // because the tail will move away unless we're growing)
  const snakeWithoutTail = state.snake.slice(0, -1);
  if (collidesWithSnake(nextHead, snakeWithoutTail)) {
    return { ...state, direction, gameOver: true };
  }

  const ateFood = state.food !== null &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;

  let newSnake;
  if (ateFood) {
    // Grow: prepend new head, keep entire body
    newSnake = [nextHead, ...state.snake];
  } else {
    // Move: prepend new head, drop tail
    newSnake = [nextHead, ...state.snake.slice(0, -1)];
  }

  const newScore = ateFood ? state.score + 1 : state.score;
  const newFood = ateFood ? spawnFood(newSnake) : state.food;
  const newSpeed = ateFood
    ? Math.max(MIN_SPEED, state.speed - SPEED_INCREMENT)
    : state.speed;

  return {
    snake: newSnake,
    direction,
    nextDirection: direction,
    food: newFood,
    score: newScore,
    gameOver: false,
    speed: newSpeed,
  };
}

/**
 * Attempt to change direction, respecting the 180-degree turn rule.
 * @param {object} state - Current game state
 * @param {string} newDirection - Requested direction
 * @returns {object} State with updated nextDirection (or unchanged)
 */
function changeDirection(state, newDirection) {
  if (OPPOSITES[newDirection] === state.direction) {
    return state;
  }
  return { ...state, nextDirection: newDirection };
}


/* ===== Rendering ===== */

/** Theme colors drawn from CSS custom properties */
const COLORS = {
  background: '#0f0f1a',
  grid: '#1a1a2e',
  gridLine: 'rgba(255, 255, 255, 0.03)',
  snakeHead: '#e94560',
  snakeBody: '#c23152',
  snakeBodyAlt: '#a82a47',
  snakeOutline: 'rgba(0, 0, 0, 0.3)',
  food: '#4ade80',
  foodGlow: 'rgba(74, 222, 128, 0.35)',
  gameOverOverlay: 'rgba(15, 15, 26, 0.82)',
  gameOverText: '#e94560',
  gameOverSub: '#eee',
};

/**
 * Draw a rounded rectangle helper.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} r - corner radius
 */
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Render the current game state onto the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state
 */
function render(ctx, state) {
  const canvasWidth = GRID_SIZE * CELL_SIZE;
  const canvasHeight = GRID_SIZE * CELL_SIZE;

  // Clear canvas
  ctx.fillStyle = COLORS.grid;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw subtle grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  for (let i = 1; i < GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, canvasHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(canvasWidth, i * CELL_SIZE);
    ctx.stroke();
  }

  // Draw food with pulsing glow
  if (state.food !== null) {
    const fx = state.food.x * CELL_SIZE;
    const fy = state.food.y * CELL_SIZE;
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 200);
    const glowRadius = CELL_SIZE * pulse;

    // Glow
    const gradient = ctx.createRadialGradient(
      fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, 2,
      fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, glowRadius
    );
    gradient.addColorStop(0, COLORS.foodGlow);
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(fx - 4, fy - 4, CELL_SIZE + 8, CELL_SIZE + 8);

    // Food circle
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw snake
  const padding = 1;
  state.snake.forEach((seg, index) => {
    const sx = seg.x * CELL_SIZE + padding;
    const sy = seg.y * CELL_SIZE + padding;
    const sw = CELL_SIZE - padding * 2;
    const sh = CELL_SIZE - padding * 2;
    const cornerRadius = index === 0 ? 5 : 3;

    // Choose color
    if (index === 0) {
      ctx.fillStyle = COLORS.snakeHead;
    } else {
      ctx.fillStyle = index % 2 === 0 ? COLORS.snakeBody : COLORS.snakeBodyAlt;
    }

    // Draw segment with rounded corners
    roundedRect(ctx, sx, sy, sw, sh, cornerRadius);
    ctx.fill();

    // Subtle outline
    ctx.strokeStyle = COLORS.snakeOutline;
    ctx.lineWidth = 0.5;
    roundedRect(ctx, sx, sy, sw, sh, cornerRadius);
    ctx.stroke();

    // Eyes on the head
    if (index === 0) {
      drawEyes(ctx, seg, state.direction);
    }
  });

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = COLORS.gameOverText;
    ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 20);

    ctx.fillStyle = COLORS.gameOverSub;
    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`Score: ${state.score}`, canvasWidth / 2, canvasHeight / 2 + 20);
    ctx.fillText('Press Restart or Space to play again', canvasWidth / 2, canvasHeight / 2 + 50);
  }
}

/**
 * Draw eyes on the snake head facing the current direction.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number}} head
 * @param {string} direction
 */
function drawEyes(ctx, head, direction) {
  const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
  const eyeRadius = 2.5;
  const pupilRadius = 1.2;
  const offset = 4;

  let eye1, eye2;

  if (direction === 'up') {
    eye1 = { x: cx - offset, y: cy - offset + 1 };
    eye2 = { x: cx + offset, y: cy - offset + 1 };
  } else if (direction === 'down') {
    eye1 = { x: cx - offset, y: cy + offset - 1 };
    eye2 = { x: cx + offset, y: cy + offset - 1 };
  } else if (direction === 'left') {
    eye1 = { x: cx - offset + 1, y: cy - offset };
    eye2 = { x: cx - offset + 1, y: cy + offset };
  } else {
    eye1 = { x: cx + offset - 1, y: cy - offset };
    eye2 = { x: cx + offset - 1, y: cy + offset };
  }

  // Eye whites
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(eye1.x, eye1.y, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eye2.x, eye2.y, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
}


/* ===== Game Controller (ties logic + rendering + input) ===== */

if (typeof document !== 'undefined') (function initGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreElement = document.getElementById('score');
  const restartButton = document.getElementById('restart');

  let state = createInitialState();
  let lastTickTime = 0;
  let animationId = null;

  /** Map key events to direction names */
  const KEY_MAP = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right',
  };

  /** Handle keyboard input */
  function handleKeyDown(event) {
    const direction = KEY_MAP[event.key];

    if (direction !== undefined) {
      event.preventDefault();
      if (!state.gameOver) {
        state = changeDirection(state, direction);
      }
      return;
    }

    // Space bar restarts on game over
    if (event.key === ' ' && state.gameOver) {
      event.preventDefault();
      restart();
    }
  }

  /** Update the score display */
  function updateScoreDisplay() {
    scoreElement.textContent = `Score: ${state.score}`;
  }

  /** Reset the game to initial state */
  function restart() {
    state = createInitialState();
    lastTickTime = 0;
    updateScoreDisplay();
  }

  /**
   * Main game loop using requestAnimationFrame.
   * Ticks the game at intervals determined by state.speed.
   * @param {number} timestamp
   */
  function gameLoop(timestamp) {
    const elapsed = timestamp - lastTickTime;

    if (elapsed >= state.speed) {
      state = tick(state);
      updateScoreDisplay();
      lastTickTime = timestamp;
    }

    render(ctx, state);
    animationId = requestAnimationFrame(gameLoop);
  }

  // Attach event listeners
  document.addEventListener('keydown', handleKeyDown);
  restartButton.addEventListener('click', restart);

  // Clean up keyboard listeners on page unload
  function cleanup() {
    document.removeEventListener('keydown', handleKeyDown);
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  }

  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('unload', cleanup);

  // Start the game loop
  render(ctx, state);
  animationId = requestAnimationFrame(gameLoop);
})();


/* ===== Exports for testing ===== */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRID_SIZE,
    CELL_SIZE,
    DIRECTIONS,
    OPPOSITES,
    createInitialState,
    spawnFood,
    getNextHead,
    collidesWithWall,
    collidesWithSnake,
    tick,
    changeDirection,
  };
}
