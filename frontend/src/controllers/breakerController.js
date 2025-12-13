import { BreakerModel } from "../models/breakerModel";

export function createBreakerController(setGameState) {
    let animationFrameId;
    let leftPressed = false;
    let rightPressed = false;
    
    // Zámek, abychom neposílali save requesty opakovaně (v každém framu po konci hry)
    let scoreSaved = false;

    const gameLoop = () => {
        setGameState((prevState) => {
            if (!prevState) return prevState;

            // 1. Zpracování vstupu
            let nextState = prevState;
            if (leftPressed) {
                nextState = BreakerModel.movePaddle(nextState, 'left');
            } else if (rightPressed) {
                nextState = BreakerModel.movePaddle(nextState, 'right');
            }

            // 2. Fyzika
            nextState = BreakerModel.updatePhysics(nextState);

            // 3. Detekce konce hry a uložení dat
            if ((nextState.gameOver || nextState.gameWon) && !scoreSaved) {
                scoreSaved = true; // Zabráníme opakovanému ukládání
                
                // Fire & Forget volání na server (nečekáme na výsledek, aby se nezasekla hra)
                BreakerModel.saveScoreServer(nextState.score).then(newHigh => {
                    if (newHigh !== null) {
                        // Pokud server vrátil nové high score, můžeme aktualizovat state
                        // (Pozor: je třeba opatrně s asynchronním setState uvnitř loopu, 
                        // ale zde to nevadí, protože hra už stojí)
                        setGameState(s => ({ ...s, highScore: newHigh }));
                    }
                });
            }

            return nextState;
        });

        animationFrameId = requestAnimationFrame(gameLoop);
    };

    return {
        // Init je nyní ASYNC
        init: async () => {
            scoreSaved = false; // Reset zámku
            
            // 1. Nejprve nastavíme lokální hru, aby uživatel nečekal na loading
            setGameState(BreakerModel.initGameLocal());

            // 2. Na pozadí načteme high score ze serveru
            const serverHighScore = await BreakerModel.fetchStats();
            
            // 3. Aktualizujeme state o načtené high score
            setGameState(prev => {
                if (!prev) return prev;
                return { ...prev, highScore: serverHighScore };
            });

            // 4. Spustíme smyčku
            gameLoop();
        },

        handleKeyDown: (e) => {
            if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") {
                rightPressed = true;
            } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") {
                leftPressed = true;
            }
        },

        handleKeyUp: (e) => {
            if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") {
                rightPressed = false;
            } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") {
                leftPressed = false;
            } else if (e.code === "Space" || e.key === " ") {
                setGameState(prev => {
                    if (!prev) return prev;
                    return BreakerModel.launchBall(prev);
                });
            }
        },

        restart: () => {
            scoreSaved = false; // Reset zámku pro novou hru
            // Při restartu chceme zachovat aktuální high score (které už máme v paměti)
            // tak ho vytáhneme ze state, nebo znovu fetchneme. 
            // Jednodušší je zavolat initLocal a nechat fetch proběhnout znovu (pro jistotu).
            
            setGameState(prev => {
                const newState = BreakerModel.initGameLocal();
                // Pokusíme se zachovat high score z předchozího stavu, aby neblikalo 0
                if (prev) newState.highScore = prev.highScore;
                return newState;
            });
            
            // Pro jistotu aktualizujeme ze serveru znovu
            BreakerModel.fetchStats().then(serverHighScore => {
                 setGameState(prev => ({ ...prev, highScore: serverHighScore }));
            });
        },

        cleanup: () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        }
    };
}