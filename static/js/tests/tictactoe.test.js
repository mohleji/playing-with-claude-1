/**
 * Tic-Tac-Toe Game Logic Tests
 *
 * Runnable with Node.js:
 *   node static/js/tests/tictactoe.test.js
 *
 * Tests focus on pure game logic (no DOM interaction).
 */

/* eslint-disable no-console */

// ── Load the module ──
const { TicTacToeLogic } = require('../tictactoe.js');
const {
    PLAYERS,
    EMPTY,
    BOARD_SIZE,
    createBoard,
    getWinningPattern,
    checkResult,
    nextPlayer,
    makeMove,
} = TicTacToeLogic;

// ── Minimal test runner ──
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  PASS: ${message}`);
    } else {
        failedTests++;
        console.error(`  FAIL: ${message}`);
    }
};

const assertDeepEqual = (actual, expected, message) => {
    const result = JSON.stringify(actual) === JSON.stringify(expected);
    if (!result) {
        console.error(`    Expected: ${JSON.stringify(expected)}`);
        console.error(`    Actual:   ${JSON.stringify(actual)}`);
    }
    assert(result, message);
};

const describe = (suiteName, fn) => {
    console.log(`\n${suiteName}`);
    fn();
};

// ────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────

describe('createBoard', () => {
    const board = createBoard();

    assert(board.length === BOARD_SIZE, 'creates a board with 9 cells');
    assert(board.every(cell => cell === EMPTY), 'all cells are initially empty');
});

describe('nextPlayer', () => {
    assert(nextPlayer(PLAYERS.X) === PLAYERS.O, 'switches from X to O');
    assert(nextPlayer(PLAYERS.O) === PLAYERS.X, 'switches from O to X');
});

describe('makeMove', () => {
    const board = createBoard();

    const afterMove = makeMove(board, 0, PLAYERS.X);
    assert(afterMove !== null, 'returns a new board for a valid move');
    assert(afterMove[0] === PLAYERS.X, 'places the mark at the correct index');
    assert(board[0] === EMPTY, 'does not mutate the original board');

    const invalidMove = makeMove(afterMove, 0, PLAYERS.O);
    assert(invalidMove === null, 'returns null when cell is already occupied');

    const outOfBounds = makeMove(board, -1, PLAYERS.X);
    assert(outOfBounds === null, 'returns null for negative index');

    const outOfBoundsHigh = makeMove(board, 9, PLAYERS.X);
    assert(outOfBoundsHigh === null, 'returns null for index >= BOARD_SIZE');
});

describe('checkResult — win detection for rows', () => {
    // Top row win for X
    const boardTopRow = [
        PLAYERS.X, PLAYERS.X, PLAYERS.X,
        PLAYERS.O, PLAYERS.O, EMPTY,
        EMPTY, EMPTY, EMPTY,
    ];
    const resultTop = checkResult(boardTopRow);
    assert(resultTop.winner === PLAYERS.X, 'detects X winning on top row');
    assertDeepEqual(resultTop.winningPattern, [0, 1, 2], 'returns correct winning pattern for top row');

    // Middle row win for O
    const boardMidRow = [
        PLAYERS.X, EMPTY, PLAYERS.X,
        PLAYERS.O, PLAYERS.O, PLAYERS.O,
        EMPTY, PLAYERS.X, EMPTY,
    ];
    const resultMid = checkResult(boardMidRow);
    assert(resultMid.winner === PLAYERS.O, 'detects O winning on middle row');
    assertDeepEqual(resultMid.winningPattern, [3, 4, 5], 'returns correct winning pattern for middle row');

    // Bottom row win for X
    const boardBotRow = [
        PLAYERS.O, EMPTY, PLAYERS.O,
        EMPTY, PLAYERS.O, EMPTY,
        PLAYERS.X, PLAYERS.X, PLAYERS.X,
    ];
    const resultBot = checkResult(boardBotRow);
    assert(resultBot.winner === PLAYERS.X, 'detects X winning on bottom row');
    assertDeepEqual(resultBot.winningPattern, [6, 7, 8], 'returns correct winning pattern for bottom row');
});

describe('checkResult — win detection for columns', () => {
    // Left column win
    const boardLeftCol = [
        PLAYERS.X, PLAYERS.O, EMPTY,
        PLAYERS.X, PLAYERS.O, EMPTY,
        PLAYERS.X, EMPTY, EMPTY,
    ];
    const resultLeft = checkResult(boardLeftCol);
    assert(resultLeft.winner === PLAYERS.X, 'detects X winning on left column');
    assertDeepEqual(resultLeft.winningPattern, [0, 3, 6], 'returns correct winning pattern for left column');

    // Middle column win
    const boardMidCol = [
        PLAYERS.X, PLAYERS.O, EMPTY,
        EMPTY, PLAYERS.O, PLAYERS.X,
        EMPTY, PLAYERS.O, EMPTY,
    ];
    const resultMid = checkResult(boardMidCol);
    assert(resultMid.winner === PLAYERS.O, 'detects O winning on middle column');
    assertDeepEqual(resultMid.winningPattern, [1, 4, 7], 'returns correct winning pattern for middle column');

    // Right column win
    const boardRightCol = [
        EMPTY, PLAYERS.O, PLAYERS.X,
        EMPTY, PLAYERS.O, PLAYERS.X,
        EMPTY, EMPTY, PLAYERS.X,
    ];
    const resultRight = checkResult(boardRightCol);
    assert(resultRight.winner === PLAYERS.X, 'detects X winning on right column');
    assertDeepEqual(resultRight.winningPattern, [2, 5, 8], 'returns correct winning pattern for right column');
});

describe('checkResult — win detection for diagonals', () => {
    // Main diagonal (top-left to bottom-right)
    const boardMainDiag = [
        PLAYERS.X, PLAYERS.O, EMPTY,
        EMPTY, PLAYERS.X, PLAYERS.O,
        EMPTY, EMPTY, PLAYERS.X,
    ];
    const resultMain = checkResult(boardMainDiag);
    assert(resultMain.winner === PLAYERS.X, 'detects X winning on main diagonal');
    assertDeepEqual(resultMain.winningPattern, [0, 4, 8], 'returns correct winning pattern for main diagonal');

    // Anti-diagonal (top-right to bottom-left)
    const boardAntiDiag = [
        EMPTY, PLAYERS.X, PLAYERS.O,
        PLAYERS.X, PLAYERS.O, EMPTY,
        PLAYERS.O, EMPTY, PLAYERS.X,
    ];
    const resultAnti = checkResult(boardAntiDiag);
    assert(resultAnti.winner === PLAYERS.O, 'detects O winning on anti-diagonal');
    assertDeepEqual(resultAnti.winningPattern, [2, 4, 6], 'returns correct winning pattern for anti-diagonal');
});

describe('checkResult — draw detection', () => {
    // Classic draw board
    const drawBoard = [
        PLAYERS.X, PLAYERS.O, PLAYERS.X,
        PLAYERS.X, PLAYERS.O, PLAYERS.O,
        PLAYERS.O, PLAYERS.X, PLAYERS.X,
    ];
    const result = checkResult(drawBoard);
    assert(result.winner === null, 'draw has no winner');
    assert(result.isDraw === true, 'detects a drawn game when board is full with no winner');
    assert(result.winningPattern === null, 'draw has no winning pattern');
});

describe('checkResult — in-progress game', () => {
    const board = [
        PLAYERS.X, EMPTY, EMPTY,
        EMPTY, PLAYERS.O, EMPTY,
        EMPTY, EMPTY, EMPTY,
    ];
    const result = checkResult(board);
    assert(result.winner === null, 'in-progress game has no winner');
    assert(result.isDraw === false, 'in-progress game is not a draw');
    assert(result.winningPattern === null, 'in-progress game has no winning pattern');
});

describe('checkResult — empty board', () => {
    const board = createBoard();
    const result = checkResult(board);
    assert(result.winner === null, 'empty board has no winner');
    assert(result.isDraw === false, 'empty board is not a draw');
});

describe('Turn switching — full game simulation', () => {
    // Simulate a game: X wins with top row
    let board = createBoard();
    let player = PLAYERS.X;

    // X plays 0
    board = makeMove(board, 0, player);
    player = nextPlayer(player);
    assert(player === PLAYERS.O, 'after X moves, it is O turn');

    // O plays 3
    board = makeMove(board, 3, player);
    player = nextPlayer(player);
    assert(player === PLAYERS.X, 'after O moves, it is X turn');

    // X plays 1
    board = makeMove(board, 1, player);
    player = nextPlayer(player);

    // O plays 4
    board = makeMove(board, 4, player);
    player = nextPlayer(player);

    // X plays 2 — should win
    board = makeMove(board, 2, player);
    const result = checkResult(board);
    assert(result.winner === PLAYERS.X, 'X wins after completing top row in simulated game');
    assertDeepEqual(result.winningPattern, [0, 1, 2], 'winning pattern is the top row');
    assert(result.isDraw === false, 'winning game is not a draw');
});

describe('getWinningPattern', () => {
    const board = [
        PLAYERS.O, EMPTY, EMPTY,
        EMPTY, PLAYERS.O, EMPTY,
        EMPTY, EMPTY, PLAYERS.O,
    ];
    const pattern = getWinningPattern(board, PLAYERS.O);
    assertDeepEqual(pattern, [0, 4, 8], 'returns winning pattern for O on main diagonal');

    const noWin = getWinningPattern(board, PLAYERS.X);
    assert(noWin === null, 'returns null when player has not won');
});

// ── Summary ──
console.log('\n────────────────────────────');
console.log(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('────────────────────────────\n');

if (failedTests > 0) {
    process.exit(1);
}
