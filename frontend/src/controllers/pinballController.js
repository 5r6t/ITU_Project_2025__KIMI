import { PinballModel } from "../models/pinballModel";

// 1. ZMĚNA: Přidán argument 'completeAchievement'
export function createPinballController(setScore, setRecord, setMoney, setPlacedItems, setDebugLog, completeAchievement) {
    let pendingPoints = 0;
    let syncTimer = null;

    const log = (msg) => {
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
            
            // Kontrola při startu (kdyby už to měl splněné z minula)
            if ((data.money || 0) >= 50) completeAchievement(5, data.money);
            if ((data.record || 0) >= 100) completeAchievement(6, data.record);
        },

        handleHit: (points) => {
            // Získáme aktuální hodnoty pomocí callbacku setScore/setMoney, 
            // ale tady uvnitř closure nemáme přímý přístup k aktuální hodnotě state, 
            // pokud ji nepředáme. 
            // Pro zjednodušení budeme předpokládat, že React state update vyřešíme,
            // ale pro Achievementy si musíme držet přibližnou hodnotu nebo to střelit "naslepo".
            // Lepší varianta:
            
            setScore(prev => {
                const newScore = prev + points;
                // 2. ZMĚNA: Kontrola Rekordu (ID 6)
                if (newScore >= 100) completeAchievement(6, newScore); 
                return newScore;
            });

            setMoney(prev => {
                const newMoney = prev + points;
                // 3. ZMĚNA: Kontrola Peněz (ID 6)
                if (newMoney >= 50) completeAchievement(5, newMoney);
                return newMoney;
            });

            pendingPoints += points;
            if (!syncTimer) {
                syncTimer = setTimeout(() => { flushHits(); syncTimer = null; }, 1000);
            }
        },

        handleBallLost: async () => {
            log("Ball Lost!");
            if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
            await flushHits();

            const data = await PinballModel.ballLost();
            if (data) {
                log(`New Record: ${data.record}`);
                setRecord(data.record);
                setMoney(data.money);
                setScore(0);
                
                // Pojistka: Kontrola rekordu i po uložení na server
                if (data.record >= 100) completeAchievement(6, data.record);
            }
        },

        cheatMoney: async () => {
            log("Cheating money...");
            const res = await PinballModel.cheatMoney();
            if (res) {
                setMoney(res.money);
                if (res.money >= 50) completeAchievement(5, res.money);
            }
        },

        buyItem: async (type, x, y, price) => {
            await flushHits();
            const res = await PinballModel.placeItem(type, x, y, price);
            if (res && res.success) {
                setMoney(res.money);
                setPlacedItems(prev => [...prev, res.item]);
                
                // 4. ZMĚNA: Splnění "Builder" (ID 7)
                completeAchievement(7, 1); 
                
                return true;
            }
            return false;
        },

        moveItem: async (id, x, y) => {
            await PinballModel.moveItem(id, x, y);
            setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
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