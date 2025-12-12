import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000",
});

export const AchievementModel = {
    async update(id, newProgress = 100) {
        const res = await API.post(`/update_achievement/${id}/${newProgress}`);
        return res.data; // backend already returns JSON
    },

    async loadList() {
        const res = await API.get("/get_achievements");
        return res.data;
    }
};
