import { PinballModel } from "../models/pinballModel";

export function createPinballController(setScore, setRecord, setMoney, setIsPlaying, setIsPaused) {
    return {
        // Načtení dat při startu (peníze, rekord)
        init: async () => {
            try {
                const data = await PinballModel.getState(); // Předpokládám, že backend vrátí { record, money }
                setRecord(data.record || 0);
                setMoney(data.money || 0);
            } catch (err) {
                console.error("Failed to load Pinball state", err);
            }
        },

        // Spuštění hry (vypuštění míčku)
        startGame: () => {
            setIsPlaying(true);
            setIsPaused(false);
            setScore(0);
            // Zde později přidáme logiku pro fyzické vytvoření míčku
        },

        // Pauza (zmrazení času)
        togglePause: (currentState) => {
            setIsPaused(!currentState);
        },

        // Konec hry (uložení skóre a peněz)
        gameOver: async (finalScore, currentMoney) => {
            setIsPlaying(false);
            const earnings = finalScore; // 1 bod = 1 peníz (zatím)
            const newTotalMoney = currentMoney + earnings;
            
            setMoney(newTotalMoney);
            // Zde by se volalo API pro uložení
            // await PinballModel.saveState({ score: finalScore, money: newTotalMoney });
        }
    };
}