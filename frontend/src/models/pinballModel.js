export const PinballModel = {
    // Loading extension catcher setting
    async getExtensionCatcher() {
        const res = await fetch("http://127.0.0.1:5000/api/v1/pinball/extension_catcher");
        return res.json();
    },

    async setExtensionCatcher(enabled) {
        const res = await fetch(
            "http://127.0.0.1:5000/api/v1/pinball/extension_catcher",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled }),
            }
        );
        return res.json();
    }
};