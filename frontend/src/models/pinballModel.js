import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api/v1",
});

export const PinballModel = {
    // Načte kompletní stav (score, money, items)
    async getState() {
        try {
            const res = await API.get("/pinball/state");
            return res.data; 
        } catch (error) {
            console.error("Error fetching state:", error);
            return { score: 0, record: 0, money: 0, items: [] };
        }
    },

    // Odeslat zásah (hit) s body
    async sendHit(points) {
        try {
            const res = await API.post("/pinball/hit", { points });
            return res.data; // { score, record, money }
        } catch (error) {
            console.error("Hit sync failed:", error);
            throw error; // Důležité: Vyhodíme chybu dál, aby controller věděl, že se to nepovedlo
        }
    },

    // Míček spadl -> Zkontrolovat rekord a resetovat skóre v DB
    async ballLost() {
        try {
            const res = await API.post("/pinball/ball_lost");
            return res.data; // { score: 0, record: ..., money: ... }
        } catch (error) {
            console.error("Ball lost sync failed:", error);
            return null;
        }
    },

    // Cheat na peníze
    async cheatMoney() {
        const res = await API.post("/pinball/cheat_money");
        return res.data; // { money: ... }
    },

    // Koupit a umístit předmět
    async placeItem(type, x, y, price) {
        try {
            const res = await API.post("/pinball/place_item", { type, x, y, price });
            return res.data; // { success: true, money: ..., item: ... }
        } catch (error) {
            console.error("Purchase failed:", error);
            return null;
        }
    },

    // Přesunout předmět
    async moveItem(itemId, x, y) {
        const res = await API.post("/pinball/move_item", { item_id: itemId, x, y });
        return res.data;
    },

    // Odstranit předmět (prodat)
    async removeItem(itemId, price) {
        const res = await API.post("/pinball/remove_item", { item_id: itemId, price });
        return res.data; // { success: true, money: ... }
    }
};