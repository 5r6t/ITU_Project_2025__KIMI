/*
Model for settings actions (e.g. progress reset)
Author: Jaroslav Mervart
*/
import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000",
});

export const SettingsModel = {
    async resetAchievements() {
        const res = await API.post("/reset_achievements");
        return res.data;
    },

    async resetPinballRecord() {
        const res = await API.post("/api/v1/pinball/reset_record");
        return res.data;
    },

    async clearBreakerSave() {
        await API.delete("/api/breaker/state");
        return { success: true };
    },

    async resetWallball() {
        const res = await API.post("/api/v1/wallball/reset_all");
        return res.data;
    }
};
