import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Inventory from "./assets/Inventory"; // Import nového komponentu

export default function App() {
  const [state, setState] = useState({ hunger: 0, clean: 0, energy: 0 });
  const [showInventory, setShowInventory] = useState(false); // Nový stav

  // Funkce pro aktualizaci stavu Poua (Použije se po krmení/použití položky)
  const updatePouState = (newState) => {
    setState(newState);
  };
    
  const loadState = async () => {
    const res = await axios.get("http://127.0.0.1:5000/state");
    updatePouState(res.data);
  };

  const feedPou = async () => {
    const res = await axios.post("http://127.0.0.1:5000/feed");
    updatePouState(res.data); // Použijeme novou funkci
  };

  const openInventory = () => setShowInventory(true);
  const closeInventory = () => setShowInventory(false);

  useEffect(() => { loadState(); }, []);

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
      
      {/* 2.11. jednoduchá „navigace“ */}
      <div style={{ marginBottom: 16 }}>
        {/*<Link to="/pinball">
          <button style={{ padding: "8px 14px", fontSize: 14 }}>
            Spustit Pinball 🎮
          </button>
        </Link>*/}
        {/* Tlačítko pro otevření inventáře */}
        <button 
          onClick={openInventory} 
          style={{ padding: "8px 14px", fontSize: 14, marginLeft: 10 }}>
          Inventář 🧀
        </button>
      </div>
      {/* 2.11. konec */}
      
      <h1>Pou Mini Demo</h1>
      <p>🍗 Hunger: {state.hunger}</p>
      <p>🧼 Clean: {state.clean}</p>
      <p>💤 Energy: {state.energy}</p>
      <button onClick={feedPou}>Feed Pou 🍗</button>
      
      {/* Podmíněné vykreslení komponentu Inventory */}
      {showInventory && (
        <Inventory 
          onClose={closeInventory} 
          onUpdatePouState={updatePouState} // Předáme funkci pro aktualizaci stavu Poua
        />
      )}
    </div>
  );
}