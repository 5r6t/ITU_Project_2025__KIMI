/*
Zdrojový kód controlleru hry Pinball.
Author: Pavel Hýža
*/
import { PinballModel } from "../models/pinballModel";

// --- Controller pro správu logiky, stavu a komunikace s backendem ---
export function createPinballController(setScore, setRecord, setMoney, setPlacedItems, setDebugLog, completeAchievement) {
    // Lokální proměnné pro dávkování bodů (zamezení přehlcení serveru)
    let pendingPoints = 0;
    let syncTimer = null;

    // Pomocná funkce pro výpis do debug panelu ve hře
    const log = (msg) => {
        if (setDebugLog) setDebugLog(prev => [msg, ...prev].slice(0, 5));
    };

    // Odeslání nahromaděných bodů na server (Batching)
    const flushHits = async () => {
        if (pendingPoints === 0) return;
        const pointsToSend = pendingPoints;
        pendingPoints = 0; // Okamžitý reset fronty
        try {
            await PinballModel.sendHit(pointsToSend);
        } catch (e) {
            console.error("Sync failed", e);
        }
    };

    return {
        // Inicializace: Načtení uloženého stavu hry ze serveru
        init: async () => {
            log("Loading state...");
            const data = await PinballModel.getState();
            setRecord(data.record || 0);
            setMoney(data.money || 0);
            setPlacedItems(data.items || []);
            
            // Kontrola achievementů při startu (pokud byly splněny offline nebo dříve)
            if ((data.money || 0) >= 50) completeAchievement(5, data.money);
            if ((data.record || 0) >= 100) completeAchievement(6, data.record);
        },

        // Zpracování nárazu míčku (přičtení bodů)
        handleHit: (points) => {
            // 1. Optimistická aktualizace UI (okamžitá odezva)
            setScore(prev => {
                const newScore = prev + points;
                // Kontrola achievementu za skóre (ID 6)
                if (newScore >= 100) completeAchievement(6, newScore); 
                return newScore;
            });

            setMoney(prev => {
                const newMoney = prev + points;
                // Kontrola achievementu za peníze (ID 5)
                if (newMoney >= 50) completeAchievement(5, newMoney);
                return newMoney;
            });

            // 2. Přidání bodů do fronty pro odeslání
            pendingPoints += points;

            // 3. Spuštění časovače, pokud neběží (odešle data za 1s)
            if (!syncTimer) {
                syncTimer = setTimeout(() => { flushHits(); syncTimer = null; }, 1000);
            }
        },

        // Zpracování pádu míčku (Game Over kola)
        handleBallLost: async () => {
            log("Ball Lost!");
            // Zrušíme čekající časovač a okamžitě odešleme vše, co máme
            if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
            await flushHits();

            // Oznámíme serveru pád -> server vyhodnotí rekord
            const data = await PinballModel.ballLost();
            if (data) {
                log(`New Record: ${data.record}`);
                setRecord(data.record);
                setMoney(data.money); // Synchronizace peněz se serverem
                setScore(0); // Reset aktuálního skóre
                
                // Pojistka: Kontrola achievementu rekordu
                if (data.record >= 100) completeAchievement(6, data.record);
            }
        },

        // Debug funkce pro přidání peněz
        cheatMoney: async () => {
            log("Cheating money...");
            const res = await PinballModel.cheatMoney();
            if (res) {
                setMoney(res.money);
                if (res.money >= 50) completeAchievement(5, res.money);
            }
        },

        // Nákup předmětu (Drag & Drop z obchodu)
        buyItem: async (type, x, y, price) => {
            // Před nákupem synchronizujeme body, aby měl uživatel dost peněz v DB
            await flushHits();
            const res = await PinballModel.placeItem(type, x, y, price);
            
            if (res && res.success) {
                setMoney(res.money);
                setPlacedItems(prev => [...prev, res.item]);
                
                // Splnění achievementu "Builder" (ID 7)
                completeAchievement(7, 1); 
                
                return true;
            }
            return false;
        },

        // Přesun již zakoupeného předmětu
        moveItem: async (id, x, y) => {
            await PinballModel.moveItem(id, x, y);
            setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
        },

        // Prodej předmětu (pravý klik)
        sellItem: async (id, price) => {
            const res = await PinballModel.removeItem(id, price);
            if (res && res.success) {
                setMoney(res.money);
                setPlacedItems(prev => prev.filter(item => item.id !== id));
            }
        }
    };
}