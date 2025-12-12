// EXAMPLE
import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000",
});

export const PizzaModel = {
    loadLocalToppings() {
        try {
            const raw = localStorage.getItem("pizza_toppings");
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    saveLocalToppings(toppings) {
        localStorage.setItem("pizza_toppings", JSON.stringify(toppings));
    },

    async sendPreview(toppings) {
        const res = await API.post("/pizza/preview", { toppings });
        return res.data; // axios gives .data directly
    },

    async savePizza(payload) {
        const res = await API.post("/pizza/save", payload);
        return res.data;
    }
};
