/*
Model Component: Breaker.jsx
Author: Šimon Dufek
*/
import axios from "axios";
import { LEVELS } from '../breaker_levels';

const API_URL = "http://127.0.0.1:5000";

export const GAME_WIDTH = 1200; 
export const GAME_HEIGHT = 800;

const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 10;
const POWERUP_SIZE = 30;
const POWERUP_SPEED = 2;
const DROP_CHANCE = 0.3; 

export const DIFFICULTIES = { // Nastavení obtížností
    EASY: { label: "Lehká", paddleWidth: 220, ballSpeed: 2.5, lives: 4, color: "#2ecc71", scoreMultiplier: 1 },
    NORMAL: { label: "Střední", paddleWidth: 180, ballSpeed: 4, lives: 3, color: "#f1c40f", scoreMultiplier: 1.5 },
    HARD: { label: "Těžká", paddleWidth: 120, ballSpeed: 6, lives: 2, color: "#e74c3c", scoreMultiplier: 2.5 }
};

const PADDLE_WIDTH_EXPANDED = 300;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_PADDING = 15;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = 50;
const BRICK_WIDTH = (GAME_WIDTH - (2 * BRICK_OFFSET_LEFT) - ((BRICK_COLS - 1) * BRICK_PADDING)) / BRICK_COLS;
const BRICK_HEIGHT = 35;

function initBricks(worldIndex, subLevelIndex) { // Inicializace cihel pro daný svět a podúroveň
    const bricks = [];
    const world = LEVELS[worldIndex % LEVELS.length];
    const levelLayout = world[subLevelIndex % world.length];

    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            const type = levelLayout[r] ? levelLayout[r][c] : 0;
            if (type > 0) {
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                bricks.push({
                    x: brickX, y: brickY, width: BRICK_WIDTH, height: BRICK_HEIGHT, 
                    status: 1, health: type, maxHealth: type
                });
            }
        }
    }
    return bricks;
}

function createBall(x, y, dx, dy, moving = false) { // Vytvoření nové koule
    return { x, y, dx, dy, moving };
}

function resetPositions(state) { // Resetování pozic pálky a koulí
    const currentPaddleWidth = state.paddleWidthDefault || DIFFICULTIES.NORMAL.paddleWidth;
    return {
        ...state,
        paddleWidth: currentPaddleWidth, 
        paddleX: (GAME_WIDTH - currentPaddleWidth) / 2,
        balls: [
            createBall(
                GAME_WIDTH / 2, GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS - 5,
                state.baseSpeed * (Math.random() > 0.5 ? 1 : -1), -state.baseSpeed, false
            )
        ],
        powerUps: [] 
    };
}

export const BreakerModel = { // Hlavní model pro správu herního stavu a komunikaci se serverem
    async fetchStats() { // Načtení nejvyššího skóre ze serveru
        try { return (await axios.get(`${API_URL}/api/breaker/stats`)).data.highScore || 0; } 
        catch (e) { return 0; }
    },

    async saveScoreServer(score) { // Uložení skóre na server
        try { return (await axios.post(`${API_URL}/api/breaker/save`, { score })).data.highScore; } 
        catch (e) { return null; }
    },

    async fetchSettings() { // Načtení nastavení power-upů ze serveru
        try { return (await axios.get(`${API_URL}/api/breaker/powerups`)).data.powerups_enabled; } 
        catch (e) { return false; }
    },

    async saveSettings(enabled) { // Uložení nastavení power-upů na server
        const res = await axios.post(`${API_URL}/api/breaker/powerups`, { enabled });
        return res.data.powerups_enabled;
    },

    async fetchProgress() { // Načtení postupu hráče (odemčené světy) ze serveru
        try { return (await axios.get(`${API_URL}/api/breaker/progress`)).data.maxUnlockedWorld || 0; }
        catch (e) { return 0; }
    },

    async saveProgress(worldIndex) { // Uložení postupu hráče na server
        try { 
            const res = await axios.post(`${API_URL}/api/breaker/progress`, { worldIndex });
            return res.data.maxUnlockedWorld;
        } catch (e) { return null; }
    },
    
    async saveGameState(state) { // Uložení aktuálního stavu hry na server
        try {
            await axios.post(`${API_URL}/api/breaker/state`, state);
        } catch (e) {
            console.error("Chyba auto-save:", e);
        }
    },

    async loadGameState() { // Načtení uloženého stavu hry ze serveru
        try {
            const res = await axios.get(`${API_URL}/api/breaker/state`);
            return res.data.state; 
        } catch (e) {
            return null;
        }
    },

    async clearGameState() { // Vymazání uloženého stavu hry na serveru
        try {
            await axios.delete(`${API_URL}/api/breaker/state`);
        } catch (e) {
            console.error("Chyba mazání save:", e);
        }
    },

    initGameLocal(difficultyKey = 'NORMAL', worldIndex = 0, unlockedWorldMax = 0) { // Inicializace nového herního stavu
        const settings = DIFFICULTIES[difficultyKey] || DIFFICULTIES.NORMAL;
        const safeWorldIndex = worldIndex <= unlockedWorldMax ? worldIndex : unlockedWorldMax;

        let initialState = {
            score: 0,
            highScore: 0,
            lives: settings.lives,
            
            worldIndex: safeWorldIndex,
            subLevelIndex: 0,
            maxUnlockedWorld: Math.max(unlockedWorldMax, safeWorldIndex),

            gameOver: false,
            gameWon: false,
            difficulty: difficultyKey,
            baseSpeed: settings.ballSpeed,
            paddleWidthDefault: settings.paddleWidth,
            scoreMultiplier: settings.scoreMultiplier,
            paddleWidth: settings.paddleWidth,
            paddleHeight: PADDLE_HEIGHT,
            ballRadius: BALL_RADIUS,
            
            bricks: initBricks(safeWorldIndex, 0),
            powerUps: [],
            powerUpsEnabled: false,
            balls: [],
            gameStarted: false 
        };
        return resetPositions(initialState);
    },

    movePaddle(state, direction) { // Pohyb pálky vlevo nebo vpravo
        if (state.gameOver || state.gameWon || !state.gameStarted) return state;
        let newPaddleX = state.paddleX;
        const paddleSpeed = state.baseSpeed * 2; 
        if (direction === 'left') newPaddleX -= paddleSpeed;
        else if (direction === 'right') newPaddleX += paddleSpeed;
        if (newPaddleX < 0) newPaddleX = 0;
        if (newPaddleX + state.paddleWidth > GAME_WIDTH) newPaddleX = GAME_WIDTH - state.paddleWidth;
        const updatedBalls = state.balls.map(ball => {
            if (!ball.moving) return { ...ball, x: newPaddleX + state.paddleWidth / 2 };
            return ball;
        });
        return { ...state, paddleX: newPaddleX, balls: updatedBalls };
    },

    launchBall(state) { // Spuštění koule do pohybu
        if (state.gameOver || state.gameWon || !state.gameStarted) return state;
        const launchedBalls = state.balls.map(ball => ({ ...ball, moving: true }));
        if (state.balls.some(b => !b.moving)) return { ...state, balls: launchedBalls };
        return state;
    },

    updatePhysics(state) { // Aktualizace fyziky hry (pohyb koulí, kolize, power-upy, kontrola konce hry)        
        if (state.gameOver || state.gameWon || !state.gameStarted) return state;

        let { 
            balls, paddleX, paddleWidth, bricks, score, lives, highScore,
            powerUps, powerUpsEnabled, baseSpeed, scoreMultiplier,
            worldIndex, subLevelIndex, maxUnlockedWorld
        } = state;

        let newGameOver = false;
        let newGameWon = false;
        let nextInitialState = null;
        let bricksChanged = false;

        let survivingBalls = [];

        balls.forEach(ball => { // Zpracování každé koule
            if (!ball.moving) { survivingBalls.push(ball); return; }

            let { x, y, dx, dy } = ball;
            x += dx; y += dy;

            if (x + dx > GAME_WIDTH - BALL_RADIUS || x + dx < BALL_RADIUS) dx = -dx;
            if (y + dy < BALL_RADIUS) dy = -dy;

            if (y > GAME_HEIGHT - PADDLE_HEIGHT - BALL_RADIUS && x > paddleX && x < paddleX + paddleWidth) {
                dy = -Math.abs(dy);
                let hitPoint = x - (paddleX + paddleWidth / 2);
                hitPoint = hitPoint / (paddleWidth / 2); 
                dx = hitPoint * baseSpeed * 1.5;
                if (Math.abs(dx) < 1) dx = dx > 0 ? 1.5 : -1.5;
            }

            let hitBrick = false;
            bricks = bricks.map(brick => { // Zpracování kolizí s cihlami
                if (brick.status === 1 && !hitBrick) {
                    if (x + BALL_RADIUS > brick.x && x - BALL_RADIUS < brick.x + brick.width && 
                        y + BALL_RADIUS > brick.y && y - BALL_RADIUS < brick.y + brick.height) {
                        
                        dy = -dy;
                        hitBrick = true;
                        bricksChanged = true;
                        
                        const newHealth = brick.health - 1;
                        if (newHealth <= 0) { // Cihla je zničena
                            score += Math.ceil(10 * scoreMultiplier * brick.maxHealth);
                            if (powerUpsEnabled && Math.random() < DROP_CHANCE) {
                                const rand = Math.random();
                                let type = rand > 0.8 ? 'MULTIBALL' : (rand > 0.5 ? 'LIFE' : 'WIDE');
                                powerUps.push({ x: brick.x + brick.width/2 - POWERUP_SIZE/2, y: brick.y, type });
                            }
                            return { ...brick, health: 0, status: 0 };
                        } else {
                            score += Math.ceil(2 * scoreMultiplier);
                            return { ...brick, health: newHealth };
                        }
                    }
                }
                return brick;
            });

            if (y + dy <= GAME_HEIGHT - BALL_RADIUS) survivingBalls.push({ ...ball, x, y, dx, dy });
        });

        if (survivingBalls.length === 0) { // Žádné přeživší koule - ztráta života
            lives--;
            paddleWidth = state.paddleWidthDefault; 
            if (lives <= 0) newGameOver = true;
            else {
                const resetState = resetPositions({ ...state, paddleWidth });
                return { ...resetState, score, lives, bricks, powerUps: [] };
            }
        }

        let activePowerUps = [];
        if (powerUps) { // Zpracování power-upů
            powerUps.forEach(p => {
                p.y += POWERUP_SPEED;
                let consumed = false;
                if (p.y + POWERUP_SIZE >= GAME_HEIGHT - PADDLE_HEIGHT && p.y <= GAME_HEIGHT &&
                    p.x + POWERUP_SIZE >= paddleX && p.x <= paddleX + paddleWidth) {
                    consumed = true;
                    if (p.type === 'LIFE') lives++;
                    else if (p.type === 'WIDE') {
                        paddleWidth = PADDLE_WIDTH_EXPANDED;
                        if (paddleX + paddleWidth > GAME_WIDTH) paddleX = GAME_WIDTH - paddleWidth;
                    } else if (p.type === 'MULTIBALL') {
                        survivingBalls.push(createBall(paddleX + paddleWidth/2, GAME_HEIGHT - PADDLE_HEIGHT - 30, baseSpeed * (Math.random()>0.5?1.5:-1.5), -baseSpeed, true));
                    }
                }
                if (!consumed && p.y < GAME_HEIGHT) activePowerUps.push(p);
            });
        }

        if (score > highScore) highScore = score;

        const activeBricksCount = bricks.filter(b => b.status === 1).length;
        
        if (activeBricksCount === 0 && !newGameOver) { // Všechny cihly zničeny - přechod na další podúroveň nebo svět
            subLevelIndex++; 
            if (subLevelIndex >= LEVELS[worldIndex].length) { // Přechod na další svět
                worldIndex++; 
                subLevelIndex = 0; 
                if (worldIndex > maxUnlockedWorld) {
                    maxUnlockedWorld = worldIndex;
                }
            }

            if (worldIndex >= LEVELS.length) { // Všechny světy dokončeny - výhra
                newGameWon = true;
                worldIndex = LEVELS.length - 1; 
                subLevelIndex = LEVELS[worldIndex].length - 1; 
            } else { // Inicializace nové podúrovně
                nextInitialState = resetPositions({
                    ...state,
                    score, highScore, lives,
                    worldIndex, subLevelIndex, maxUnlockedWorld,
                    paddleWidth, 
                    bricks: initBricks(worldIndex, subLevelIndex),
                    balls: [],
                    powerUps: []
                });
            }
        }

        if (nextInitialState) return nextInitialState;

        return { // Aktualizovaný herní stav
            ...state,
            balls: survivingBalls, paddleX, paddleWidth, bricks: bricksChanged ? bricks : state.bricks,
            powerUps: activePowerUps, score, lives, highScore, gameOver: newGameOver, gameWon: newGameWon, powerUpsEnabled,
            worldIndex, subLevelIndex, maxUnlockedWorld
        };
    },
};