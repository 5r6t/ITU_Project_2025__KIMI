import { WallballModel } from "../models/wallballModel";
import { LEVELS } from "../wallball_levels";

// Přidali jsme setPlacedPieces, abychom mohli aktualizovat UI po načtení z DB
export function createWallballController(setLevel, setMaxUnlockedLevel, setDifficulty, setDescription, setPlacedPieces) {
    
    // Helper pro převod DB dat na formát pro Wallball.jsx (musíme přidat fake bodyId, aby to React vykreslil, než to Matter.js převezme)
    const processLoadedPieces = (pieces) => {
        return pieces.map((p, index) => ({
            ...p,
            bodyId: `temp-${index}` // Dočasné ID, Wallball.jsx si vytvoří fyzické těleso a ID přepíše
        }));
    };

    return {
        init: async () => {
            try {
                const data = await WallballModel.getProgress();
                const maxUnlocked = data.max_unlocked_level || 1;
                setMaxUnlockedLevel(maxUnlocked);
                
                // Určení levelu (stejná logika jako minule)
                let levelToLoad = maxUnlocked;
                const levelExists = LEVELS.find(l => l.id === maxUnlocked);
                if (!levelExists && LEVELS.length > 0) {
                     levelToLoad = LEVELS.reduce((prev, current) => (prev.id > current.id) ? prev : current).id;
                } else if (!levelExists) {
                    levelToLoad = 1;
                }
                
                return levelToLoad;
            } catch (err) {
                console.error("Init error:", err);
                return 1;
            }
        },

        loadLevel: async (levelId) => {
            const levelConfig = LEVELS.find(l => l.id === levelId);

            if (levelConfig) {
                setLevel(levelConfig.id);
                setDifficulty(levelConfig.difficulty);
                if (setDescription && levelConfig.description) {
                    setDescription(levelConfig.description);
                }

                // --- NOVÉ: Načtení uložených dílků z DB ---
                const savedPieces = await WallballModel.getLevelState(levelId);
                // Nastavíme do React state
                if (setPlacedPieces) {
                    setPlacedPieces(processLoadedPieces(savedPieces));
                }

                return levelConfig;
            }
            return null;
        },

        // Voláno při Dropu
        placePiece: async (levelId, type, col, row) => {
            await WallballModel.placePiece(levelId, type, col, row);
        },

        // Voláno při pravém kliku
        removePiece: async (levelId, col, row) => {
            await WallballModel.removePiece(levelId, col, row);
        },

        // Voláno při resetu
        resetLevel: async (levelId) => {
            await WallballModel.resetLevelState(levelId);
        },

        levelCompleted: async (levelId) => {
            const result = await WallballModel.completeLevel(levelId);
            if (result.success) {
                // Po dokončení levelu ho můžeme vyčistit (volitelné), 
                // nebo nechat tak, jak je. Zde ho vyčistíme pro příště.
                await WallballModel.resetLevelState(levelId);
                
                setMaxUnlockedLevel(prev => Math.max(prev, result.max_unlocked_level));
                return true;
            }
            return false;
        }
    };
}