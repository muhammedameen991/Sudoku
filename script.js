/**
 * SUDOKU ENGINE - CORE LOGIC & MULTIPLAYER
 */

// --- Game State Variables ---
let board = [];      // Current state of the grid
let solution = [];   // Hidden solved grid
let initial = [];    // Fixed cells (starting numbers)
let ownership = [];  // Tracks P1/P2 cell ownership for PvP

let gameMode = 'solo'; 
let currentPlayer = 1;
let p1Score = 0, p2Score = 0;
let mistakes = 0;
let timer = 0;
let timerInterval = null;
let selectedCell = null;
let isPlaying = false;

// --- Sound Engine (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// --- Sudoku Generation & Backtracking ---
function isValidMove(grid, r, c, n) {
    for (let i = 0; i < 9; i++) {
        if (grid[r][i] === n || grid[i][c] === n) return false;
    }
    const startRow = r - r % 3, startCol = c - c % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[startRow + i][startCol + j] === n) return false;
        }
    }
    return true;
}

function solveSudoku(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                for (let n = 1; n <= 9; n++) {
                    if (isValidMove(grid, r, c, n)) {
                        grid[r][c] = n;
                        if (solveSudoku(grid)) return true;
                        grid[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function generatePuzzle(difficulty) {
    // 1. Create empty board
    board = Array(9).fill().map(() => Array(9).fill(0));
    
    // 2. Fill diagonal 3x3 boxes (random but valid)
    for (let i = 0; i < 9; i += 3) {
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                let n;
                do { n = Math.floor(Math.random() * 9) + 1; } 
                while (!isValidMove(board, i + r, i + c, n));
                board[i + r][i + c] = n;
            }
        }
    }

    // 3. Solve fully
    solveSudoku(board);
    solution = board.map(row => [...row]);

    // 4. Remove numbers based on difficulty
    let attempts = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55;
    while (attempts > 0) {
        let r = Math.floor(Math.random() * 9);
        let c = Math.floor(Math.random() * 9);
        if (board[r][c] !== 0) {
            board[r][c] = 0;
            attempts--;
        }
    }
    initial = board.map(row => [...row]);
    ownership = Array(9).fill().map(() => Array(9).fill(0));
}

// --- UI Rendering ---
function renderBoard() {
    const gridEl = document.getElementById('game-board');
    gridEl.innerHTML = '';

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (initial[r][c] !== 0) cell.classList.add('fixed');
            
            // Selection & Highlighting
            if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
                cell.classList.add('selected');
            } else if (selectedCell && (selectedCell[0] === r || selectedCell[1] === c)) {
                cell.classList.add('highlight');
            }

            if (board[r][c] !== 0) {
                cell.textContent = board[r][c];
                if (gameMode === 'pvp') {
                    cell.classList.add(ownership[r][c] === 1 ? 'p1-owned' : 'p2-owned');
                } else if (board[r][c] !== solution[r][c] && document.getElementById('auto-check').checked) {
                    cell.classList.add('error');
                }
            }

            cell.onclick = () => {
                selectedCell = [r, c];
                playBeep(600, 0.05);
                renderBoard();
            };
            gridEl.appendChild(cell);
        }
    }
    checkWin();
}

// --- Input Handling ---
function handleInput(n) {
    if (!selectedCell || !isPlaying) return;
    const [r, c] = selectedCell;

    // Prevent editing fixed cells or correctly solved PvP cells
    if (initial[r][c] !== 0 || (gameMode === 'pvp' && board[r][c] === solution[r][c])) return;

    if (gameMode === 'solo') {
        board[r][c] = n;
        if (n !== 0 && n !== solution[r][c]) {
            mistakes++;
            document.getElementById('mistake-count').textContent = mistakes;
            playBeep(150, 0.15);
            if (mistakes >= 3) {
                alert("Game Over! 3 Mistakes made.");
                isPlaying = false;
            }
        } else {
            playBeep(800, 0.05);
        }
    } else {
        // PvP Mode Logic
        if (n === 0) return; // Erase disabled in PvP
        if (n === solution[r][c]) {
            board[r][c] = n;
            ownership[r][c] = currentPlayer;
            currentPlayer === 1 ? p1Score++ : p2Score++;
            playBeep(900, 0.08);
            // Player keeps turn on correct hit
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            playBeep(200, 0.1);
        }
        updatePvPDisplay();
    }
    renderBoard();
}

function updatePvPDisplay() {
    document.getElementById('p1-score').textContent = p1Score;
    document.getElementById('p2-score').textContent = p2Score;
    document.getElementById('p1-score-box').classList.toggle('p1-active', currentPlayer === 1);
    document.getElementById('p2-score-box').classList.toggle('p2-active', currentPlayer === 2);
}

// --- Game Control ---
function startNewGame(mode) {
    gameMode = mode;
    isPlaying = true;
    mistakes = 0;
    timer = 0;
    currentPlayer = 1;
    p1Score = 0; p2Score = 0;
    selectedCell = null;
    
    document.getElementById('mistake-count').textContent = '0';
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('solo-status').classList.toggle('hidden', mode !== 'solo');
    document.getElementById('pvp-scoreboard').classList.toggle('hidden', mode === 'solo');

    generatePuzzle(document.getElementById('difficulty').value);

    if (mode === 'solo') {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer++;
            const m = Math.floor(timer / 60).toString().padStart(2, '0');
            const s = (timer % 60).toString().padStart(2, '0');
            document.getElementById('time').textContent = `${m}:${s}`;
        }, 1000);
    } else {
        clearInterval(timerInterval);
        updatePvPDisplay();
    }
    renderBoard();
}

function checkWin() {
    if (!board.flat().includes(0) && isPlaying) {
        isPlaying = false;
        clearInterval(timerInterval);
        playBeep(500, 0.5);
        
        const winScreen = document.getElementById('win-screen');
        const winTitle = document.getElementById('win-title');
        const winSub = document.getElementById('win-subtitle');
        
        winScreen.classList.remove('hidden');
        if (gameMode === 'solo') {
            winTitle.textContent = "🎉 You Won! 🎉";
            winSub.textContent = `Time: ${document.getElementById('time').textContent}`;
        } else {
            const winner = p1Score > p2Score ? "Player 1" : (p2Score > p1Score ? "Player 2" : "It's a Tie");
            winTitle.textContent = `🏆 ${winner} Wins! 🏆`;
            winSub.textContent = `Score: P1(${p1Score}) - P2(${p2Score})`;
        }
    }
}

// --- Event Listeners ---
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.onclick = () => handleInput(parseInt(btn.dataset.val));
});

document.getElementById('btn-erase').onclick = () => handleInput(0);
document.getElementById('btn-new').onclick = () => startNewGame('solo');
document.getElementById('btn-pvp').onclick = () => startNewGame('pvp');
document.getElementById('btn-play-again').onclick = () => {
    document.getElementById('win-screen').classList.add('hidden');
    startNewGame(gameMode);
};

document.getElementById('btn-hint').onclick = () => {
    if (!selectedCell || !isPlaying) return;
    const [r, c] = selectedCell;
    if (board[r][c] === 0) handleInput(solution[r][c]);
};

document.getElementById('btn-solve').onclick = () => {
    board = solution.map(row => [...row]);
    renderBoard();
};

document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark');
};

// Keyboard Support
document.onkeydown = (e) => {
    if (e.key >= '1' && e.key <= '9') handleInput(parseInt(e.key));
    if (e.key === 'Backspace' || e.key === 'Delete') handleInput(0);
};

// Init Game
startNewGame('solo');
