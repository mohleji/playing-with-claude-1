/**
 * Hangman Game — Game Arcade
 *
 * Classic word-guessing game. Game logic is separated from rendering
 * for testability.
 */

/* ===== Game Logic (pure functions — no DOM access) ===== */

const MAX_WRONG_GUESSES = 6;

const WORDS = [
    'javascript', 'python', 'hangman', 'programming', 'keyboard',
    'browser', 'canvas', 'function', 'variable', 'framework',
    'developer', 'algorithm', 'database', 'interface', 'component',
    'terminal', 'recursion', 'iterator', 'prototype', 'callback',
    'adventure', 'elephant', 'universe', 'mountain', 'calendar',
    'platinum', 'creative', 'umbrella', 'paradise', 'champion',
];

/**
 * Select a random word from the word list.
 * @returns {string} Lowercase word
 */
function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

/**
 * Create a fresh game state for the given word.
 * @param {string} word
 * @returns {object} Initial game state
 */
function createGameState(word) {
    return {
        word: word.toLowerCase(),
        guessed: new Set(),
        wrongCount: 0,
        status: 'playing', // 'playing' | 'won' | 'lost'
    };
}

/**
 * Return true when all letters in the word have been guessed.
 * @param {string} word
 * @param {Set<string>} guessed
 * @returns {boolean}
 */
function isWordComplete(word, guessed) {
    return [...word].every(letter => guessed.has(letter));
}

/**
 * Process a letter guess against the current state.
 * Returns a new state object (does not mutate the input).
 * Returns null if the guess is invalid (already guessed or not a letter).
 *
 * @param {object} state
 * @param {string} letter  Single lowercase letter
 * @returns {object|null}
 */
function makeGuess(state, letter) {
    if (state.status !== 'playing') return null;
    if (!/^[a-z]$/.test(letter)) return null;
    if (state.guessed.has(letter)) return null;

    const newGuessed = new Set(state.guessed);
    newGuessed.add(letter);

    const isCorrect = state.word.includes(letter);
    const newWrongCount = isCorrect ? state.wrongCount : state.wrongCount + 1;

    let newStatus = 'playing';
    if (isWordComplete(state.word, newGuessed)) {
        newStatus = 'won';
    } else if (newWrongCount >= MAX_WRONG_GUESSES) {
        newStatus = 'lost';
    }

    return {
        word: state.word,
        guessed: newGuessed,
        wrongCount: newWrongCount,
        status: newStatus,
    };
}

/**
 * Build the display array for the word — revealed letters shown, others as null.
 * @param {string} word
 * @param {Set<string>} guessed
 * @returns {Array<string|null>}
 */
function getWordDisplay(word, guessed) {
    return [...word].map(letter => (guessed.has(letter) ? letter : null));
}

// Expose pure logic for testing in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HangmanLogic: {
            MAX_WRONG_GUESSES,
            WORDS,
            pickWord,
            createGameState,
            isWordComplete,
            makeGuess,
            getWordDisplay,
        },
    };
}

/* ===== Rendering ===== */

/** SVG path commands for each stage of the hangman (0 = gallows only, 6 = full figure) */
const HANGMAN_PARTS = [
    // Stage 1: head
    { tag: 'circle', attrs: { cx: '140', cy: '60', r: '20' } },
    // Stage 2: body
    { tag: 'line', attrs: { x1: '140', y1: '80', x2: '140', y2: '140' } },
    // Stage 3: left arm
    { tag: 'line', attrs: { x1: '140', y1: '95', x2: '110', y2: '120' } },
    // Stage 4: right arm
    { tag: 'line', attrs: { x1: '140', y1: '95', x2: '170', y2: '120' } },
    // Stage 5: left leg
    { tag: 'line', attrs: { x1: '140', y1: '140', x2: '110', y2: '175' } },
    // Stage 6: right leg
    { tag: 'line', attrs: { x1: '140', y1: '140', x2: '170', y2: '175' } },
];

/** DOM element references */
let svgEl, wordDisplayEl, guessedEl, messageEl, restartBtn, keyboardEl;

/** Current game state */
let state;

/**
 * Update the SVG gallows to show the correct number of body parts.
 */
function renderGallows() {
    // Remove all previously drawn body parts (keep the gallows structure)
    svgEl.querySelectorAll('.hangman-part').forEach(el => el.remove());

    for (let i = 0; i < state.wrongCount; i++) {
        const part = HANGMAN_PARTS[i];
        const el = document.createElementNS('http://www.w3.org/2000/svg', part.tag);
        for (const [attr, val] of Object.entries(part.attrs)) {
            el.setAttribute(attr, val);
        }
        el.classList.add('hangman-part');
        svgEl.appendChild(el);
    }
}

/**
 * Update the word display row (blanks and revealed letters).
 */
function renderWordDisplay() {
    const display = getWordDisplay(state.word, state.guessed);
    wordDisplayEl.innerHTML = display.map(letter => `
        <span class="hangman__letter ${letter ? 'hangman__letter--revealed' : ''}">
            ${letter ?? ''}
        </span>
    `).join('');
}

/**
 * Update the on-screen keyboard — mark letters as correct, wrong, or unused.
 */
function renderKeyboard() {
    keyboardEl.querySelectorAll('.hangman__key').forEach(btn => {
        const letter = btn.dataset.letter;
        btn.disabled = state.guessed.has(letter) || state.status !== 'playing';
        if (state.guessed.has(letter)) {
            const isCorrect = state.word.includes(letter);
            btn.classList.toggle('hangman__key--correct', isCorrect);
            btn.classList.toggle('hangman__key--wrong', !isCorrect);
        }
    });
}

/**
 * Show/hide the end-of-game message.
 */
function renderMessage() {
    if (state.status === 'won') {
        messageEl.textContent = 'You won!';
        messageEl.className = 'hangman__message hangman__message--win';
    } else if (state.status === 'lost') {
        messageEl.textContent = `Game over — the word was "${state.word}"`;
        messageEl.className = 'hangman__message hangman__message--lose';
    } else {
        messageEl.textContent = '';
        messageEl.className = 'hangman__message';
    }
}

/**
 * Render the set of already-guessed letters (summary line).
 */
function renderGuessedLetters() {
    const wrong = [...state.guessed].filter(l => !state.word.includes(l));
    guessedEl.textContent = wrong.length > 0 ? `Wrong guesses: ${wrong.join(', ')}` : '';
}

/**
 * Full render pass — call after every state change.
 */
function render() {
    renderGallows();
    renderWordDisplay();
    renderKeyboard();
    renderGuessedLetters();
    renderMessage();
}

/**
 * Handle a letter guess from the keyboard UI or physical keyboard.
 * @param {string} letter
 */
function handleGuess(letter) {
    const newState = makeGuess(state, letter);
    if (newState === null) return;
    state = newState;
    render();
}

/**
 * Start (or restart) a new game.
 */
function startGame() {
    state = createGameState(pickWord());
    render();
}

/**
 * Handle physical keyboard input.
 * @param {KeyboardEvent} e
 */
function onKeyDown(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const letter = e.key.toLowerCase();
    handleGuess(letter);
}

/**
 * Initialise the game when the DOM is ready.
 */
function init() {
    svgEl = document.getElementById('hangman-svg');
    wordDisplayEl = document.getElementById('hangman-word');
    guessedEl = document.getElementById('hangman-guessed');
    messageEl = document.getElementById('hangman-message');
    restartBtn = document.getElementById('restart');
    keyboardEl = document.getElementById('hangman-keyboard');

    // Build on-screen keyboard
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    rows.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'hangman__keyboard-row';
        [...row].forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'hangman__key';
            btn.textContent = letter;
            btn.dataset.letter = letter;
            btn.addEventListener('click', () => handleGuess(letter));
            rowEl.appendChild(btn);
        });
        keyboardEl.appendChild(rowEl);
    });

    restartBtn.addEventListener('click', startGame);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('unload', () => {
        document.removeEventListener('keydown', onKeyDown);
    });

    startGame();
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}
