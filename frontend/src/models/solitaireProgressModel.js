/*
Model for saving/loading solitaire progress
Author: Jaroslav Mervart
*/
import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000",
});

export const SolitaireProgressModel = {
    async load() {
        try {
            const res = await API.get("/api/solitaire/state");
            return res.data?.state || null;
        } catch (err) {
            console.error("Failed to load solitaire state:", err);
            return null;
        }
    },

    async save(state) {
        try {
            await API.post("/api/solitaire/save", { state });
            return true;
        } catch (err) {
            console.error("Failed to save solitaire state:", err);
            throw err;
        }
    },
};
