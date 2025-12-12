import { WallballModel } from "../models/wallballModel";
import { LEVELS } from "../wallball_levels";

export function createWallballController(setLevel, setMaxUnlockedLevel, setDifficulty, setDescription) {
    return {
        // 1. Inicializace při startu aplikace
        init: async () => {
            try {
                // Získáme postup z backendu
                const data = await WallballModel.getProgress();
                const maxUnlocked = data.max_unlocked_level || 1;
                
                // Nastavíme stav odemčení (to je pro menu - tam chceme vidět, že jsme "za koncem")
                setMaxUnlockedLevel(maxUnlocked);
                
                // --- FIX: Určení levelu pro načtení ---
                // Zkontrolujeme, zda level 'maxUnlocked' existuje v naší konfiguraci.
                const levelExists = LEVELS.find(l => l.id === maxUnlocked);
                
                if (levelExists) {
                    // Pokud existuje (hráč je uprostřed hry), vrátíme ho
                    return maxUnlocked;
                } else {
                    // Pokud neexistuje (hráč hru dohrál a maxUnlocked je např. 3, zatímco máme jen 2 levely),
                    // najdeme level s nejvyšším ID (poslední level) a načteme ten.
                    if (LEVELS.length > 0) {
                        const lastLevel = LEVELS.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                        return lastLevel.id;
                    }
                    return 1; // Fallback, kdyby nebyly žádné levely
                }
            } catch (err) {
                console.error("Chyba při inicializaci Wallball controlleru:", err);
                setMaxUnlockedLevel(1);
                return 1;
            }
        },

        // 2. Přepnutí na konkrétní level
        loadLevel: (levelId) => {
            const levelConfig = LEVELS.find(l => l.id === levelId);

            if (levelConfig) {
                setLevel(levelConfig.id);
                setDifficulty(levelConfig.difficulty);
                if (setDescription && levelConfig.description) {
                    setDescription(levelConfig.description);
                }
                return levelConfig;
            } else {
                console.warn(`Level ${levelId} neexistuje.`);
                return null;
            }
        },

        // 3. Logika při úspěšném dostání míčku do cíle
        levelCompleted: async (levelId) => {
            try {
                const result = await WallballModel.completeLevel(levelId);
                
                if (result.success || result.next_level_unlocked) {
                    setMaxUnlockedLevel(prev => Math.max(prev, levelId + 1));
                    return true;
                }
            } catch (err) {
                console.error("Chyba při ukládání postupu:", err);
            }
            return false;
        }
    };
}