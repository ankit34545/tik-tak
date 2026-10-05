const boardContainer = document.getElementById('board');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');
const gridSizeSelect = document.getElementById('grid-size');
const gameModeSelect = document.getElementById('game-mode');

// Player Name Inputs
const player1Input = document.getElementById('player1-name');
const player2Input = document.getElementById('player2-name');

// Score Elements
const scoreXDisplay = document.getElementById('score-x');
const scoreODisplay = document.getElementById('score-o');
const scoreTiesDisplay = document.getElementById('score-ties');
const scoreCardX = document.querySelector('.score-card.player-x');
const scoreCardO = document.querySelector('.score-card.player-o');
const labelX = document.getElementById('label-x');
const labelO = document.getElementById('label-o');

// Modal Elements
const modal = document.getElementById('winner-modal');
const modalTitle = document.getElementById('modal-title');
const modalCloseBtn = document.getElementById('modal-close-btn');

let gridSize = 3;
let board = [];
let currentPlayer = 'X'; // X is player 1, O is player 2
let gameActive = true;
let scores = { X: 0, O: 0, Ties: 0 };
let cells = [];
let gameMode = 'pvp'; // 'pvp' or 'cpu'

let currentMatchKey = '';

// Helper to get consistent match key regardless of who is X and O
function getMatchKey() {
    let p1 = player1Input.value.trim() || 'Player 1';
    let p2 = gameMode === 'cpu' ? 'Computer' : (player2Input.value.trim() || 'Player 2');
    return `tictactoe_scores_${p1.toLowerCase()}_vs_${p2.toLowerCase()}_${gameMode}`;
}

// Load scores from Session Storage on startup or name change
function loadScores() {
    currentMatchKey = getMatchKey();
    try {
        const savedScores = sessionStorage.getItem(currentMatchKey);
        if (savedScores) {
            scores = JSON.parse(savedScores);
        } else {
            scores = { X: 0, O: 0, Ties: 0 }; // default if no history
        }
    } catch (e) {
        scores = { X: 0, O: 0, Ties: 0 };
    }
    updateScores();
}

// Save scores to Session Storage
function saveScores() {
    try {
        sessionStorage.setItem(currentMatchKey, JSON.stringify(scores));
    } catch (e) {
        // Ignored if storage is blocked
    }
}

// Initialize game
function initGame() {
    gridSize = parseInt(gridSizeSelect.value);
    gameMode = gameModeSelect.value;
    
    let p1Name = player1Input.value.trim() || 'Player 1';
    let p2Name = gameMode === 'cpu' ? 'Computer' : (player2Input.value.trim() || 'Player 2');

    // Handle CPU mode input state
    if (gameMode === 'cpu') {
        player2Input.value = 'Computer';
        player2Input.disabled = true;
    } else {
        if(player2Input.value === 'Computer') {
            player2Input.value = 'Player 2';
        }
        player2Input.disabled = false;
        p2Name = player2Input.value.trim() || 'Player 2';
    }

    // Update Scorecard labels
    labelX.textContent = p1Name + " (X)";
    labelO.textContent = p2Name + " (O)";

    document.documentElement.style.setProperty('--grid-size', gridSize);
    board = Array(gridSize * gridSize).fill('');
    currentPlayer = 'X';
    gameActive = true;
    
    // Clear and build board
    boardContainer.innerHTML = '';
    cells = [];
    
    for (let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleCellClick);
        boardContainer.appendChild(cell);
        cells.push(cell);
    }
    
    // Only reload from storage if the matchup changed, otherwise keep memory score
    if (getMatchKey() !== currentMatchKey) {
        loadScores();
    }
    
    updateStatusDisplay();
    updateActiveScoreCard();
}

function handleCellClick(e) {
    const clickedCell = e.target;
    const index = parseInt(clickedCell.getAttribute('data-index'));

    if (board[index] !== '' || !gameActive || (gameMode === 'cpu' && currentPlayer === 'O')) {
        return;
    }

    playMove(index);
}

function playMove(index) {
    board[index] = currentPlayer;
    cells[index].classList.add(currentPlayer.toLowerCase());
    cells[index].textContent = currentPlayer;

    checkResult();
}

function makeCPUMove() {
    if (!gameActive) return;

    statusDisplay.textContent = 'Computer is thinking...';
    
    setTimeout(() => {
        let emptyCells = [];
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') emptyCells.push(i);
        }

        if (emptyCells.length > 0) {
            let randomIndex = Math.floor(Math.random() * emptyCells.length);
            playMove(emptyCells[randomIndex]);
        }
    }, 600);
}

function checkResult() {
    let roundWon = false;
    let winningCells = [];

    // Check Rows
    for (let i = 0; i < gridSize; i++) {
        let rowStart = i * gridSize;
        let firstCell = board[rowStart];
        if (firstCell === '') continue;
        
        let rowWon = true;
        let currentWinningCells = [rowStart];
        
        for (let j = 1; j < gridSize; j++) {
            if (board[rowStart + j] !== firstCell) {
                rowWon = false;
                break;
            }
            currentWinningCells.push(rowStart + j);
        }
        
        if (rowWon) {
            roundWon = true;
            winningCells = currentWinningCells;
            break;
        }
    }

    // Check Columns
    if (!roundWon) {
        for (let i = 0; i < gridSize; i++) {
            let firstCell = board[i];
            if (firstCell === '') continue;
            
            let colWon = true;
            let currentWinningCells = [i];
            
            for (let j = 1; j < gridSize; j++) {
                if (board[i + j * gridSize] !== firstCell) {
                    colWon = false;
                    break;
                }
                currentWinningCells.push(i + j * gridSize);
            }
            
            if (colWon) {
                roundWon = true;
                winningCells = currentWinningCells;
                break;
            }
        }
    }

    // Check Diagonal 1
    if (!roundWon) {
        let firstCell = board[0];
        if (firstCell !== '') {
            let diagWon = true;
            let currentWinningCells = [0];
            for (let i = 1; i < gridSize; i++) {
                if (board[i * gridSize + i] !== firstCell) {
                    diagWon = false;
                    break;
                }
                currentWinningCells.push(i * gridSize + i);
            }
            if (diagWon) {
                roundWon = true;
                winningCells = currentWinningCells;
            }
        }
    }

    // Check Diagonal 2
    if (!roundWon) {
        let firstCell = board[gridSize - 1];
        if (firstCell !== '') {
            let diagWon = true;
            let currentWinningCells = [gridSize - 1];
            for (let i = 1; i < gridSize; i++) {
                if (board[(i + 1) * gridSize - (i + 1)] !== firstCell) {
                    diagWon = false;
                    break;
                }
                currentWinningCells.push((i + 1) * gridSize - (i + 1));
            }
            if (diagWon) {
                roundWon = true;
                winningCells = currentWinningCells;
            }
        }
    }

    // Handle Result
    if (roundWon) {
        gameActive = false;
        scores[currentPlayer]++;
        saveScores(); 
        updateScores();
        
        winningCells.forEach(index => cells[index].classList.add('win'));
        
        let p1Name = player1Input.value.trim() || 'Player 1';
        let p2Name = gameMode === 'cpu' ? 'Computer' : (player2Input.value.trim() || 'Player 2');
        let winnerName = currentPlayer === 'X' ? p1Name : p2Name;
        
        statusDisplay.innerHTML = `<span style="color: var(--accent-${currentPlayer.toLowerCase()})">${winnerName} Wins!</span>`;
        
        setTimeout(() => showModal(`${winnerName} Wins!`, `var(--accent-${currentPlayer.toLowerCase()})`), 300);
        return;
    }

    let roundDraw = !board.includes('');
    if (roundDraw) {
        gameActive = false;
        scores.Ties++;
        saveScores(); 
        updateScores();
        statusDisplay.textContent = 'Game Ended in a Draw!';
        setTimeout(() => showModal(`It's a Draw!`, `var(--text-primary)`), 300);
        return;
    }

    // Next turn
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatusDisplay();
    updateActiveScoreCard();

    if (gameMode === 'cpu' && currentPlayer === 'O' && gameActive) {
        makeCPUMove();
    }
}

function updateStatusDisplay() {
    let p1Name = player1Input.value.trim() || 'Player 1';
    let p2Name = gameMode === 'cpu' ? 'Computer' : (player2Input.value.trim() || 'Player 2');
    
    let activeName = currentPlayer === 'X' ? p1Name : p2Name;

    statusDisplay.innerHTML = `<span style="color: var(--accent-${currentPlayer.toLowerCase()})">${activeName}'s</span> Turn`;
    statusDisplay.style.color = 'var(--text-secondary)';
}

function updateActiveScoreCard() {
    if (currentPlayer === 'X') {
        scoreCardX.classList.add('active');
        scoreCardO.classList.remove('active');
    } else {
        scoreCardO.classList.add('active');
        scoreCardX.classList.remove('active');
    }
}

function updateScores() {
    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreTiesDisplay.textContent = scores.Ties;
}

function clearScores() {
    if (confirm("Are you sure you want to clear the win records for this matchup?")) {
        scores = { X: 0, O: 0, Ties: 0 };
        saveScores();
        updateScores();
    }
}

function showModal(text, color) {
    modalTitle.textContent = text;
    modalTitle.style.color = color;
    modal.classList.add('show');
}

function hideModal() {
    modal.classList.remove('show');
    initGame();
}

// Event Listeners
gridSizeSelect.addEventListener('change', initGame);
gameModeSelect.addEventListener('change', initGame);
resetBtn.addEventListener('click', initGame);
resetScoresBtn.addEventListener('click', clearScores);
modalCloseBtn.addEventListener('click', hideModal);

// When names change, re-initialize to load their specific head-to-head records
player1Input.addEventListener('change', initGame);
player2Input.addEventListener('change', initGame);

// Start game initially
initGame();
