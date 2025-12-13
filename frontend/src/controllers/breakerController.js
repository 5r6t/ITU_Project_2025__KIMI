import { BreakerModel } from "../models/breakerModel";

export function createBreakerController(setGameState) {
    let animationFrameId;
    let leftPressed = false;
    let rightPressed = false;
    let scoreSaved = false;

    const gameLoop = () => {
        setGameState((prevState) => {
            if (!prevState) return prevState;

            let nextState = prevState;
            if (leftPressed) nextState = BreakerModel.movePaddle(nextState, 'left');
            else if (rightPressed) nextState = BreakerModel.movePaddle(nextState, 'right');

            nextState = BreakerModel.updatePhysics(nextState);

            // --- DETEKCE ODEMČENÍ NOVÉHO SVĚTA ---
            if (nextState.maxUnlockedWorld > prevState.maxUnlockedWorld) {
                BreakerModel.saveProgress(nextState.maxUnlockedWorld);
            }

            // Uložení skóre při konci
            if ((nextState.gameOver || nextState.gameWon) && !scoreSaved) {
                scoreSaved = true; 
                BreakerModel.saveScoreServer(nextState.score).then(newHigh => {
                    if (newHigh !== null) {
                        setGameState(s => ({ ...s, highScore: newHigh }));
                    }
                });
            }

            return nextState;
        });

        animationFrameId = requestAnimationFrame(gameLoop);
    };

    return {
        init: async () => {
            scoreSaved = false; 
            
            let startState = BreakerModel.initGameLocal('NORMAL', 0, 0); 
            startState.gameStarted = false; 

            setGameState(startState);

            // Načítáme HighScore, Nastavení A PROGRESS
            const [serverHighScore, settingsEnabled, serverProgress] = await Promise.all([
                BreakerModel.fetchStats(),
                BreakerModel.fetchSettings(),
                BreakerModel.fetchProgress()
            ]);
            
            setGameState(prev => {
                if (!prev) return prev;
                return { 
                    ...prev, 
                    highScore: serverHighScore,
                    powerUpsEnabled: settingsEnabled,
                    maxUnlockedWorld: serverProgress // Uložíme do state
                };
            });

            gameLoop();
        },

        startGame: (difficulty, worldIndex = 0) => {
             setGameState(prev => {
                 const unlocked = prev ? prev.maxUnlockedWorld : 0;
                 
                 const newState = BreakerModel.initGameLocal(difficulty, worldIndex, unlocked);
                 
                 newState.highScore = prev.highScore;
                 newState.powerUpsEnabled = prev.powerUpsEnabled;
                 newState.gameStarted = true;
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
                    return BreakerModel.launchBall(prev);
                });
            }
        },

        restart: () => {
            scoreSaved = false;
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