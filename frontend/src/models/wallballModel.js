import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api/v1",
});

export const WallballModel = {
    async getProgress() {
        try {
            const res = await API.get("/wallball/progress");
            return res.data; 
        } catch (error) {
            console.error("Chyba progresu:", error);
            return { max_unlocked_level: 1 };
        }
    },

    async completeLevel(levelId) {
        try {
            const res = await API.post("/wallball/complete_level", { level_id: levelId });
            return res.data;
        } catch (error) {
            return { success: false };
        }
    },

    // --- NOVÉ METODY ---

    // Načte rozmístění dílků pro daný level
    async getLevelState(levelId) {
        try {
            const res = await API.get(`/wallball/level_state/${levelId}`);
            return res.data.pieces || [];
        } catch (error) {
            console.error("Chyba načítání level state:", error);
            return [];
        }
    },

    // Uloží dílek
    async placePiece(levelId, type, col, row) {
        await API.post("/wallball/place_piece", { level_id: levelId, type, col, row });
    },

    // Odstraní dílek
    async removePiece(levelId, col, row) {
        await API.post("/wallball/remove_piece", { level_id: levelId, col, row });
    },

    // Vymaže všechny dílky (při kompletním resetu)
    async resetLevelState(levelId) {
        await API.post("/wallball/reset_level", { level_id: levelId });
    }
};