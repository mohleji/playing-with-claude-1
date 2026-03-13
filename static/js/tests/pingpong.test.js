/**
 * Ping Pong Game — Unit Tests
 *
 * Assertion-based tests for core game logic.
 * Run with Node.js: node static/js/tests/pingpong.test.js
 */

const {
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
} = require('../pingpong.js');

let passed = 0;
let failed = 0;

/**
 * Simple test runner — logs pass/fail and tracks counts.
 * @param {string} name
 * @param {Function} fn
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
 * Assert a condition is truthy.
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


/* ===== clamp ===== */
console.log('\nclamp');

test('returns value when within range', () => {
  assertEqual(clamp(5, 0, 10), 5);
});

test('returns min when value is below range', () => {
  assertEqual(clamp(-5, 0, 10), 0);
});

test('returns max when value is above range', () => {
  assertEqual(clamp(15, 0, 10), 10);
});

test('returns min when value equals min', () => {
  assertEqual(clamp(0, 0, 10), 0);
});

test('returns max when value equals max', () => {
  assertEqual(clamp(10, 0, 10), 10);
});


/* ===== createInitialState ===== */
console.log('\ncreateInitialState');

test('initial player score is 0', () => {
  const state = createInitialState();
  assertEqual(state.playerScore, 0);
});

test('initial cpu score is 0', () => {
  const state = createInitialState();
  assertEqual(state.cpuScore, 0);
});

test('ball starts near center of canvas', () => {
  const state = createInitialState();
  assertEqual(state.ball.x, CANVAS_WIDTH / 2);
  assertEqual(state.ball.y, CANVAS_HEIGHT / 2);
});

test('player paddle starts on the right side', () => {
  const state = createInitialState();
  assert(
    state.playerPaddle.x > CANVAS_WIDTH / 2,
    'player paddle should be on the right half'
  );
});

test('cpu paddle starts on the left side', () => {
  const state = createInitialState();
  assert(
    state.cpuPaddle.x < CANVAS_WIDTH / 2,
    'cpu paddle should be on the left half'
  );
});

test('game is not paused initially', () => {
  const state = createInitialState();
  assertEqual(state.paused, false);
});

test('ball has non-zero velocity', () => {
  const state = createInitialState();
  assert(state.ball.vx !== 0, 'ball vx should not be 0');
  assert(state.ball.vy !== 0, 'ball vy should not be 0');
});


/* ===== moveCpuPaddle ===== */
console.log('\nmoveCpuPaddle');

test('cpu paddle moves down when ball is below paddle center', () => {
  const cpuPaddle = { x: PADDLE_MARGIN, y: 100 };
  const ball = { x: 50, y: 300 }; // well below paddle center
  const result = moveCpuPaddle(cpuPaddle, ball);
  assert(result.y > cpuPaddle.y, 'paddle should move down');
});

test('cpu paddle moves up when ball is above paddle center', () => {
  const cpuPaddle = { x: PADDLE_MARGIN, y: 200 };
  const ball = { x: 50, y: 10 }; // well above paddle center
  const result = moveCpuPaddle(cpuPaddle, ball);
  assert(result.y < cpuPaddle.y, 'paddle should move up');
});

test('cpu paddle does not move when ball is at paddle center', () => {
  const cpuPaddle = { x: PADDLE_MARGIN, y: 100 };
  const paddleCenter = cpuPaddle.y + PADDLE_HEIGHT / 2;
  const ball = { x: 50, y: paddleCenter }; // exactly at center
  const result = moveCpuPaddle(cpuPaddle, ball);
  assertEqual(result.y, cpuPaddle.y);
});

test('cpu paddle stays within canvas bounds (top)', () => {
  const cpuPaddle = { x: PADDLE_MARGIN, y: 2 };
  const ball = { x: 50, y: 0 }; // ball at top
  const result = moveCpuPaddle(cpuPaddle, ball);
  assert(result.y >= 0, 'paddle y should not go negative');
});

test('cpu paddle stays within canvas bounds (bottom)', () => {
  const cpuPaddle = { x: PADDLE_MARGIN, y: CANVAS_HEIGHT - PADDLE_HEIGHT - 2 };
  const ball = { x: 50, y: CANVAS_HEIGHT }; // ball at bottom
  const result = moveCpuPaddle(cpuPaddle, ball);
  assert(result.y <= CANVAS_HEIGHT - PADDLE_HEIGHT, 'paddle y should not exceed bottom');
});


/* ===== movePlayerPaddle ===== */
console.log('\nmovePlayerPaddle');

test('player paddle centers on target y', () => {
  const paddle = { x: 560, y: 100 };
  const result = movePlayerPaddle(paddle, 200);
  assertEqual(result.y, 200 - PADDLE_HEIGHT / 2);
});

test('player paddle clamps to top of canvas', () => {
  const paddle = { x: 560, y: 100 };
  const result = movePlayerPaddle(paddle, -50);
  assertEqual(result.y, 0);
});

test('player paddle clamps to bottom of canvas', () => {
  const paddle = { x: 560, y: 100 };
  const result = movePlayerPaddle(paddle, CANVAS_HEIGHT + 100);
  assertEqual(result.y, CANVAS_HEIGHT - PADDLE_HEIGHT);
});


/* ===== ballHitsPaddle ===== */
console.log('\nballHitsPaddle');

test('detects hit when ball overlaps paddle', () => {
  const paddle = { x: 50, y: 100 };
  const ball = { x: 52, y: 110 }; // inside paddle area
  assertEqual(ballHitsPaddle(ball, paddle), true);
});

test('no hit when ball is to the left of paddle', () => {
  const paddle = { x: 50, y: 100 };
  const ball = { x: 30, y: 110 };
  assertEqual(ballHitsPaddle(ball, paddle), false);
});

test('no hit when ball is to the right of paddle', () => {
  const paddle = { x: 50, y: 100 };
  const ball = { x: 70, y: 110 };
  assertEqual(ballHitsPaddle(ball, paddle), false);
});

test('no hit when ball is above paddle', () => {
  const paddle = { x: 50, y: 100 };
  const ball = { x: 52, y: 80 };
  assertEqual(ballHitsPaddle(ball, paddle), false);
});

test('no hit when ball is below paddle', () => {
  const paddle = { x: 50, y: 100 };
  const ball = { x: 52, y: 100 + PADDLE_HEIGHT + 5 };
  assertEqual(ballHitsPaddle(ball, paddle), false);
});


/* ===== applyScore ===== */
console.log('\napplyScore');

test('player score increments when player scores', () => {
  const state = createInitialState();
  const result = applyScore(state, 'player');
  assertEqual(result.playerScore, 1);
  assertEqual(result.cpuScore, 0);
});

test('cpu score increments when cpu scores', () => {
  const state = createInitialState();
  const result = applyScore(state, 'cpu');
  assertEqual(result.cpuScore, 1);
  assertEqual(result.playerScore, 0);
});

test('ball resets to center after scoring', () => {
  const state = createInitialState();
  const result = applyScore(state, 'player');
  assertEqual(result.ball.x, CANVAS_WIDTH / 2);
  assertEqual(result.ball.y, CANVAS_HEIGHT / 2);
});

test('scores accumulate correctly across multiple points', () => {
  let state = createInitialState();
  state = applyScore(state, 'player');
  state = applyScore(state, 'player');
  state = applyScore(state, 'cpu');
  assertEqual(state.playerScore, 2);
  assertEqual(state.cpuScore, 1);
});


/* ===== tick ===== */
console.log('\ntick');

test('paused state is not updated on tick', () => {
  const state = { ...createInitialState(), paused: true };
  const result = tick(state, CANVAS_HEIGHT / 2);
  assertEqual(result.paused, true);
  assertEqual(result.ball.x, state.ball.x);
  assertEqual(result.ball.y, state.ball.y);
});

test('ball moves horizontally each tick', () => {
  const state = createInitialState();
  // Force ball to move right at known speed
  const testState = {
    ...state,
    ball: { x: 300, y: 200, vx: BALL_SPEED, vy: 0 },
  };
  const result = tick(testState, 200);
  assert(result.ball.x !== testState.ball.x, 'ball should move horizontally');
});

test('ball bounces off the top wall', () => {
  const state = createInitialState();
  const testState = {
    ...state,
    ball: { x: 300, y: 2, vx: BALL_SPEED, vy: -BALL_SPEED },
  };
  const result = tick(testState, 200);
  assert(result.ball.vy > 0, 'vy should be positive after bouncing off top');
});

test('ball bounces off the bottom wall', () => {
  const state = createInitialState();
  const testState = {
    ...state,
    ball: { x: 300, y: CANVAS_HEIGHT - BALL_SIZE - 2, vx: BALL_SPEED, vy: BALL_SPEED },
  };
  const result = tick(testState, 200);
  assert(result.ball.vy < 0, 'vy should be negative after bouncing off bottom');
});

test('player scores when ball exits left side (CPU missed)', () => {
  // Left side is CPU's side; if ball passes it, player scores
  const state = createInitialState();
  const testState = {
    ...state,
    ball: { x: -BALL_SIZE - 1, y: 200, vx: -BALL_SPEED, vy: 0 },
    cpuPaddle: { ...state.cpuPaddle, y: CANVAS_HEIGHT }, // paddle out of the way
  };
  const result = tick(testState, 200);
  assertEqual(result.playerScore, 1);
  assertEqual(result.cpuScore, 0);
});

test('cpu scores when ball exits right side (player missed)', () => {
  // Right side is player's side; if ball passes it, CPU scores
  const state = createInitialState();
  const testState = {
    ...state,
    ball: { x: CANVAS_WIDTH + 1, y: 200, vx: BALL_SPEED, vy: 0 },
    playerPaddle: { ...state.playerPaddle, y: CANVAS_HEIGHT }, // paddle out of the way
  };
  const result = tick(testState, 200);
  assertEqual(result.cpuScore, 1);
  assertEqual(result.playerScore, 0);
});


/* ===== Summary ===== */
console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}\n`);

if (failed > 0) {
  process.exit(1);
}
