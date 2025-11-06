import { useState, useEffect } from "react";
import axios from "axios";

// Základní styly pro Inventář (pro lepší oddělení by měly být v CSS)
const inventoryContainerStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: "400px",
  height: "70%",
  maxHeight: "600px",
  backgroundColor: "lightgray",
  border: "2px solid black",
  borderRadius: "10px",
  padding: "10px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
};

const itemListStyle = {
  flexGrow: 1,
  overflowY: "auto", // Klíčové pro scrollování
  padding: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px",
};

const itemCardStyle = {
  backgroundColor: "#f5e7d6", // Béžová barva
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "10px",
  textAlign: "center",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

const closeButtonStyle = {
  alignSelf: "flex-end",
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  padding: "0 5px",
};

const quantityControlsStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "5px",
};

const controlButtonStyle = {
    padding: "4px 8px",
    margin: "0 2px",
    fontSize: "12px",
    minWidth: "20px"
};

// Pomocná funkce pro mapování jména na obrázek/text
const getItemVisual = (name) => {
    if (name === "Cheese") {
        // Zde by byl skutečný tag pro obrázek sýra
        return <p style={{ margin: "5px 0" }}>🧀</p>;
    } else if (name === "Soap") {
        return <p style={{ margin: "5px 0" }}>🧼</p>;
    } else if (name === "Energy Drink") {
        return <p style={{ margin: "5px 0" }}>⚡</p>;
    }
    return <p style={{ margin: "5px 0" }}>❓</p>;
};


function ItemCard({ item, onUseItem }) {

    return (
        <div style={itemCardStyle}>
            <h4>{item.name}</h4>
            {getItemVisual(item.name)}
            <p style={{ margin: "5px 0", fontWeight: "bold" }}>{item.quantity}</p>
            <div style={quantityControlsStyle}>
                {/* Zde by měla být skutečná implementace odečítání a sčítání */}
                <button style={controlButtonStyle} onClick={() => onUseItem(item.id)}>USE</button>
            </div>
        </div>
    );
}


export default function Inventory({ onClose, onUpdatePouState }) {
  const [inventory, setInventory] = useState({ items: [] });
  
  const loadInventory = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:5000/inventory");
        setInventory(res.data);
      } catch (error) {
        console.error("Error loading inventory:", error);
      }
    };

  const handleUseItem = async (itemId) => {
      try {
          // POST požadavek na použití položky
          const res = await axios.post(`http://127.0.0.1:5000/use_item/${itemId}`);
          // Aktualizujeme stav Poua v rodičovské komponentě (App.jsx)
          onUpdatePouState(res.data);
          // Znovu načteme inventář pro aktualizaci počtů (i když teď neodečítáme)
          loadInventory();
      } catch (error) {
          console.error("Error using item:", error);
      }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <div style={inventoryContainerStyle}>
      <button onClick={onClose} style={closeButtonStyle}>
        &times;
      </button>
      <h2 style={{ textAlign: "center", margin: "0 0 10px 0" }}>Inventář 🎒</h2>
      <div style={itemListStyle}>
        {inventory.items.map((item) => (
          // Předáváme funkci pro použití položky
          <ItemCard key={item.id} item={item} onUseItem={handleUseItem} />
        ))}
      </div>
    </div>
  );
}