/*
Zdrojový kód modelu hry Wallball.
Author: Pavel Hýža
*/
import axios from "axios";

// Vytvoření instance Axiosu s nastavenou základní URL pro API
const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api/v1",
});

export const WallballModel = {
    // Načte postup hráče (maximální odemčený level)
    async getProgress() {
        try {
            const res = await API.get("/wallball/progress");
            return res.data; 
        } catch (error) {
            console.error("Chyba progresu:", error);
            return { max_unlocked_level: 1 };
        }
    },

    // Oznámí serveru dokončení levelu (odemkne další level)
    async completeLevel(levelId) {
        try {
            const res = await API.post("/wallball/complete_level", { level_id: levelId });
            return res.data;
        } catch (error) {
            return { success: false };
        }
    },

    // Načte uložené rozmístění dílků pro konkrétní level
    async getLevelState(levelId) {
        try {
            const res = await API.get(`/wallball/level_state/${levelId}`);
            return res.data.pieces || [];
        } catch (error) {
            console.error("Chyba načítání level state:", error);
            return [];
        }
    },

    // Uloží nově umístěný dílek na server
    async placePiece(levelId, type, col, row) {
        await API.post("/wallball/place_piece", { level_id: levelId, type, col, row });
    },

    // Odstraní konkrétní dílek ze serveru
    async removePiece(levelId, col, row) {
        await API.post("/wallball/remove_piece", { level_id: levelId, col, row });
    },

    // Smaže všechny dílky v daném levelu (při resetu)
    async resetLevelState(levelId) {
        await API.post("/wallball/reset_level", { level_id: levelId });
    }
};