/**
 * Hangman Game Logic Tests
 *
 * Runnable with Node.js:
 *   node static/js/tests/hangman.test.js
 *
 * Tests focus on pure game logic (no DOM interaction).
 */

/* eslint-disable no-console */

// ── Load the module ──
const { HangmanLogic } = require('../hangman.js');
const {
    MAX_WRONG_GUESSES,
    WORDS,
    pickWord,
    createGameState,
    isWordComplete,
    makeGuess,
    getWordDisplay,
} = HangmanLogic;

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

const describe = (suiteName, fn) => {
    console.log(`\n${suiteName}`);
    fn();
};

// ────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────

describe('constants', () => {
    assert(MAX_WRONG_GUESSES === 6, 'MAX_WRONG_GUESSES is 6');
    assert(Array.isArray(WORDS) && WORDS.length > 0, 'WORDS list is non-empty');
    assert(WORDS.every(w => /^[a-z]+$/.test(w)), 'all words contain only lowercase letters');
});

describe('pickWord', () => {
    const word = pickWord();
    assert(typeof word === 'string', 'returns a string');
    assert(/^[a-z]+$/.test(word), 'returned word is lowercase alphabetic');
    assert(WORDS.includes(word), 'returned word is from the word list');
});

describe('createGameState', () => {
    const state = createGameState('python');
    assert(state.word === 'python', 'stores the word');
    assert(state.guessed instanceof Set, 'guessed is a Set');
    assert(state.guessed.size === 0, 'no letters guessed initially');
    assert(state.wrongCount === 0, 'wrong count starts at 0');
    assert(state.status === 'playing', 'status starts as playing');

    const upperState = createGameState('HELLO');
    assert(upperState.word === 'hello', 'normalises word to lowercase');
});

describe('isWordComplete', () => {
    assert(
        isWordComplete('cat', new Set(['c', 'a', 't'])),
        'returns true when all letters guessed',
    );
    assert(
        !isWordComplete('cat', new Set(['c', 'a'])),
        'returns false when a letter is still missing',
    );
    assert(
        !isWordComplete('cat', new Set()),
        'returns false for empty guess set',
    );
    assert(
        isWordComplete('aaa', new Set(['a'])),
        'returns true for repeated letter once guessed',
    );
});

describe('makeGuess — correct guess', () => {
    const state = createGameState('cat');
    const next = makeGuess(state, 'c');
    assert(next !== null, 'returns a new state for a valid correct guess');
    assert(next.guessed.has('c'), 'adds correct letter to guessed set');
    assert(next.wrongCount === 0, 'does not increment wrongCount for a correct guess');
    assert(next.status === 'playing', 'status remains playing');
    assert(!state.guessed.has('c'), 'original state is not mutated');
});

describe('makeGuess — wrong guess', () => {
    const state = createGameState('cat');
    const next = makeGuess(state, 'z');
    assert(next !== null, 'returns a new state for a valid wrong guess');
    assert(next.guessed.has('z'), 'adds wrong letter to guessed set');
    assert(next.wrongCount === 1, 'increments wrongCount for a wrong guess');
    assert(next.status === 'playing', 'status remains playing while under the limit');
});

describe('makeGuess — duplicate guess', () => {
    let state = createGameState('cat');
    state = makeGuess(state, 'c');
    const result = makeGuess(state, 'c');
    assert(result === null, 'returns null when letter already guessed');
});

describe('makeGuess — invalid input', () => {
    const state = createGameState('cat');
    assert(makeGuess(state, '1') === null, 'returns null for digit input');
    assert(makeGuess(state, '') === null, 'returns null for empty string');
    assert(makeGuess(state, 'ab') === null, 'returns null for multi-character string');
    assert(makeGuess(state, 'C') === null, 'returns null for uppercase letter');
});

describe('makeGuess — game-over state blocks further guesses', () => {
    let state = createGameState('cat');
    // Force a loss
    for (const letter of ['z', 'x', 'q', 'w', 'v', 'b']) {
        state = makeGuess(state, letter);
    }
    assert(state.status === 'lost', 'status is lost after 6 wrong guesses');
    const after = makeGuess(state, 'a');
    assert(after === null, 'returns null when game is already over (lost)');
});

describe('makeGuess — win condition', () => {
    let state = createGameState('hi');
    state = makeGuess(state, 'h');
    assert(state.status === 'playing', 'still playing after guessing first letter');
    state = makeGuess(state, 'i');
    assert(state.status === 'won', 'status becomes won when all letters are guessed');
});

describe('makeGuess — loss condition', () => {
    let state = createGameState('a');
    const wrongLetters = ['z', 'x', 'q', 'w', 'v', 'b'];
    for (let i = 0; i < wrongLetters.length - 1; i++) {
        state = makeGuess(state, wrongLetters[i]);
        assert(state.status === 'playing', `still playing after ${i + 1} wrong guess(es)`);
    }
    state = makeGuess(state, wrongLetters[wrongLetters.length - 1]);
    assert(state.status === 'lost', `status becomes lost after ${MAX_WRONG_GUESSES} wrong guesses`);
    assert(state.wrongCount === MAX_WRONG_GUESSES, 'wrongCount equals MAX_WRONG_GUESSES');
});

describe('getWordDisplay', () => {
    const display = getWordDisplay('cat', new Set(['c', 't']));
    assert(display[0] === 'c', 'shows guessed letter at correct position');
    assert(display[1] === null, 'shows null for unguessed letter');
    assert(display[2] === 't', 'shows guessed letter at end');

    const fullDisplay = getWordDisplay('hi', new Set(['h', 'i']));
    assert(fullDisplay.every(l => l !== null), 'all letters shown when all are guessed');

    const emptyDisplay = getWordDisplay('hi', new Set());
    assert(emptyDisplay.every(l => l === null), 'all nulls when nothing guessed');
});

describe('Full game simulation — win', () => {
    let state = createGameState('ab');
    state = makeGuess(state, 'z'); // wrong
    state = makeGuess(state, 'a'); // correct
    state = makeGuess(state, 'b'); // correct — win
    assert(state.status === 'won', 'player wins after guessing all letters');
    assert(state.wrongCount === 1, 'records the one wrong guess');
});

describe('Full game simulation — loss', () => {
    let state = createGameState('a');
    const wrong = ['z', 'x', 'q', 'w', 'v', 'b'];
    wrong.forEach(l => { state = makeGuess(state, l); });
    assert(state.status === 'lost', 'player loses after 6 wrong guesses without completing the word');
    assert(!state.guessed.has('a'), 'correct letter was never guessed');
});

// ── Summary ──
console.log('\n────────────────────────────');
console.log(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('────────────────────────────\n');

if (failedTests > 0) {
    process.exit(1);
}
