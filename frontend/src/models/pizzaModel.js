// EXAMPLE
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
        return fetch("http://127.0.0.1:5000/pizza/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ toppings })
        }).then(r => r.json());
    },

    async savePizza(payload) {
        return fetch("http://127.0.0.1:5000/pizza/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(r => r.json());
    }
};
