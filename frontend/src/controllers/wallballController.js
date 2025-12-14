/*
Zdrojový kód controlleru hry Wallball.
Author: Pavel Hýža
*/
import { WallballModel } from "../models/wallballModel";
import { LEVELS } from "../wallball_levels";

// Konstanty pro ID achievementů (musí odpovídat databázi)
const ACH_ID_LEVEL_1 = 8;
const ACH_ID_LEVEL_2 = 9;
const ACH_ID_LEVEL_3 = 10;
const ACH_ID_LEVEL_4 = 11;
const ACH_ID_LEVEL_5 = 12;

// Controller pro logiku Wallballu, správu stavu levelů a achievementů
export function createWallballController(setLevel, setMaxUnlockedLevel, setDifficulty, setDescription, setPlacedPieces, completeAchievement) {
    
    // Pomocná funkce pro přidání dočasných ID k načteným dílkům z DB (pro React klíče)
    const processLoadedPieces = (pieces) => {
        return pieces.map((p, index) => ({
            ...p,
            bodyId: `temp-${index}`
        }));
    };

    return {
        // Inicializace: Zjistí maximální odemčený level a připraví hru
        init: async () => {
            try {
                const data = await WallballModel.getProgress();
                const maxUnlocked = data.max_unlocked_level || 1;
                setMaxUnlockedLevel(maxUnlocked);
                
                // Určení, který level se má načíst (poslední odemčený nebo 1)
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

        // Načtení konkrétního levelu (konfigurace + uložené dílky)
        loadLevel: async (levelId) => {
            const levelConfig = LEVELS.find(l => l.id === levelId);

            if (levelConfig) {
                setLevel(levelConfig.id);
                setDifficulty(levelConfig.difficulty);
                if (setDescription && levelConfig.description) {
                    setDescription(levelConfig.description);
                }

                // Načtení pozic dílků z databáze a aktualizace state
                const savedPieces = await WallballModel.getLevelState(levelId);
                if (setPlacedPieces) {
                    setPlacedPieces(processLoadedPieces(savedPieces));
                }

                return levelConfig;
            }
            return null;
        },

        // Uložení nově položeného dílku na server
        placePiece: async (levelId, type, col, row) => {
            await WallballModel.placePiece(levelId, type, col, row);
        },

        // Odstranění dílku ze serveru
        removePiece: async (levelId, col, row) => {
            await WallballModel.removePiece(levelId, col, row);
        },

        // Smazání všech dílků v daném levelu (reset)
        resetLevel: async (levelId) => {
            await WallballModel.resetLevelState(levelId);
        },

        // Logika při dokončení levelu (výhra)
        levelCompleted: async (levelId) => {
            const result = await WallballModel.completeLevel(levelId);
            
            if (result.success) {
                // Po výhře vyčistíme plochu v DB pro příští hraní
                await WallballModel.resetLevelState(levelId);
                setMaxUnlockedLevel(prev => Math.max(prev, result.max_unlocked_level));

                // Kontrola a splnění achievementů podle dokončeného levelu
                if (completeAchievement) {
                    switch (levelId) {
                        case 1: completeAchievement(ACH_ID_LEVEL_1, 1); break;
                        case 2: completeAchievement(ACH_ID_LEVEL_2, 1); break;
                        case 3: completeAchievement(ACH_ID_LEVEL_3, 1); break;
                        case 4: completeAchievement(ACH_ID_LEVEL_4, 1); break;
                        case 5: completeAchievement(ACH_ID_LEVEL_5, 1); break;
                        default: break;
                    }
                }

                return true;
            }
            return false;
        }
    };
}