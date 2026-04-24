// --- Game State ---
let board = Array(9).fill().map(() => Array(9).fill(0));
let solution = Array(9).fill().map(() => Array(9).fill(0));
let initialBoard = Array(9).fill().map(() => Array(9).fill(0));
let selectedCell = null;
let mistakes = 0;
let timer = 0;
let timerInterval = null;
let isPlaying = false;

// --- Audio & Haptics ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'error') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'win') {
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}
function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

// --- DOM Elements ---
const gridEl = document.getElementById('game-board');
const mistakeEl = document.getElementById('mistake-count');
const timeEl = document.getElementById('time');
const autoCheckEl = document.getElementById('auto-check');

// --- Initialization ---
function initGrid() {
    gridEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => selectCell(r, c));
            gridEl.appendChild(cell);
        }
    }
}

function startGame() {
    const diff = document.getElementById('difficulty').value;
    generateSudoku(diff);
    mistakes = 0;
    mistakeEl.textContent = mistakes;
    selectedCell = null;
    isPlaying = true;
    startTimer();
    renderBoard();
}

// --- Generator & Solver Logic ---
function generateSudoku(difficulty) {
    board = Array(9).fill().map(() => Array(9).fill(0));
    fillDiagonal();
    solveSudoku(board);
    
    // Copy to solution
    for(let r=0; r<9; r++) for(let c=0; c<9; c++) solution[r][c] = board[r][c];

    // Remove numbers based on difficulty
    let attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
    while (attempts > 0) {
        let r = Math.floor(Math.random() * 9);
        let c = Math.floor(Math.random() * 9);
        if (board[r][c] !== 0) {
            let backup = board[r][c];
            board[r][c] = 0;
            // Uniqueness check (simplified for performance)
            let copy = JSON.parse(JSON.stringify(board));
            let solutions = 0;
            countSolutions(copy, () => { solutions++; });
            if (solutions !== 1) board[r][c] = backup; // Revert if not unique
            else attempts--;
        }
    }
    
    for(let r=0; r<9; r++) for(let c=0; c<9; c++) initialBoard[r][c] = board[r][c];
}

function fillDiagonal() {
    for (let i = 0; i < 9; i = i + 3) fillBox(i, i);
}

function fillBox(rowStart, colStart) {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do { num = Math.floor(Math.random() * 9) + 1; } 
            while (!isSafe(board, rowStart + i, colStart + j, num));
            board[rowStart + i][colStart + j] = num;
        }
    }
}

function isSafe(grid, row, col, num) {
    for (let x = 0; x <= 8; x++) if (grid[row][x] === num) return false;
    for (let x = 0; x <= 8; x++) if (grid[x][col] === num) return false;
    let startRow = row - row % 3, startCol = col - col % 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
        if (grid[i + startRow][j + startCol] === num) return false;
    return true;
}

function solveSudoku(grid) {
    let empty = findEmpty(grid);
    if (!empty) return true;
    let [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
        if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
        }
    }
    return false;
}

function countSolutions(grid, callback) {
    let empty = findEmpty(grid);
    if (!empty) { callback(); return; }
    let [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
        if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            countSolutions(grid, callback);
            grid[row][col] = 0;
        }
    }
}

function findEmpty(grid) {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++)
        if (grid[r][c] === 0) return [r, c];
    return null;
}

// --- UI & Interaction ---
function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        let r = parseInt(cell.dataset.row);
        let c = parseInt(cell.dataset.col);
        cell.textContent = board[r][c] !== 0 ? board[r][c] : '';
        cell.className = 'cell'; // Reset classes
        if (initialBoard[r][c] !== 0) cell.classList.add('fixed');
        else if (board[r][c] !== 0) cell.classList.add('user-input');

        // Highlighting
        if (selectedCell) {
            let [sr, sc] = selectedCell;
            if (r === sr && c === sc) cell.classList.add('selected');
            else if (r === sr || c === sc || (Math.floor(r/3)===Math.floor(sr/3) && Math.floor(c/3)===Math.floor(sc/3))) {
                cell.classList.add('highlight');
            }
        }

        // Error checking
        if (autoCheckEl.checked && board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
            cell.classList.add('error');
        }
    });
    checkWin();
}

function selectCell(r, c) {
    if (!isPlaying) return;
    playSound('click');
    selectedCell = [r, c];
    renderBoard();
}

function inputNumber(num) {
    if (!selectedCell || !isPlaying) return;
    let [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0) return; // Can't edit fixed cells

    board[r][c] = num;
    let cellEl = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    cellEl.classList.add('animation-pop');
    setTimeout(() => cellEl.classList.remove('animation-pop'), 200);

    if (num !== 0 && num !== solution[r][c]) {
        mistakes++;
        mistakeEl.textContent = mistakes;
        vibrate(200);
        playSound('error');
        if (mistakes >= 3) {
            alert("3 Mistakes! Game Over.");
            isPlaying = false;
        }
    } else if(num !== 0) {
        playSound('click');
        vibrate(30);
    }
    renderBoard();
}

// --- Controls ---
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => inputNumber(parseInt(btn.dataset.val)));
});

document.getElementById('btn-erase').addEventListener('click', () => inputNumber(0));

document.getElementById('btn-hint').addEventListener('click', () => {
    if(!selectedCell || !isPlaying) return;
    let [r, c] = selectedCell;
    if(initialBoard[r][c] === 0 && board[r][c] !== solution[r][c]) {
        inputNumber(solution[r][c]);
    }
});

document.getElementById('btn-solve').addEventListener('click', () => {
    if(!isPlaying) return;
    for(let r=0; r<9; r++) for(let c=0; c<9; c++) board[r][c] = solution[r][c];
    renderBoard();
    isPlaying = false;
    clearInterval(timerInterval);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    for(let r=0; r<9; r++) for(let c=0; c<9; c++) board[r][c] = initialBoard[r][c];
    mistakes = 0; mistakeEl.textContent = mistakes;
    renderBoard();
});

document.getElementById('btn-new').addEventListener('click', startGame);

document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
});

autoCheckEl.addEventListener('change', renderBoard);

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '9') inputNumber(parseInt(e.key));
    if (e.key === 'Backspace' || e.key === 'Delete') inputNumber(0);
    
    // Arrow keys for navigation
    if(selectedCell && isPlaying) {
        let [r, c] = selectedCell;
        if(e.key === 'ArrowUp' && r > 0) selectCell(r-1, c);
        if(e.key === 'ArrowDown' && r < 8) selectCell(r+1, c);
        if(e.key === 'ArrowLeft' && c > 0) selectCell(r, c-1);
        if(e.key === 'ArrowRight' && c < 8) selectCell(r, c+1);
    }
});

// --- Timer & Win State ---
function startTimer() {
    clearInterval(timerInterval);
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        let m = String(Math.floor(timer / 60)).padStart(2, '0');
        let s = String(timer % 60).padStart(2, '0');
        timeEl.textContent = `${m}:${s}`;
    }, 1000);
}

function checkWin() {
    if (!isPlaying) return;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== solution[r][c]) return;
        }
    }
    // Win Condition Met
    isPlaying = false;
    clearInterval(timerInterval);
    playSound('win');
    vibrate([100, 50, 100, 50, 200]);
    document.getElementById('win-time').textContent = timeEl.textContent;
    document.getElementById('win-screen').classList.remove('hidden');
}

document.getElementById('btn-play-again').addEventListener('click', () => {
    document.getElementById('win-screen').classList.add('hidden');
    startGame();
});

// Start
initGrid();
startGame();
