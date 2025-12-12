import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api/v1",
});

export const PinballModel = {
    async getExtensionCatcher() {
        const res = await API.get("/pinball/extension_catcher");
        return res.data; // { extension_catcher: true/false }
    },

    async setExtensionCatcher(enabled) {
        const res = await API.post("/pinball/extension_catcher", { enabled });
        return res.data;
    }
};
