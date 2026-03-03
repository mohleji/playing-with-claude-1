/* ===== Tic-Tac-Toe Game ===== */

// ────────────────────────────────────────────
// Game Logic (pure functions, no DOM access)
// ────────────────────────────────────────────

const TicTacToeLogic = (() => {
    'use strict';

    const PLAYERS = { X: 'X', O: 'O' };
    const EMPTY = null;
    const BOARD_SIZE = 9;

    const WIN_PATTERNS = [
        [0, 1, 2], // top row
        [3, 4, 5], // middle row
        [6, 7, 8], // bottom row
        [0, 3, 6], // left column
        [1, 4, 7], // middle column
        [2, 5, 8], // right column
        [0, 4, 8], // diagonal top-left to bottom-right
        [2, 4, 6], // diagonal top-right to bottom-left
    ];

    /**
     * Create a fresh empty board.
     * @returns {Array<null>} Array of 9 nulls
     */
    const createBoard = () => Array(BOARD_SIZE).fill(EMPTY);

    /**
     * Check if a specific player has won.
     * @param {Array} board - The current board state
     * @param {string} player - 'X' or 'O'
     * @returns {number[]|null} The winning pattern indices, or null
     */
    const getWinningPattern = (board, player) => {
        for (const pattern of WIN_PATTERNS) {
            if (pattern.every(index => board[index] === player)) {
                return pattern;
            }
        }
        return null;
    };

    /**
     * Check the overall result of the board.
     * @param {Array} board - The current board state
     * @returns {{ winner: string|null, winningPattern: number[]|null, isDraw: boolean }}
     */
    const checkResult = (board) => {
        for (const player of [PLAYERS.X, PLAYERS.O]) {
            const pattern = getWinningPattern(board, player);
            if (pattern !== null) {
                return { winner: player, winningPattern: pattern, isDraw: false };
            }
        }

        const isDraw = board.every(cell => cell !== EMPTY);
        return { winner: null, winningPattern: null, isDraw };
    };

    /**
     * Determine the next player given the current one.
     * @param {string} currentPlayer - 'X' or 'O'
     * @returns {string} The other player
     */
    const nextPlayer = (currentPlayer) =>
        currentPlayer === PLAYERS.X ? PLAYERS.O : PLAYERS.X;

    /**
     * Attempt to place a mark on the board.
     * Returns a new board if the move is valid, or null if invalid.
     * @param {Array} board - The current board state
     * @param {number} index - Cell index (0-8)
     * @param {string} player - 'X' or 'O'
     * @returns {Array|null} New board state or null if move is invalid
     */
    const makeMove = (board, index, player) => {
        if (index < 0 || index >= BOARD_SIZE) {
            return null;
        }
        if (board[index] !== EMPTY) {
            return null;
        }
        const newBoard = [...board];
        newBoard[index] = player;
        return newBoard;
    };

    return {
        PLAYERS,
        EMPTY,
        BOARD_SIZE,
        WIN_PATTERNS,
        createBoard,
        getWinningPattern,
        checkResult,
        nextPlayer,
        makeMove,
    };
})();

// ────────────────────────────────────────────
// Rendering & UI (DOM interaction)
// Only runs in browser environment.
// ────────────────────────────────────────────

if (typeof document !== 'undefined') {

const TicTacToeUI = (() => {
    'use strict';

    const { PLAYERS, createBoard, checkResult, nextPlayer, makeMove } = TicTacToeLogic;

    // ── Game state ──
    let board = createBoard();
    let currentPlayer = PLAYERS.X;
    let gameOver = false;
    let winningPattern = null;

    // ── DOM references ──
    const gameContainer = document.getElementById('game-container');
    const statusEl = document.getElementById('status');
    const restartBtn = document.getElementById('restart');

    // ── Inject game-specific styles ──
    const injectStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .ttt-board {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 6px;
                width: min(360px, 90vw);
                height: min(360px, 90vw);
                background: var(--color-border);
                border-radius: var(--radius);
                overflow: hidden;
                padding: 6px;
            }

            .ttt-cell {
                background: var(--color-surface);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: min(3.5rem, 12vw);
                font-weight: 700;
                color: var(--color-text);
                transition: background 0.15s ease, transform 0.1s ease;
                user-select: none;
                -webkit-user-select: none;
                position: relative;
            }

            .ttt-cell:hover:not(.ttt-cell--filled):not(.ttt-cell--disabled) {
                background: var(--color-surface-hover);
                transform: scale(1.04);
            }

            .ttt-cell:active:not(.ttt-cell--filled):not(.ttt-cell--disabled) {
                transform: scale(0.96);
            }

            .ttt-cell--filled {
                cursor: default;
            }

            .ttt-cell--disabled {
                cursor: default;
            }

            .ttt-cell--x {
                color: var(--color-primary);
                text-shadow: 0 0 20px var(--color-primary-glow);
            }

            .ttt-cell--o {
                color: #4ecdc4;
                text-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
            }

            .ttt-cell--win {
                animation: ttt-pulse 0.6s ease-in-out infinite alternate;
            }

            .ttt-cell--placed {
                animation: ttt-pop 0.25s ease-out;
            }

            @keyframes ttt-pop {
                0% { transform: scale(0.3); opacity: 0.4; }
                60% { transform: scale(1.12); }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes ttt-pulse {
                0% { background: var(--color-surface); }
                100% { background: var(--color-surface-hover); }
            }

            .game-page__status--x {
                color: var(--color-primary);
            }

            .game-page__status--o {
                color: #4ecdc4;
            }

            .game-page__status--draw {
                color: var(--color-text-muted);
            }

            .game-page__status--win {
                font-weight: 700;
            }
        `;
        document.head.appendChild(style);
    };

    // ── Render the board to the DOM ──
    const renderBoard = () => {
        gameContainer.innerHTML = '';

        const boardEl = document.createElement('div');
        boardEl.classList.add('ttt-board');

        board.forEach((cell, index) => {
            const cellEl = document.createElement('button');
            cellEl.classList.add('ttt-cell');
            cellEl.dataset.index = index;
            cellEl.setAttribute('aria-label', `Cell ${index + 1}`);

            if (cell !== null) {
                cellEl.textContent = cell;
                cellEl.classList.add('ttt-cell--filled');
                cellEl.classList.add(cell === PLAYERS.X ? 'ttt-cell--x' : 'ttt-cell--o');
            }

            if (gameOver) {
                cellEl.classList.add('ttt-cell--disabled');
            }

            if (winningPattern !== null && winningPattern.includes(index)) {
                cellEl.classList.add('ttt-cell--win');
            }

            cellEl.addEventListener('click', () => handleCellClick(index));

            boardEl.appendChild(cellEl);
        });

        gameContainer.appendChild(boardEl);
    };

    // ── Update the status text ──
    const renderStatus = () => {
        // Clear modifier classes
        statusEl.className = 'game-page__status';

        if (gameOver) {
            const result = checkResult(board);
            if (result.winner !== null) {
                statusEl.textContent = `Player ${result.winner} wins!`;
                statusEl.classList.add('game-page__status--win');
                statusEl.classList.add(
                    result.winner === PLAYERS.X
                        ? 'game-page__status--x'
                        : 'game-page__status--o'
                );
            } else {
                statusEl.textContent = "It's a draw!";
                statusEl.classList.add('game-page__status--draw');
            }
        } else {
            statusEl.textContent = `Player ${currentPlayer}'s turn`;
            statusEl.classList.add(
                currentPlayer === PLAYERS.X
                    ? 'game-page__status--x'
                    : 'game-page__status--o'
            );
        }
    };

    // ── Handle a cell click ──
    const handleCellClick = (index) => {
        if (gameOver) {
            return;
        }

        const newBoard = makeMove(board, index, currentPlayer);
        if (newBoard === null) {
            return;
        }

        board = newBoard;

        const result = checkResult(board);

        if (result.winner !== null) {
            gameOver = true;
            winningPattern = result.winningPattern;
        } else if (result.isDraw) {
            gameOver = true;
        } else {
            currentPlayer = nextPlayer(currentPlayer);
        }

        renderBoard();
        renderStatus();

        // Add pop animation to the cell that was just placed
        if (!gameOver || result.winner !== null || result.isDraw) {
            const placedCell = gameContainer.querySelector(`[data-index="${index}"]`);
            if (placedCell) {
                placedCell.classList.add('ttt-cell--placed');
            }
        }
    };

    // ── Reset the game ──
    const resetGame = () => {
        board = createBoard();
        currentPlayer = PLAYERS.X;
        gameOver = false;
        winningPattern = null;
        renderBoard();
        renderStatus();
    };

    // ── Initialize ──
    const init = () => {
        injectStyles();
        renderBoard();
        renderStatus();
        restartBtn.addEventListener('click', resetGame);
    };

    return { init, resetGame };
})();

// Start the game when the DOM is ready
document.addEventListener('DOMContentLoaded', TicTacToeUI.init);

} // end browser-only guard

// Export for testing (Node.js / module environments)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TicTacToeLogic };
}
