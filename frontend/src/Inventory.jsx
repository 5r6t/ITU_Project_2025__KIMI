import { useState, useEffect } from "react";
import axios from "axios";
import './App.css'; 

// Pomocná komponenta pro zobrazení karty předmětu
function ItemCard({ item, onUseItem }) {
    const [effectText, setEffectText] = useState("");
    
    useEffect(() => {
        let text = "";
        if (item.name === "Cheese") {
            text = "Hlad +20, Čistota -5";
        } else if (item.name === "Soap") {
            text = "Čistota +30";
        } else if (item.name === "Energy Drink") {
            text = "Energie +40, Čistota -5";
        } else if (item.name === "Water") {
            text = "Hlad +5, Energie +5";
        } else if (item.name.startsWith("Pizza:")) {
            // Parsuj Pizza ID a fetchu effects z backend
            const pizzaId = item.name.split(':')[1];
            fetchPizzaEffects(pizzaId);
            return; // exit early, fetchPizzaEffects bude setovat effectText
        } else {
            text = "Neznámý efekt";
        }
        setEffectText(text);
    }, [item.name]);
    
    const fetchPizzaEffects = async (pizzaId) => {
        try {
            const res = await axios.get(`http://127.0.0.1:5000/pizza/saved`);
            const saved = res.data.saved || [];
            const pizza = saved.find(p => p.pizza_id === parseInt(pizzaId));
            
            if (pizza && pizza.pizza_data) {
                try {
                    const data = typeof pizza.pizza_data === 'string' ? JSON.parse(pizza.pizza_data) : pizza.pizza_data;
                    const effects = data.effects || {};
                    
                    // Formátuj efekty jako string
                    const parts = [];
                    if (effects.hunger) parts.push(`Hlad ${effects.hunger > 0 ? '+' : ''}${effects.hunger}`);
                    if (effects.clean) parts.push(`Čistota ${effects.clean > 0 ? '+' : ''}${effects.clean}`);
                    if (effects.energy) parts.push(`Energie ${effects.energy > 0 ? '+' : ''}${effects.energy}`);
                    
                    setEffectText(parts.length > 0 ? parts.join(", ") : "Žádné efekty");
                } catch (e) {
                    console.error("Chyba při parsování dat pizzy:", e);
                    setEffectText("Chyba při načítání efektů");
                }
            } else {
                setEffectText("Pizza nenalezena");
            }
        } catch (e) {
            console.error("Chyba při fetchu pizzy:", e);
            setEffectText("Chyba při načítání");
        }
    };
    
    const displayQuantity = item.quantity || 0; 

    return (
        <div className="inventory-item-card">
            {/* Využijeme displayQuantity pro zobrazení, i když by bylo 0 */}
            <span style={{ fontWeight: 'bold' }}>{item.name} ({displayQuantity})</span>
            <span className="effect-text">{effectText}</span>
            <button 
                className="use-button"
                onClick={() => onUseItem(item.name)}
                disabled={item.quantity <= 0}>
                Použít
            </button>
        </div>
    );
}

// Hlavní komponenta Inventory (Postranní panel)
export default function Inventory({ isOpen, onClose, onUpdateKimiState }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Načtení inventáře se provede, POUZE když je panel otevřen
    useEffect(() => {
        if (isOpen) {
            loadInventory();
        }
    }, [isOpen]);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://127.0.0.1:5000/inventory");
            setInventory(res.data.items); 
        } catch (error) {
            console.error("Chyba při načítání inventáře:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseItem = async (itemName) => {
        try {
            const res = await axios.post(`http://127.0.0.1:5000/use_item/${itemName}`);
            
            // 1. Aktualizace stavu Kimiho
            onUpdateKimiState(res.data);
            
            // 2. Znovu načtení inventáře pro aktualizaci počtů
            loadInventory();

            // Potvrzení, že staty by měly být aktualizovány
            console.log(`Předmět ${itemName} úspěšně použit. Nový stav přijat.`);

        } catch (error) {
            console.error("Chyba při použití položky:", error);
            
            // Získání konkrétní chybové zprávy ze serveru (message nebo error)
            const serverMessage = error.response?.data?.message || error.response?.data?.error;
            
            // Zobrazí konkrétní chybu, např. "Chyba DB: Selhání aktualizace stavu Kimiho."
            const errorMessage = serverMessage || "Položku nelze použít. (Neznámá chyba připojení)";
            
            alert(`CHYBA POUŽITÍ: ${errorMessage}`);
        }
    };

    // Použijeme třídu pro animaci vysouvání
    const panelClass = isOpen ? "inventory-panel open" : "inventory-panel";

    return (
        // Panel se RENDERUJE VŽDY a je řízen pomocí CSS třídy
        <div className={panelClass}>
            <div className="panel-header">
                <h2>Inventory 🎒</h2>
                <button className="close-button" onClick={onClose}>&times;</button>
            </div>
            
            <div className="panel-content">
                {loading ? (
                    <p>Načítání...</p>
                ) : (
                    inventory.length > 0 ? (
                        inventory.map((item) => (
                            <ItemCard 
                                key={item.id} 
                                item={item} 
                                onUseItem={handleUseItem} 
                            />
                        ))
                    ) : (
                        <p>Inventář je prázdný.</p>
                    )
                )}
            </div>
        </div>
    );
}