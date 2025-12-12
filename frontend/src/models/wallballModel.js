import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api/v1",
});

export const WallballModel = {
    // 1. Zjistíme, kam až se hráč dostal (např. při obnovení stránky)
    async getProgress() {
        try {
            // Backend by měl vrátit např.: { max_unlocked_level: 3 }
            const res = await API.get("/wallball/progress");
            return res.data; 
        } catch (error) {
            console.error("Nepodařilo se načíst progres, začínám od levelu 1", error);
            return { max_unlocked_level: 1 }; // Fallback
        }
    },

    // 2. Řekneme backendu, že hráč dokončil level
    async completeLevel(levelId) {
        try {
            // Backend si poznačí, že levelId je hotový a odemkne levelId + 1
            const res = await API.post("/wallball/complete_level", { level_id: levelId });
            return res.data; // { success: true, next_level_unlocked: true }
        } catch (error) {
            console.error("Chyba při ukládání postupu:", error);
            return { success: false };
        }
    }
};