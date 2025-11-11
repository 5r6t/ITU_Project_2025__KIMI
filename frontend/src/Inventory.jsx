import { useState, useEffect } from "react";
import axios from "axios";
import './App.css'; 

// Pomocná komponenta pro zobrazení karty předmětu
function ItemCard({ item, onUseItem }) {
    let effectText = "";
    if (item.name === "Cheese") effectText = "Hlad +20, Čistota -5";
    else if (item.name === "Soap") effectText = "Čistota +30";
    else if (item.name === "Energy Drink") effectText = "Energie +40, Čistota -5";
    else if (item.name === "Water") effectText = "Hlad +5, Energie +5";
    else effectText = "Neznámý efekt";
    
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