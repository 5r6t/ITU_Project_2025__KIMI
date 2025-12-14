/*
Zdrojový kód modelu hry Pinball.
Author: Pavel Hýža
*/
import axios from "axios";

// Vytvoření instance Axiosu s nastavenou základní URL pro API
const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api/v1",
});

export const PinballModel = {
    // Načte kompletní stav hráče (skóre, rekord, peníze, zakoupené předměty)
    async getState() {
        try {
            const res = await API.get("/pinball/state");
            return res.data; 
        } catch (error) {
            console.error("Error fetching state:", error);
            return { score: 0, record: 0, money: 0, items: [] };
        }
    },

    // Odešle získané body na server (voláno dávkově z controlleru)
    async sendHit(points) {
        try {
            const res = await API.post("/pinball/hit", { points });
            return res.data; // Vrací aktualizované { score, record, money }
        } catch (error) {
            console.error("Hit sync failed:", error);
            throw error; // Vyhodíme chybu dál, aby controller věděl, že synchronizace selhala
        }
    },

    // Oznámí serveru, že míček spadl (konec kola) -> server vyhodnotí rekord a resetuje skóre
    async ballLost() {
        try {
            const res = await API.post("/pinball/ball_lost");
            return res.data; // Vrací nový stav { score: 0, record: ..., money: ... }
        } catch (error) {
            console.error("Ball lost sync failed:", error);
            return null;
        }
    },

    // Debug funkce pro přidání peněz (Cheat)
    async cheatMoney() {
        const res = await API.post("/pinball/cheat_money");
        return res.data; // Vrací { money: ... }
    },

    // Zakoupí a umístí nový předmět na herní plochu
    async placeItem(type, x, y, price) {
        try {
            const res = await API.post("/pinball/place_item", { type, x, y, price });
            return res.data; // Vrací { success: true, money: ..., item: ... }
        } catch (error) {
            console.error("Purchase failed:", error);
            return null;
        }
    },

    // Aktualizuje pozici již zakoupeného předmětu
    async moveItem(itemId, x, y) {
        const res = await API.post("/pinball/move_item", { item_id: itemId, x, y });
        return res.data;
    },

    // Odstraní předmět a vrátí část peněz
    async removeItem(itemId, price) {
        const res = await API.post("/pinball/remove_item", { item_id: itemId, price });
        return res.data; // Vrací { success: true, money: ... }
    }
};