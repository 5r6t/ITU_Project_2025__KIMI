import { PinballModel } from "../models/pinballModel";

export function createPinballController(setScore, setRecord, setMoney, setPlacedItems, setDebugLog) {
    // Lokální proměnné pro dávkování
    let pendingPoints = 0;
    let syncTimer = null;

    const log = (msg) => {
        // console.log("[PinballCtrl]", msg); // Volitelné
        if (setDebugLog) setDebugLog(prev => [msg, ...prev].slice(0, 5));
    };

    const flushHits = async () => {
        if (pendingPoints === 0) return;
        const pointsToSend = pendingPoints;
        pendingPoints = 0;
        try {
            await PinballModel.sendHit(pointsToSend);
        } catch (e) {
            console.error("Sync failed", e);
        }
    };

    return {
        init: async () => {
            log("Loading state...");
            const data = await PinballModel.getState();
            setRecord(data.record || 0);
            setMoney(data.money || 0);
            setPlacedItems(data.items || []);
            log(`Loaded: $${data.money || 0}`);
        },

        // --- Start/Pause/GameOver odstraněno ---

        handleHit: (points) => {
            setScore(prev => prev + points);
            setMoney(prev => prev + points);
            pendingPoints += points;

            if (!syncTimer) {
                syncTimer = setTimeout(() => {
                    flushHits();
                    syncTimer = null;
                }, 1000);
            }
        },

        handleBallLost: async () => {
            log("Ball Lost!");
            if (syncTimer) {
                clearTimeout(syncTimer);
                syncTimer = null;
            }
            await flushHits();

            const data = await PinballModel.ballLost();
            if (data) {
                log(`New Record: ${data.record}`);
                setRecord(data.record);
                setMoney(data.money);
                setScore(0);
            }
        },

        cheatMoney: async () => {
            log("Cheating money...");
            const res = await PinballModel.cheatMoney();
            if (res) setMoney(res.money);
        },

        buyItem: async (type, x, y, price) => {
            await flushHits();
            const res = await PinballModel.placeItem(type, x, y, price);
            if (res && res.success) {
                setMoney(res.money);
                setPlacedItems(prev => [...prev, res.item]);
                return true;
            }
            return false;
        },

        moveItem: async (id, x, y) => {
            await PinballModel.moveItem(id, x, y);
            setPlacedItems(prev => prev.map(item => 
                item.id === id ? { ...item, x, y } : item
            ));
        },

        sellItem: async (id, price) => {
            const res = await PinballModel.removeItem(id, price);
            if (res && res.success) {
                setMoney(res.money);
                setPlacedItems(prev => prev.filter(item => item.id !== id));
            }
        }
    };
}