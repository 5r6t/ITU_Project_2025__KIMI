import { BreakerModel } from "../models/breakerModel";

export function createBreakerController(setGameState) {
    // ... (zbytek proměnných: animationFrameId, throttling atd. zůstává stejný) ...
    let animationFrameId;
    let leftPressed = false;
    let rightPressed = false;
    let scoreSaved = false;
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 1000;

    const gameLoop = () => {
        // ... (stejný kód gameLoop jako v předchozím kroku) ...
        setGameState((prevState) => {
            if (!prevState) return prevState;

            let nextState = prevState;
            if (leftPressed) nextState = BreakerModel.movePaddle(nextState, 'left');
            else if (rightPressed) nextState = BreakerModel.movePaddle(nextState, 'right');

            nextState = BreakerModel.updatePhysics(nextState);

            // Progress check
            if (nextState.maxUnlockedWorld > prevState.maxUnlockedWorld) {
                BreakerModel.saveProgress(nextState.maxUnlockedWorld);
            }

            // Save Score & Clear State on End
            if ((nextState.gameOver || nextState.gameWon) && !scoreSaved) {
                scoreSaved = true; 
                BreakerModel.saveScoreServer(nextState.score).then(newHigh => {
                    if (newHigh !== null) {
                        setGameState(s => ({ ...s, highScore: newHigh }));
                    }
                });
                BreakerModel.clearGameState();
            }

            // Auto-save
            if (nextState.gameStarted && !nextState.gameOver && !nextState.gameWon) {
                const now = Date.now();
                if (now - lastSaveTime > SAVE_INTERVAL) {
                    BreakerModel.saveGameState(nextState);
                    lastSaveTime = now;
                }
            }
            return nextState;
        });
        animationFrameId = requestAnimationFrame(gameLoop);
    };

    return {
        // ... (init, startGame, handleKeyDown, handleKeyUp, restart, cleanup zůstávají stejné) ...
        
        init: async () => {
             // ... (kód init z předchozího kroku) ...
            scoreSaved = false; 
            const savedState = await BreakerModel.loadGameState();
            const [serverHighScore, settingsEnabled, serverProgress] = await Promise.all([
                BreakerModel.fetchStats(),
                BreakerModel.fetchSettings(),
                BreakerModel.fetchProgress()
            ]);

            if (savedState) {
                setGameState({
                    ...savedState,
                    highScore: serverHighScore,
                    maxUnlockedWorld: Math.max(savedState.maxUnlockedWorld || 0, serverProgress)
                });
            } else {
                let startState = BreakerModel.initGameLocal('NORMAL', 0, serverProgress); 
                startState.gameStarted = false; 
                setGameState({ 
                    ...startState, 
                    highScore: serverHighScore,
                    powerUpsEnabled: settingsEnabled,
                    maxUnlockedWorld: serverProgress
                });
            }
            gameLoop();
        },

        startGame: (difficulty, worldIndex = 0) => {
            // ... (stejný kód startGame) ...
             setGameState(prev => {
                 const unlocked = prev ? prev.maxUnlockedWorld : 0;
                 BreakerModel.clearGameState();
                 const newState = BreakerModel.initGameLocal(difficulty, worldIndex, unlocked);
                 
                 // DŮLEŽITÉ: Přenášíme nastavení powerupů z menu do hry
                 newState.powerUpsEnabled = prev.powerUpsEnabled; 
                 
                 newState.highScore = prev.highScore;
                 newState.gameStarted = true;
                 BreakerModel.saveGameState(newState);
                 return newState;
             });
             scoreSaved = false;
        },

        handleKeyDown: (e) => {
            if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") rightPressed = true;
            else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") leftPressed = true;
        },

        handleKeyUp: (e) => {
            if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") rightPressed = false;
            else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") leftPressed = false;
            else if (e.code === "Space" || e.key === " ") {
                setGameState(prev => {
                    if (!prev || !prev.gameStarted) return prev; 
                    const newState = BreakerModel.launchBall(prev);
                    BreakerModel.saveGameState(newState);
                    return newState;
                });
            }
        },

        restart: () => {
             // ... (stejný kód restart) ...
            scoreSaved = false;
            BreakerModel.clearGameState();
            setGameState(prev => {
                const currentDiff = prev.difficulty || 'NORMAL';
                const currentWorld = prev.worldIndex || 0;
                const unlocked = prev.maxUnlockedWorld || 0;
                const newState = BreakerModel.initGameLocal(currentDiff, currentWorld, unlocked);
                newState.highScore = prev.highScore;
                newState.powerUpsEnabled = prev.powerUpsEnabled;
                newState.gameStarted = true; 
                return newState;
            });
            BreakerModel.fetchStats().then(serverHighScore => {
                 setGameState(prev => ({ ...prev, highScore: serverHighScore }));
            });
        },

        cleanup: () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        },

        togglePowerups: () => {
            setGameState(prev => {
                const newValue = !prev.powerUpsEnabled;
                BreakerModel.saveSettings(newValue);
                return { ...prev, powerUpsEnabled: newValue };
            });
        }
    };
}