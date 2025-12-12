import { PinballModel } from "../models/pinballModel";

export function createPinballController(setExtensionCatcher) {
    return {
        load: async () => {
            try {
                const data = await PinballModel.getExtensionCatcher();
                setExtensionCatcher(data.extension_catcher);
            } catch (err) {
                console.error("Failed to load extension_catcher:", err);
            }
        },

        toggle: async (currentValue) => {
            try {
                const data = await PinballModel.setExtensionCatcher(!currentValue);
                setExtensionCatcher(data.extension_catcher);
            } catch (err) {
                console.error("Failed to update extension_catcher:", err);
            }
        }
    };
}
