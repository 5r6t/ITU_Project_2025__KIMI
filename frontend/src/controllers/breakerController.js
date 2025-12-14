import { BreakerModel } from "../models/breakerModel";

export function createBreakerController(setGameState) {
    let animationFrameId;
    let leftPressed = false;
    let rightPressed = false;
    let scoreSaved = false;

    // Proměnné pro auto-save throttling
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 1000; // Ukládat max jednou za sekundu

    const gameLoop = () => {
        setGameState((prevState) => {
            if (!prevState) return prevState;

            let nextState = prevState;
            if (leftPressed) nextState = BreakerModel.movePaddle(nextState, 'left');
            else if (rightPressed) nextState = BreakerModel.movePaddle(nextState, 'right');

            nextState = BreakerModel.updatePhysics(nextState);

            // --- PROGRESS LOGIKA ---
            if (nextState.maxUnlockedWorld > prevState.maxUnlockedWorld) {
                BreakerModel.saveProgress(nextState.maxUnlockedWorld);
            }

            // Uložení skóre při konci + SMAZÁNÍ STAVU
            if ((nextState.gameOver || nextState.gameWon) && !scoreSaved) {
                scoreSaved = true; 
                BreakerModel.saveScoreServer(nextState.score).then(newHigh => {
                    if (newHigh !== null) {
                        setGameState(s => ({ ...s, highScore: newHigh }));
                    }
                });
                // Hra skončila, nemá smysl držet "rozehranou" pozici
                BreakerModel.clearGameState();
            }

            // --- AUTO-SAVE LOGIKA ---
            // Ukládáme jen pokud hra běží a není konec
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
        init: async () => {
            scoreSaved = false; 

            // 1. Zkusíme načíst uloženou hru z DB
            const savedState = await BreakerModel.loadGameState();

            // 2. Načteme globální data
            const [serverHighScore, settingsEnabled, serverProgress] = await Promise.all([
                BreakerModel.fetchStats(),
                BreakerModel.fetchSettings(),
                BreakerModel.fetchProgress()
            ]);

            if (savedState) {
                // Obnovení uložené hry
                setGameState({
                    ...savedState,
                    highScore: serverHighScore, // Aktualizujeme pro jistotu
                    // Zajistíme, že odemčené světy odpovídají maximu (kdyby se DB někde rozjelo)
                    maxUnlockedWorld: Math.max(savedState.maxUnlockedWorld || 0, serverProgress)
                });
            } else {
                // Nová hra
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
             setGameState(prev => {
                 const unlocked = prev ? prev.maxUnlockedWorld : 0;
                 
                 // Při startu nové hry přes menu explicitně mažeme starý save
                 BreakerModel.clearGameState();

                 const newState = BreakerModel.initGameLocal(difficulty, worldIndex, unlocked);
                 
                 newState.highScore = prev.highScore;
                 newState.powerUpsEnabled = prev.powerUpsEnabled;
                 newState.gameStarted = true;
                 
                 // Ihned uložíme
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
                    // Uložení při odpálení míčku (dobrý UX bod)
                    BreakerModel.saveGameState(newState);
                    return newState;
                });
            }
        },

        restart: () => {
            scoreSaved = false;
            // Restart = smazat starý save
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
        }
    };
}