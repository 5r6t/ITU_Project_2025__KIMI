/*
Inventory Component: PizzaBaking.jsx
Author: Šimon Dufek
*/
import { useState, useEffect } from "react";
import axios from "axios";
import './styles/Inventory.css'; 

function ItemCard({ item, onUseItem }) {
    // Rozpoznání, zda jde o pizzu (má toppingy)
    const isPizza = item.toppings && item.toppings.length > 0;
    
    // Získání hezčího názvu
    const displayName = item.display_name || (item.name.includes(":") && !item.name.includes("://") 
        ? item.name.split(':')[0] 
        : item.name);

    // Logika pro text efektů
    let effectText = "";
    
    // 1. Hardcoded efekty pro základní předměty
    if (item.name === "Cheese") effectText = "Hunger +20, Clean -5";
    else if (item.name === "Soap") effectText = "Clean +30";
    else if (item.name === "Energy Drink") effectText = "Energy +40, Clean -5";
    
    // 2. Dynamické efekty pro PIZZU (pokud přišly ze serveru)
    else if (isPizza && item.effects) {
        const parts = [];
        // Hlad
        if (item.effects.hunger) {
            parts.push(`Hunger ${item.effects.hunger > 0 ? '+' : ''}${item.effects.hunger}`);
        }
        // Čistota
        if (item.effects.clean) {
            parts.push(`Clean ${item.effects.clean > 0 ? '+' : ''}${item.effects.clean}`);
        }
        // Energy
        if (item.effects.energy) {
            parts.push(`Energy ${item.effects.energy > 0 ? '+' : ''}${item.effects.energy}`);
        }
        
        effectText = parts.length > 0 ? parts.join(", ") : "No effect";
    } 
    // 3. Fallback
    else {
        effectText = "Unknown effect";
    }

    return (
        <div className="inventory-item-card">
            {isPizza ? (
                <div className="pizza-preview-container">
                    <div 
                        className="pizza-mini-base" 
                        style={{ background: item.pizza_color || '#ffbd38' }}
                    >
                        {item.toppings.map((t, idx) => (
                            <span 
                                key={`${t.type}-${idx}`} 
                                className="mini-topping"
                                style={{
                                    left: `${t.x}%`, 
                                    top: `${t.y}%`,
                                    transform: `translate(-50%, -50%) scale(0.6)` 
                                }}
                            >
                                {t.emoji}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="item-icon-placeholder">
                    {item.name === "Soap" ? "🧼" : 
                     item.name === "Cheese" ? "🧀" : 
                     item.name === "Energy Drink" ? "⚡" : "📦"}
                </div>
            )}

            <div className="item-info">
                <span className="item-name">
                    {displayName} 
                    {item.quantity > 1 && <span className="item-qty"> x{item.quantity}</span>}
                </span>
                {/* Zde se vypisují efekty */}
                <span className="effect-text">{effectText}</span>
            </div>

            <button 
                className="use-button" 
                onClick={() => onUseItem(item.name)} 
                disabled={item.quantity <= 0}
            >
                Use
            </button>
        </div>
    );
}

// Hlavní komponenta Inventory
export default function Inventory({ isOpen, onClose, onUpdateKimiState, isEmbedded = false }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen || isEmbedded) {
            loadInventory();
        }
    }, [isOpen, isEmbedded]);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://127.0.0.1:5000/inventory");
            // Backend nyní vrací { items: [ ... ] }, kde itemy už mají 'toppings' a 'pizza_color'
            setInventory(res.data.items || []); 
        } catch (error) {
            console.error("Chyba při načítání inventáře:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUseItem = async (itemName) => {
        try {
            const res = await axios.post(`http://127.0.0.1:5000/use_item/${itemName}`);
            if (onUpdateKimiState) {
                onUpdateKimiState(res.data);
            }
            // Po použití znovu načteme inventář (pro aktualizaci počtů)
            loadInventory();
        } catch (error) {
            console.error("Chyba při použití položky:", error);
            const serverMessage = error.response?.data?.message || "Neznámá chyba";
            alert(`Nelze použít: ${serverMessage}`);
        }
    };

    const panelClass = isEmbedded 
        ? "inventory-embedded" 
        : (isOpen ? "inventory-panel open" : "inventory-panel");

    if (!isOpen && !isEmbedded) return null;

    return (
        <div className={panelClass}>
            <div className="panel-header">
                <h2>Inventory</h2>
                {!isEmbedded && (
                    <button className="close-button" onClick={onClose}>&times;</button>
                )}
            </div>
            
            <div className="panel-content">
                {loading ? (
                    <p className="loading-text">Loading...</p>
                ) : (
                    inventory.length > 0 ? (
                        <div className="inventory-grid">
                            {inventory.map((item, index) => (
                                <ItemCard 
                                    // Použijeme index jako fallback klíče, kdyby chybělo ID
                                    key={item.id || index} 
                                    item={item} 
                                    onUseItem={handleUseItem} 
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="empty-text">Inventory is empty.</p>
                    )
                )}
            </div>
        </div>
    );
}