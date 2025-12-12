import { KimiModel } from "../models/kimiModel";

export function createKimiController(setState) {
    return {
        load: async () => setState(await KimiModel.load()),
        feed: async () => setState(await KimiModel.feed()),
        clean: async () => setState(await KimiModel.clean()),
        sleep: async () => setState(await KimiModel.sleep()),
        exercise: async () => setState(await KimiModel.exercise())
    };
}
