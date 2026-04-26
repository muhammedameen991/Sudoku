/* --- Design System & Theme Variables --- */
:root {
    /* Light Mode Palette */
    --bg: #f4f5f7;
    --surface: #ffffff;
    --text: #1a1a1a;
    --text-muted: #666;
    --border: #ccc;
    --border-thick: #2c3e50;
    --cell-bg: #fff;
    --cell-selected: #bbdefb;
    --cell-highlight: #e3f2fd;
    --cell-fixed: #f8f9fa;
    --error: #e74c3c;
    --error-bg: #fadbd8;
    --primary: #3498db;
    --p1-color: #2980b9; /* Player 1 Blue */
    --p2-color: #c0392b; /* Player 2 Red */
    --btn-shadow: rgba(0, 0, 0, 0.1);
}

body.dark {
    /* Dark Mode Palette */
    --bg: #121212;
    --surface: #1e1e1e;
    --text: #e0e0e0;
    --text-muted: #aaa;
    --border: #444;
    --border-thick: #888;
    --cell-bg: #2a2a2a;
    --cell-selected: #1976d2;
    --cell-highlight: #334e68;
    --cell-fixed: #1f1f1f;
    --error: #ff5252;
    --error-bg: #4a0000;
    --p1-color: #5dade2;
    --p2-color: #e74c3c;
    --btn-shadow: rgba(0, 0, 0, 0.4);
}

/* --- Layout Defaults --- */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none; /* Prevents text selection during rapid gameplay */
    -webkit-tap-highlight-color: transparent;
}

body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background-color: var(--bg);
    color: var(--text);
    display: flex;
    justify-content: center;
    transition: background-color 0.3s, color 0.3s;
    touch-action: manipulation; /* Optimizes for mobile tapping */
}

.app-container {
    width: 100%;
    max-width: 450px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* --- Header & Status Bar --- */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 5px;
}

.status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    font-weight: bold;
    color: var(--text-muted);
    min-height: 40px;
}

.hidden {
    display: none !important;
}

/* --- Multiplayer Scoreboard --- */
.score-box {
    padding: 6px 12px;
    border-radius: 8px;
    opacity: 0.4;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: var(--surface);
}

.p1-active {
    opacity: 1;
    border-color: var(--p1-color);
    color: var(--p1-color);
    box-shadow: 0 0 10px rgba(41, 128, 185, 0.2);
}

.p2-active {
    opacity: 1;
    border-color: var(--p2-color);
    color: var(--p2-color);
    box-shadow: 0 0 10px rgba(192, 57, 43, 0.2);
}

/* --- Sudoku Grid Logic --- */
.sudoku-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    width: 100%;
    aspect-ratio: 1; /* Maintains square shape */
    border: 3px solid var(--border-thick);
    background: var(--border-thick);
    gap: 1px;
    border-radius: 4px;
    overflow: hidden;
}

.cell {
    background: var(--cell-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
}

/* Thick borders for 3x3 sub-grids */
.cell:nth-child(3n) { border-right: 2px solid var(--border-thick); }
.cell:nth-child(9n) { border-right: none; }
.cell:nth-child(n+19):nth-child(-n+27),
.cell:nth-child(n+46):nth-child(-n+54) { border-bottom: 2px solid var(--border-thick); }

/* Cell States */
.cell.fixed { background: var(--cell-fixed); color: var(--text); }
.cell.selected { background: var(--cell-selected) !important; }
.cell.highlight { background: var(--cell-highlight); }
.cell.error { background: var(--error-bg); color: var(--error); }
.cell.user-input { color: var(--primary); }

/* Multiplayer Ownership Styles */
.cell.p1-owned { color: var(--p1-color); font-weight: 800; }
.cell.p2-owned { color: var(--p2-color); font-weight: 800; }

.cell.animation-pop {
    animation: pop 0.2s ease-out;
}

@keyframes pop {
    0% { transform: scale(0.85); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* --- Controls & Inputs --- */
.controls, .numpad {
    display: grid;
    gap: 8px;
}

.controls { grid-template-columns: repeat(4, 1fr); }
.numpad { grid-template-columns: repeat(5, 1fr); }

button, select {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 10px 5px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
    box-shadow: 0 2px 4px var(--btn-shadow);
}

button:active {
    transform: scale(0.96);
    box-shadow: none;
}

.pvp-btn {
    border-color: #f39c12;
    color: #f39c12;
}

.numpad button {
    font-size: 1.4rem;
    padding: 14px 0;
}

/* --- Win Screen Overlay --- */
#win-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.win-content {
    background: var(--surface);
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 80%;
    animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.win-content h2 {
    margin-bottom: 10px;
    font-size: 2rem;
    color: #f1c40f;
}

.win-content button {
    margin-top: 20px;
    background: var(--primary);
    color: white;
    border: none;
    padding: 12px 24px;
    font-size: 1.1rem;
}

@keyframes slideUp {
    0% { transform: translateY(100px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
}
