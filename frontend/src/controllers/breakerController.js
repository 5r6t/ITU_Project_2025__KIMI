/*
Controller Component: Breaker.jsx
Author: Šimon Dufek
*/
import { BreakerModel } from "../models/breakerModel";
import { AchievementModel } from "../models/achievementModel";

// ID achievementů podle pořadí v databázi (nutné upravit, pokud se ID liší)
const ACH_ROOKIE = 8;    // Skóre 500
const ACH_DESTROYER = 9; // Skóre 2000
const ACH_TRAVELER = 10; // Odemčení 3. světa
const ACH_CHAMPION = 11; // Výhra
const ACH_LEGEND = 12;   // Výhra na Hard

export function createBreakerController(setGameState) { // Vytvoření kontroleru pro Brick Breaker
    let animationFrameId;
    let leftPressed = false;
    let rightPressed = false;
    let scoreSaved = false;
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 1000;

    const checkAchievements = (state) => { // Kontrola a aktualizace achievementů
        if (!state) return;
        if (state.score >= 500) AchievementModel.update(ACH_ROOKIE, state.score);
        if (state.score >= 2000) AchievementModel.update(ACH_DESTROYER, state.score);
        if (state.maxUnlockedWorld >= 2) AchievementModel.update(ACH_TRAVELER, 1);
        if (state.gameWon) {
            AchievementModel.update(ACH_CHAMPION, 1);
            if (state.difficulty === 'HARD') {
                AchievementModel.update(ACH_LEGEND, 1);
            }
        }
    };

    const gameLoop = () => { // Hlavní herní smyčka
        setGameState((prevState) => { // Aktualizace herního stavu
            if (!prevState) return prevState;

            let nextState = prevState;
            if (leftPressed) nextState = BreakerModel.movePaddle(nextState, 'left');
            else if (rightPressed) nextState = BreakerModel.movePaddle(nextState, 'right');

            nextState = BreakerModel.updatePhysics(nextState);

            // Uložení postupu, pokud hráč odemkl nový svět
            if (nextState.maxUnlockedWorld > prevState.maxUnlockedWorld) {
                BreakerModel.saveProgress(nextState.maxUnlockedWorld);
            }

            // Uložení skóre na server, pokud je hra u konce
            if ((nextState.gameOver || nextState.gameWon) && !scoreSaved) {
                scoreSaved = true; 
                
                // KONTROLA ACHIEVEMENTŮ NA KONCI HRY
                checkAchievements(nextState);

                BreakerModel.saveScoreServer(nextState.score).then(newHigh => {
                    if (newHigh !== null) {
                        setGameState(s => ({ ...s, highScore: newHigh }));
                    }
                });
                BreakerModel.clearGameState();
            }

            // Pravidelné ukládání hry během hraní
            if (nextState.gameStarted && !nextState.gameOver && !nextState.gameWon) {
                const now = Date.now();
                if (now - lastSaveTime > SAVE_INTERVAL) {
                    BreakerModel.saveGameState(nextState);
                    checkAchievements(nextState);

                    lastSaveTime = now;
                }
            }
            return nextState;
        });
        animationFrameId = requestAnimationFrame(gameLoop);
    };

    return { 
        init: async () => { // Inicializace herního stavu při načtení aplikace
            scoreSaved = false; 
            const savedState = await BreakerModel.loadGameState();
            const [serverHighScore, settingsEnabled, serverProgress] = await Promise.all([
                BreakerModel.fetchStats(),
                BreakerModel.fetchSettings(),
                BreakerModel.fetchProgress()
            ]);

            if (savedState) { // Obnovení uloženého stavu hry
                setGameState({
                    ...savedState,
                    highScore: serverHighScore,
                    maxUnlockedWorld: Math.max(savedState.maxUnlockedWorld || 0, serverProgress)
                });
            } else { // Zahájení nové hry, pokud není uložený stav
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

        startGame: (difficulty, worldIndex = 0) => { // Zahájení nové hry s danou obtížností a světem
             setGameState(prev => { // Uložení předchozího stavu pro zachování nastavení
                 const unlocked = prev ? prev.maxUnlockedWorld : 0;
                 BreakerModel.clearGameState();
                 const newState = BreakerModel.initGameLocal(difficulty, worldIndex, unlocked);
                
                 newState.powerUpsEnabled = prev.powerUpsEnabled;  
                 newState.highScore = prev.highScore;
                 newState.gameStarted = true;
                 BreakerModel.saveGameState(newState);
                 return newState;
             });
             scoreSaved = false;
        },

        handleKeyDown: (e) => { // Zpracování stisků kláves pro pohyb pálky
            if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") rightPressed = true;
            else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") leftPressed = true;
        },

        handleKeyUp: (e) => { // Zpracování uvolnění kláves pro zastavení pálky
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

        restart: () => { // Restartování hry
            scoreSaved = false;
            BreakerModel.clearGameState();
            setGameState(prev => { // Zachování nastavení z předchozí hry
                const currentDiff = prev.difficulty || 'NORMAL';
                const currentWorld = prev.worldIndex || 0;
                const unlocked = prev.maxUnlockedWorld || 0;
                const newState = BreakerModel.initGameLocal(currentDiff, currentWorld, unlocked);
                newState.highScore = prev.highScore;
                newState.powerUpsEnabled = prev.powerUpsEnabled;
                newState.gameStarted = true; 
                return newState;
            });
            BreakerModel.fetchStats().then(serverHighScore => { // Aktualizace skóre ze serveru
                 setGameState(prev => ({ ...prev, highScore: serverHighScore }));
            });
        },

        cleanup: () => { // Vyčištění při odchodu z komponenty
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        },

        togglePowerups: () => { // Přepínání nastavení power-upů
            setGameState(prev => {
                const newValue = !prev.powerUpsEnabled;
                BreakerModel.saveSettings(newValue);
                return { ...prev, powerUpsEnabled: newValue };
            });
        }
    };
}