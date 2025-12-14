/*
Controller for managing Kimi
Author: Jaroslav Mervart
*/
import { KimiModel } from "../models/kimiModel";
import { withMood } from "../models/kimiMoodModel";

export function createKimiController(setState) {
    const applyState = (data) => setState(withMood(data));

    return {
        load: async () => applyState(await KimiModel.load()),
        feed: async () => applyState(await KimiModel.feed()),
        clean: async () => applyState(await KimiModel.clean()),
        sleep: async () => applyState(await KimiModel.sleep()),
        exercise: async () => applyState(await KimiModel.exercise())
    };
}
