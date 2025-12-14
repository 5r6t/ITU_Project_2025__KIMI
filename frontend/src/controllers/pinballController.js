import { PinballModel } from "../models/pinballModel";

export function createPinballController(setScore, setRecord, setMoney, setPlacedItems, setIsPlaying, setIsPaused, setDebugLog) {
    // Lokální proměnné pro dávkování požadavků (uzávěr)
    let pendingPoints = 0;
    let syncTimer = null;

    // Pomocná funkce pro logování (pokud existuje setDebugLog)
    const log = (msg) => {
        console.log("[PinballCtrl]", msg);
        if (setDebugLog) setDebugLog(prev => [msg, ...prev].slice(0, 5)); // Posledních 5 zpráv
    };

    // Funkce, která pošle nahromaděné body na server
    const flushHits = async () => {
        if (pendingPoints === 0) return;
        
        const pointsToSend = pendingPoints;
        pendingPoints = 0; // Okamžitý reset, aby se nové body sbíraly do další várky

        try {
            log(`Syncing ${pointsToSend} pts...`);
            await PinballModel.sendHit(pointsToSend);
        } catch (e) {
            console.error("Sync failed", e);
            log("Sync ERROR!");
            // V reálné appce bychom body vrátili zpět do pendingPoints, 
            // ale pro jednoduchost to necháme být (optimistické UI už je má).
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

        startGame: () => {
            setIsPlaying(true);
            setIsPaused(false);
            setScore(0);
            log("Game Started");
        },

        togglePause: (currentState) => {
            setIsPaused(!currentState);
        },

        gameOver: async (finalScore, currentMoney) => {
            setIsPlaying(false);
            // Pro jistotu na konci hry synchronizujeme
            await flushHits();
            const data = await PinballModel.getState();
            setMoney(data.money);
        },

        // --- UPRAVENO: Dávkování hitů ---
        handleHit: (points) => {
            // 1. UI update (okamžitě)
            setScore(prev => prev + points);
            setMoney(prev => prev + points);

            // 2. Přidat do fronty
            pendingPoints += points;

            // 3. Pokud neběží časovač, spustíme ho (odešle data za 1 sekundu)
            if (!syncTimer) {
                syncTimer = setTimeout(() => {
                    flushHits();
                    syncTimer = null;
                }, 1000);
            }
        },

        // --- UPRAVENO: Bezpečná ztráta míčku ---
        handleBallLost: async () => {
            log("Ball Lost!");
            
            // 1. Zrušíme čekající časovač a okamžitě odešleme vše, co máme
            if (syncTimer) {
                clearTimeout(syncTimer);
                syncTimer = null;
            }
            await flushHits(); // Počkáme, až server potvrdí přijetí bodů

            // 2. Teprve teď řekneme serveru "Míček spadl, zapiš rekord"
            // Díky tomu už má server správné (vysoké) skóre
            const data = await PinballModel.ballLost();
            
            if (data) {
                log(`New Record: ${data.record}`);
                setRecord(data.record);
                setMoney(data.money); // Server vrátí správné peníze
                setScore(0);
            } else {
                log("BallLost req failed");
            }
        },

        cheatMoney: async () => {
            log("Cheating money...");
            const res = await PinballModel.cheatMoney();
            if (res) {
                setMoney(res.money);
                log(`Money: ${res.money}`);
            }
        },

        buyItem: async (type, x, y, price) => {
            // Před nákupem pro jistotu odešleme vše, co máme
            await flushHits();

            log(`Buying ${type}...`);
            const res = await PinballModel.placeItem(type, x, y, price);
            if (res && res.success) {
                setMoney(res.money);
                setPlacedItems(prev => [...prev, res.item]);
                log("Bought OK");
                return true;
            }
            log("Buy Failed (No money?)");
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