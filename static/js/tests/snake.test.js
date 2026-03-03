/**
 * Snake Game — Unit Tests
 *
 * Assertion-based tests for core game logic.
 * Run with Node.js: node static/js/tests/snake.test.js
 */

const {
  GRID_SIZE,
  DIRECTIONS,
  OPPOSITES,
  createInitialState,
  spawnFood,
  getNextHead,
  collidesWithWall,
  collidesWithSnake,
  tick,
  changeDirection,
} = require('../snake.js');

let passed = 0;
let failed = 0;

/**
 * Simple test runner — logs pass/fail and tracks counts.
 * @param {string} name - Test description
 * @param {Function} fn - Test function that throws on failure
 */
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
  }
}

/**
 * Assert that a condition is truthy.
 * @param {*} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Assert strict equality.
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}


/* ===== createInitialState ===== */
console.log('\ncreateInitialState');

test('returns a state with a snake of length 3', () => {
  const state = createInitialState();
  assertEqual(state.snake.length, 3);
});

test('snake starts in the middle of the grid', () => {
  const state = createInitialState();
  const midX = Math.floor(GRID_SIZE / 2);
  const midY = Math.floor(GRID_SIZE / 2);
  assertEqual(state.snake[0].x, midX);
  assertEqual(state.snake[0].y, midY);
});

test('initial direction is right', () => {
  const state = createInitialState();
  assertEqual(state.direction, 'right');
  assertEqual(state.nextDirection, 'right');
});

test('initial score is 0', () => {
  const state = createInitialState();
  assertEqual(state.score, 0);
});

test('gameOver is false initially', () => {
  const state = createInitialState();
  assertEqual(state.gameOver, false);
});

test('food is placed on the grid', () => {
  const state = createInitialState();
  assert(state.food !== null, 'food should not be null');
  assert(state.food.x >= 0 && state.food.x < GRID_SIZE, 'food x in bounds');
  assert(state.food.y >= 0 && state.food.y < GRID_SIZE, 'food y in bounds');
});

test('food does not spawn on the snake', () => {
  const state = createInitialState();
  const onSnake = state.snake.some(
    seg => seg.x === state.food.x && seg.y === state.food.y
  );
  assertEqual(onSnake, false);
});


/* ===== getNextHead ===== */
console.log('\ngetNextHead');

test('moving right increments x', () => {
  const next = getNextHead({ x: 5, y: 5 }, 'right');
  assertEqual(next.x, 6);
  assertEqual(next.y, 5);
});

test('moving left decrements x', () => {
  const next = getNextHead({ x: 5, y: 5 }, 'left');
  assertEqual(next.x, 4);
  assertEqual(next.y, 5);
});

test('moving up decrements y', () => {
  const next = getNextHead({ x: 5, y: 5 }, 'up');
  assertEqual(next.x, 5);
  assertEqual(next.y, 4);
});

test('moving down increments y', () => {
  const next = getNextHead({ x: 5, y: 5 }, 'down');
  assertEqual(next.x, 5);
  assertEqual(next.y, 6);
});


/* ===== collidesWithWall ===== */
console.log('\ncollidesWithWall');

test('detects collision with left wall', () => {
  assertEqual(collidesWithWall({ x: -1, y: 5 }), true);
});

test('detects collision with right wall', () => {
  assertEqual(collidesWithWall({ x: GRID_SIZE, y: 5 }), true);
});

test('detects collision with top wall', () => {
  assertEqual(collidesWithWall({ x: 5, y: -1 }), true);
});

test('detects collision with bottom wall', () => {
  assertEqual(collidesWithWall({ x: 5, y: GRID_SIZE }), true);
});

test('no collision for cell inside the grid', () => {
  assertEqual(collidesWithWall({ x: 0, y: 0 }), false);
});

test('no collision for cell at max valid position', () => {
  assertEqual(collidesWithWall({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 }), false);
});


/* ===== collidesWithSnake ===== */
console.log('\ncollidesWithSnake');

test('detects collision with a snake segment', () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
  assertEqual(collidesWithSnake({ x: 5, y: 5 }, snake), true);
});

test('no collision when position is free', () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
  assertEqual(collidesWithSnake({ x: 6, y: 5 }, snake), false);
});

test('detects collision with any segment, not just head', () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  assertEqual(collidesWithSnake({ x: 3, y: 5 }, snake), true);
});


/* ===== changeDirection ===== */
console.log('\nchangeDirection');

test('allows changing to a perpendicular direction', () => {
  const state = createInitialState(); // direction: 'right'
  const newState = changeDirection(state, 'up');
  assertEqual(newState.nextDirection, 'up');
});

test('prevents 180-degree turn (right to left)', () => {
  const state = createInitialState(); // direction: 'right'
  const newState = changeDirection(state, 'left');
  assertEqual(newState.nextDirection, 'right');
});

test('prevents 180-degree turn (up to down)', () => {
  let state = createInitialState();
  state = { ...state, direction: 'up', nextDirection: 'up' };
  const newState = changeDirection(state, 'down');
  assertEqual(newState.nextDirection, 'up');
});

test('prevents 180-degree turn (down to up)', () => {
  let state = createInitialState();
  state = { ...state, direction: 'down', nextDirection: 'down' };
  const newState = changeDirection(state, 'up');
  assertEqual(newState.nextDirection, 'down');
});

test('prevents 180-degree turn (left to right)', () => {
  let state = createInitialState();
  state = { ...state, direction: 'left', nextDirection: 'left' };
  const newState = changeDirection(state, 'right');
  assertEqual(newState.nextDirection, 'left');
});


/* ===== tick — movement ===== */
console.log('\ntick — movement');

test('snake head moves in the current direction', () => {
  const state = createInitialState();
  // Place food far away to avoid accidental eating
  const testState = { ...state, food: { x: 0, y: 0 } };
  const next = tick(testState);
  const expectedX = state.snake[0].x + 1; // moving right
  assertEqual(next.snake[0].x, expectedX);
  assertEqual(next.snake[0].y, state.snake[0].y);
});

test('snake length stays the same when not eating', () => {
  const state = createInitialState();
  const testState = { ...state, food: { x: 0, y: 0 } };
  const next = tick(testState);
  assertEqual(next.snake.length, state.snake.length);
});

test('tail is removed when not eating food', () => {
  const state = createInitialState();
  const testState = { ...state, food: { x: 0, y: 0 } };
  const oldTail = state.snake[state.snake.length - 1];
  const next = tick(testState);
  const newTail = next.snake[next.snake.length - 1];
  // New tail should be the old second-to-last segment
  assertEqual(newTail.x, state.snake[state.snake.length - 2].x);
  assertEqual(newTail.y, state.snake[state.snake.length - 2].y);
});


/* ===== tick — food eating and growth ===== */
console.log('\ntick — food eating and growth');

test('snake grows when eating food', () => {
  const state = createInitialState();
  // Place food directly in front of the snake head
  const head = state.snake[0];
  const testState = { ...state, food: { x: head.x + 1, y: head.y } };
  const next = tick(testState);
  assertEqual(next.snake.length, state.snake.length + 1);
});

test('score increments when eating food', () => {
  const state = createInitialState();
  const head = state.snake[0];
  const testState = { ...state, food: { x: head.x + 1, y: head.y } };
  const next = tick(testState);
  assertEqual(next.score, 1);
});

test('new food is spawned after eating', () => {
  const state = createInitialState();
  const head = state.snake[0];
  const testState = { ...state, food: { x: head.x + 1, y: head.y } };
  const next = tick(testState);
  assert(next.food !== null, 'food should be spawned');
  // New food should not be at the old food position (most of the time)
  // This is probabilistic but the grid is large enough
});

test('speed increases (interval decreases) after eating food', () => {
  const state = createInitialState();
  const head = state.snake[0];
  const testState = { ...state, food: { x: head.x + 1, y: head.y } };
  const next = tick(testState);
  assert(next.speed < state.speed, 'speed should decrease (faster game)');
});


/* ===== tick — wall collision ===== */
console.log('\ntick — wall collision');

test('game over when hitting right wall', () => {
  const state = createInitialState();
  const testState = {
    ...state,
    snake: [
      { x: GRID_SIZE - 1, y: 5 },
      { x: GRID_SIZE - 2, y: 5 },
      { x: GRID_SIZE - 3, y: 5 },
    ],
    direction: 'right',
    nextDirection: 'right',
    food: { x: 0, y: 0 },
  };
  const next = tick(testState);
  assertEqual(next.gameOver, true);
});

test('game over when hitting top wall', () => {
  const state = createInitialState();
  const testState = {
    ...state,
    snake: [
      { x: 5, y: 0 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
    ],
    direction: 'up',
    nextDirection: 'up',
    food: { x: 0, y: 19 },
  };
  const next = tick(testState);
  assertEqual(next.gameOver, true);
});

test('game over when hitting left wall', () => {
  const state = createInitialState();
  const testState = {
    ...state,
    snake: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ],
    direction: 'left',
    nextDirection: 'left',
    food: { x: 19, y: 19 },
  };
  const next = tick(testState);
  assertEqual(next.gameOver, true);
});

test('game over when hitting bottom wall', () => {
  const state = createInitialState();
  const testState = {
    ...state,
    snake: [
      { x: 5, y: GRID_SIZE - 1 },
      { x: 5, y: GRID_SIZE - 2 },
      { x: 5, y: GRID_SIZE - 3 },
    ],
    direction: 'down',
    nextDirection: 'down',
    food: { x: 0, y: 0 },
  };
  const next = tick(testState);
  assertEqual(next.gameOver, true);
});


/* ===== tick — self collision ===== */
console.log('\ntick — self collision');

test('game over when snake hits itself', () => {
  const state = createInitialState();
  // Set up snake heading into its own body (a loop shape).
  // The target collision segment {5,5} must NOT be the tail,
  // because the tail moves away on a non-eating tick.
  const testState = {
    ...state,
    snake: [
      { x: 5, y: 4 },  // head — moving down, next head will be {5,5}
      { x: 5, y: 3 },
      { x: 6, y: 3 },
      { x: 6, y: 4 },
      { x: 6, y: 5 },
      { x: 5, y: 5 },  // body segment below — head will collide here
      { x: 4, y: 5 },  // actual tail — gets removed, not {5,5}
    ],
    direction: 'down',
    nextDirection: 'down',
    food: { x: 0, y: 0 },
  };
  const next = tick(testState);
  assertEqual(next.gameOver, true);
});


/* ===== tick — game over state ===== */
console.log('\ntick — game over state');

test('tick does nothing when game is already over', () => {
  const state = createInitialState();
  const overState = { ...state, gameOver: true, score: 42 };
  const next = tick(overState);
  assertEqual(next.gameOver, true);
  assertEqual(next.score, 42);
  assertEqual(next.snake.length, state.snake.length);
});


/* ===== spawnFood ===== */
console.log('\nspawnFood');

test('food spawns within grid bounds', () => {
  const snake = [{ x: 10, y: 10 }];
  for (let i = 0; i < 50; i++) {
    const food = spawnFood(snake);
    assert(food.x >= 0 && food.x < GRID_SIZE, `food.x=${food.x} out of bounds`);
    assert(food.y >= 0 && food.y < GRID_SIZE, `food.y=${food.y} out of bounds`);
  }
});

test('food never spawns on a snake segment', () => {
  const snake = [];
  // Fill most of the grid with snake
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE - 1; y++) {
      snake.push({ x, y });
    }
  }
  // Only the last row is free
  for (let i = 0; i < 100; i++) {
    const food = spawnFood(snake);
    assert(food !== null, 'food should not be null');
    assertEqual(food.y, GRID_SIZE - 1, 'food should be in the last row');
  }
});

test('returns null when board is completely full', () => {
  const snake = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      snake.push({ x, y });
    }
  }
  const food = spawnFood(snake);
  assertEqual(food, null);
});


/* ===== Score tracking across multiple ticks ===== */
console.log('\nscore tracking across multiple ticks');

test('score accumulates over multiple food eaten', () => {
  let state = createInitialState();
  // Simulate eating 3 pieces of food
  for (let i = 0; i < 3; i++) {
    const head = state.snake[0];
    const dir = DIRECTIONS[state.direction];
    state = {
      ...state,
      food: { x: head.x + dir.x, y: head.y + dir.y },
    };
    state = tick(state);
  }
  assertEqual(state.score, 3);
  assertEqual(state.snake.length, 6); // 3 initial + 3 grown
});


/* ===== Summary ===== */
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

if (failed > 0) {
  process.exit(1);
}
