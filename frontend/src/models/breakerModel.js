import axios from "axios";
import { LEVELS } from '../breaker_levels';

// --- Nastavení API ---
const API_URL = "http://127.0.0.1:5000";

// --- Konstanty (Zvětšená verze) ---
export const GAME_WIDTH = 1200; 
export const GAME_HEIGHT = 800;

const PADDLE_WIDTH = 180;
const PADDLE_HEIGHT = 20;
const PADDLE_SPEED = 9;
const BALL_RADIUS = 10;
const BALL_SPEED_BASE = 2.5;

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_PADDING = 15;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = 50;
const BRICK_WIDTH = (GAME_WIDTH - (2 * BRICK_OFFSET_LEFT) - ((BRICK_COLS - 1) * BRICK_PADDING)) / BRICK_COLS;
const BRICK_HEIGHT = 35;

const INITIAL_LIVES = 3;

// --- Pomocné funkce ---
function initBricks(levelIndex) {
    const bricks = [];
    const levelLayout = LEVELS[levelIndex % LEVELS.length];
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            if (levelLayout[r] && levelLayout[r][c] === 1) {
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                bricks.push({ x: brickX, y: brickY, width: BRICK_WIDTH, height: BRICK_HEIGHT, status: 1 });
            }
        }
    }
    return bricks;
}

function resetPositions(state) {
    return {
        ...state,
        paddleX: (GAME_WIDTH - PADDLE_WIDTH) / 2,
        ballX: GAME_WIDTH / 2,
        ballY: GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
        ballDX: BALL_SPEED_BASE * (Math.random() > 0.5 ? 1 : -1),
        ballDY: -BALL_SPEED_BASE,
        ballMoving: false
    };
}

export const BreakerModel = {
    // --- API KOMUNIKACE ---

    // 1. Načtení statistik ze serveru
    async fetchStats() {
        try {
            const res = await axios.get(`${API_URL}/api/breaker/stats`);
            // Předpokládáme, že server vrací { highScore: 123 }
            return res.data.highScore || 0;
        } catch (e) {
            console.error("Failed to fetch stats from server", e);
            return 0; // Fallback, pokud server nejede
        }
    },

    // 2. Uložení skóre na server (Server rozhodne, jestli je to rekord)
    async saveScoreServer(score) {
        try {
            // Pošleme aktuální skóre, server si ho porovná s DB
            const res = await axios.post(`${API_URL}/api/breaker/save`, { score });
            return res.data.highScore; // Server vrátí aktualizované maximum
        } catch (e) {
            console.error("Failed to save score to server", e);
            return null;
        }
    },

    // --- HERNÍ LOGIKA ---

    // Inicializace lokálního stavu (High Score se doplní později)
    initGameLocal() {
        let initialState = {
            score: 0,
            highScore: 0, // Placeholder, než se načte z API
            lives: INITIAL_LIVES,
            level: 1,
            gameOver: false,
            gameWon: false,
            paddleWidth: PADDLE_WIDTH,
            paddleHeight: PADDLE_HEIGHT,
            ballRadius: BALL_RADIUS,
            bricks: initBricks(0)
        };
        return resetPositions(initialState);
    },

    movePaddle(state, direction) {
        if (state.gameOver || state.gameWon) return state;
        let newPaddleX = state.paddleX;
        if (direction === 'left') newPaddleX -= PADDLE_SPEED;
        else if (direction === 'right') newPaddleX += PADDLE_SPEED;
        
        if (newPaddleX < 0) newPaddleX = 0;
        if (newPaddleX + state.paddleWidth > GAME_WIDTH) newPaddleX = GAME_WIDTH - state.paddleWidth;
        
        let newBallX = state.ballX;
        if (!state.ballMoving) newBallX = newPaddleX + state.paddleWidth / 2;
        
        return { ...state, paddleX: newPaddleX, ballX: newBallX };
    },

    launchBall(state) {
        if (!state.ballMoving && !state.gameOver && !state.gameWon) {
            return { ...state, ballMoving: true };
        }
        return state;
    },

    updatePhysics(state) {
        if (state.gameOver || state.gameWon || !state.ballMoving) return state;

        let { ballX, ballY, ballDX, ballDY, paddleX, paddleWidth, bricks, score, lives, level, highScore } = state;
        let newGameOver = false;
        let newGameWon = false;
        let nextInitialState = null;

        // Pohyb míčku
        ballX += ballDX;
        ballY += ballDY;

        // Kolize se stěnami
        if (ballX + ballDX > GAME_WIDTH - BALL_RADIUS || ballX + ballDX < BALL_RADIUS) ballDX = -ballDX;
        if (ballY + ballDY < BALL_RADIUS) ballDY = -ballDY;
        
        // Spodní hrana (smrt)
        if (ballY + ballDY > GAME_HEIGHT - BALL_RADIUS) {
            lives--;
            if (lives <= 0) newGameOver = true;
            else {
                const resetState = resetPositions(state);
                return { ...resetState, score, lives, level, highScore, bricks };
            }
        }

        // Pálka
        if (ballY > GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS && ballX > paddleX && ballX < paddleX + paddleWidth) {
            ballDY = -Math.abs(ballDY);
            let hitPoint = ballX - (paddleX + paddleWidth / 2);
            hitPoint = hitPoint / (paddleWidth / 2);
            ballDX = hitPoint * BALL_SPEED_BASE * 1.5;
            if (Math.abs(ballDX) < 1) ballDX = ballDX > 0 ? 1.5 : -1.5;
        }

        // Cihly
        let bricksChanged = false;
        let activeBricksCount = 0;
        bricks = bricks.map(brick => {
            if (brick.status === 1) {
                activeBricksCount++;
                if (ballX + BALL_RADIUS > brick.x && ballX - BALL_RADIUS < brick.x + brick.width && ballY + BALL_RADIUS > brick.y && ballY - BALL_RADIUS < brick.y + brick.height) {
                    ballDY = -ballDY;
                    score += 10;
                    bricksChanged = true;
                    activeBricksCount--;
                    return { ...brick, status: 0 };
                }
            }
            return brick;
        });

        // Update lokálního High Score (vizuální efekt)
        if (score > highScore) {
            highScore = score;
        }

        // Level logika
        if (activeBricksCount === 0 && !newGameOver) {
            level++;
            if (level > LEVELS.length) {
                newGameWon = true;
                level--;
            } else {
                nextInitialState = resetPositions({
                    ...state,
                    level: level,
                    score: score,
                    highScore: highScore,
                    lives: lives,
                    bricks: initBricks(level - 1),
                    ballMoving: false
                });
            }
        }

        if (nextInitialState) return nextInitialState;

        return {
            ...state,
            ballX, ballY, ballDX, ballDY,
            bricks: bricksChanged ? bricks : state.bricks,
            score, lives, level, highScore,
            gameOver: newGameOver,
            gameWon: newGameWon
        };
    },
};