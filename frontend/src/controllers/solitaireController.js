import { SolitaireModel } from "../models/solitaireModel";
import { SolitaireProgressModel } from "../models/solitaireProgressModel";

export function createSolitaireController(setUiState) {
    const model = new SolitaireModel();
    let selection = null;
    let status = "Tap the deck to draw a card.";
    let foundationSlots = [null, null, null, null]; // suit assigned by first Ace placed
    let dirty = false;
    let saveStatus = { state: "idle", message: "" };
    let saving = false;

    const publish = () => {
        setUiState({
            ...model.getState(),
            selection,
            status,
            foundationSlots,
            saveStatus,
        });
    };

    const clearSelection = () => {
        selection = null;
    };

    const markDirty = () => {
        dirty = true;
    };

    const dropOnTableau = (pileIndex, payload = selection) => {
        if (!payload) return false;
        let moved = false;
        if (payload.source === "waste") {
            moved = model.moveWasteToTableau(pileIndex);
        } else if (payload.source === "tableau") {
            moved = model.moveTableauStack(payload.pileIndex, payload.cardIndex, pileIndex);
        }
        if (moved) {
            clearSelection();
            markDirty();
        }
        return moved;
    };

    const getPayloadCard = (payload) => {
        if (!payload) return null;
        if (payload.source === "waste") {
            return model.getWasteTop();
        }
        if (payload.source === "tableau") {
            const pile = model.tableau[payload.pileIndex] || [];
            return pile[payload.cardIndex] || null;
        }
        return null;
    };

    const dropOnFoundation = (payload, slotIndex) => {
        if (!payload) return false;
        const card = getPayloadCard(payload);
        if (!card) return false;

        let targetSuit = foundationSlots[slotIndex];
        if (!targetSuit) {
            if (card.rank !== "A") return false; // first card must be Ace to claim slot
            targetSuit = card.suit;
        }
        if (targetSuit !== card.suit) return false;

        let moved = false;
        if (payload.source === "waste") {
            moved = model.moveWasteToFoundation(targetSuit);
        } else if (payload.source === "tableau") {
            const pile = model.tableau[payload.pileIndex] || [];
            const isTop = payload.cardIndex === pile.length - 1;
            if (isTop) {
                moved = model.moveTableauToFoundation(payload.pileIndex, targetSuit);
            }
        }
        if (moved) {
            foundationSlots[slotIndex] = targetSuit;
            clearSelection();
            markDirty();
        }
        return moved;
    };

    const snapshot = () => {
        const base = model.getSnapshot();
        return { ...base, foundationSlots: [...foundationSlots] };
    };

    const setSaveStatus = (state, message = "") => {
        saveStatus = { state, message };
        publish();
    };

    return {
        init: async () => {
            let loaded = false;
            try {
                const saved = await SolitaireProgressModel.load();
                if (saved) {
                    model.loadSnapshot(saved);
                    foundationSlots = saved.foundationSlots || [null, null, null, null];
                    selection = null;
                    status = "Loaded saved game.";
                    saveStatus = { state: "saved", message: "Loaded" };
                    dirty = false;
                    loaded = true;
                }
            } catch (err) {
                console.error("Failed to load saved solitaire:", err);
            }
            if (!loaded) {
                model.reset();
                foundationSlots = [null, null, null, null];
                selection = null;
                status = "New deal ready.";
                saveStatus = { state: "idle", message: "" };
                dirty = true;
            }
            publish();
        },

        reset: () => {
            model.reset();
            foundationSlots = [null, null, null, null];
            selection = null;
            status = "Deck reshuffled.";
            dirty = true;
            saveStatus = { state: "idle", message: "" };
            publish();
        },

        drawFromStock: () => {
            const hadCards = model.stock.length > 0;
            const recycled = !hadCards && model.waste.length > 0;
            const drawn = model.drawFromStock();
            clearSelection();
            if (!drawn) {
                status = "No cards to draw.";
                publish();
                return;
            }
            status = recycled ? "Recycled waste into stock." : "Drew a card.";
            markDirty();
            publish();
        },

        handleWasteClick: () => {
            const hasWaste = model.waste.length > 0;
            if (!hasWaste) return;
            if (selection && selection.source === "waste") {
                clearSelection();
            } else {
                selection = { source: "waste", cardIndex: model.waste.length - 1 };
                status = "Selected waste card.";
            }
            publish();
        },

        handleFoundationClick: (slotIndex) => {
            if (selection) {
                const moved = dropOnFoundation(selection, slotIndex);
                status = moved ? "Moved to foundation." : "Can't place that card there.";
                publish();
                return;
            }
            const autoMoved = dropOnFoundation({ source: "waste" }, slotIndex);
            status = autoMoved ? "Waste card moved to foundation." : "Select a card first.";
            publish();
        },

        handleTableauClick: (pileIndex, cardIndex) => {
            const pile = model.tableau[pileIndex] || [];
            const hasCard = Number.isInteger(cardIndex) && cardIndex < pile.length;
            if (!hasCard) {
                if (!selection) return;
                const moved = dropOnTableau(pileIndex);
                status = moved ? "Placed card." : "Can't place that card there.";
                publish();
                return;
            }

            const card = pile[cardIndex];
            if (!card.faceUp) {
                const isTop = cardIndex === pile.length - 1;
                if (isTop) {
                    pile[cardIndex] = { ...card, faceUp: true };
                    clearSelection();
                    status = "Turned a card face up.";
                    markDirty();
                    publish();
                }
                return;
            }

            const clickedIsSelected =
                selection &&
                selection.source === "tableau" &&
                selection.pileIndex === pileIndex &&
                selection.cardIndex === cardIndex;

            if (clickedIsSelected) {
                clearSelection();
                publish();
                return;
            }

            if (selection) {
                const moved = dropOnTableau(pileIndex);
                status = moved ? "Placed card." : "Can't place that card there.";
                if (!moved) {
                    selection = { source: "tableau", pileIndex, cardIndex };
                }
                publish();
                return;
            }

            selection = { source: "tableau", pileIndex, cardIndex };
            status = "Card selected.";
            publish();
        },

        beginDragFromWaste: () => {
            const top = model.getWasteTop();
            if (!top) return null;
            selection = { source: "waste", cardIndex: model.waste.length - 1 };
            status = "Dragging waste card.";
            publish();
            return { source: "waste" };
        },

        beginDragFromTableau: (pileIndex, cardIndex) => {
            const pile = model.tableau[pileIndex] || [];
            const card = pile[cardIndex];
            if (!card || !card.faceUp) return null;
            selection = { source: "tableau", pileIndex, cardIndex };
            status = "Dragging card stack.";
            publish();
            return { source: "tableau", pileIndex, cardIndex };
        },

        handleDropOnTableau: (payload, pileIndex) => {
            const moved = dropOnTableau(pileIndex, payload);
            status = moved ? "Placed card." : "Can't place that card there.";
            publish();
            return moved;
        },

        handleDropOnFoundation: (payload, slotIndex) => {
            const moved = dropOnFoundation(payload, slotIndex);
            status = moved ? "Moved to foundation." : "Can't place that card there.";
            publish();
            return moved;
        },

        clearSelection: () => {
            clearSelection();
            publish();
        },

        manualSave: async () => {
            if (saving) return;
            saving = true;
            setSaveStatus("saving", "Saving...");
            try {
                await SolitaireProgressModel.save(snapshot());
                dirty = false;
                setSaveStatus("saved", "Saved");
            } catch (err) {
                setSaveStatus("error", "Save failed");
            } finally {
                saving = false;
            }
        },

        autoSave: async () => {
            if (saving || !dirty) return;
            saving = true;
            setSaveStatus("saving", "Autosaving...");
            try {
                await SolitaireProgressModel.save(snapshot());
                dirty = false;
                setSaveStatus("saved", "Autosaved");
            } catch (err) {
                setSaveStatus("error", "Autosave failed");
            } finally {
                saving = false;
            }
        },
    };
}
