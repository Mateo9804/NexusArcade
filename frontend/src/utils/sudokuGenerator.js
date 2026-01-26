// Sudoku Generator Logic
// Always produces a new board by shuffling numbers and using backtracking

const BLANK = 0;

export const generateSudoku = (difficulty) => {
    // 1. Create a full valid board
    const board = Array(9).fill(0).map(() => Array(9).fill(BLANK));
    fillBoard(board);

    // 2. Clone it to keep the solution
    const solution = board.map(row => [...row]);

    // 3. Remove numbers based on difficulty
    // Easy: 35-45 removed, Medium: 46-52 removed, Hard: 53-58 removed, Expert: 59-64 removed
    const difficultyMap = {
        'easy': 40,
        'medium': 50,
        'hard': 56,
        'expert': 62
    };

    const attempts = difficultyMap[difficulty] || 40;
    pokeHoles(board, attempts);

    return { board, solution };
};

const fillBoard = (board) => {
    for (let i = 0; i < 81; i++) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        if (board[row][col] === BLANK) {
            const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const num of numbers) {
                if (isValid(board, row, col, num)) {
                    board[row][col] = num;
                    if (checkBoard(board)) return true;
                    if (fillBoard(board)) return true;
                }
            }
            board[row][col] = BLANK;
            return false;
        }
    }
    return true;
};

const isValid = (board, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) if (board[row][x] === num) return false;
    // Check col
    for (let x = 0; x < 9; x++) if (board[x][col] === num) return false;
    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }
    return true;
};

const checkBoard = (board) => {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === BLANK) return false;
        }
    }
    return true;
};

const pokeHoles = (board, holes) => {
    let removed = 0;
    while (removed < holes) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (board[row][col] !== BLANK) {
            board[row][col] = BLANK;
            removed++;
        }
    }
};

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

