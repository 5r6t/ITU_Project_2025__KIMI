/*
Controller handling display of completed achievement notifications
and loading achievements
Author: Jaroslav Mervart
*/
import { AchievementModel } from "../models/achievementModel";

export function createAchievementController({ setPopup, onUpdate }) {
    return {
        completeAchievement: async (id, newProgress = 100) => {
            try {
                const data = await AchievementModel.update(id, newProgress);

                if (data.newly_completed) {
                    setPopup(`🏅 ${data.name}`);
                    onUpdate?.();
                }               

                return data;
            } catch (err) {
                console.error("Achievement update failed:", err);
            }
        },

        loadList: async () => {
            try {
                return await AchievementModel.loadList();
            } catch (err) {
                console.error("Failed to load achievements:", err);
                return { unlocked: [], locked: [] };
            }
        }
    };
}
