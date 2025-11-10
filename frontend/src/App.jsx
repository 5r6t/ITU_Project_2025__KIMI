import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // 2.11. Přidání odkazu na Pinball stránku
import axios from "axios";
import './App.css';
import Inventory from "./Inventory";

import StatusBar from "./StatusBar";
import Header from "./meta_components/Header";

export default function App() {
  const [state, setState] = useState({ hunger: 0, clean: 0, energy: 0 });
  const [showInventory, setShowInventory] = useState(false);

  const updateKimiState = (newState) => {
      setState(newState);
  }

  const toggleInventory = () => {
    setShowInventory(prev => !prev);
  }

  const loadState = async () => {
    const res = await axios.get("http://127.0.0.1:5000/state");
    setState(res.data);
  };

  const feedKimi = async () => {
    const res = await axios.post("http://127.0.0.1:5000/feed");
    setState(res.data);
  };

  const cleanKimi = async () => {
    const res = await axios.post("http://127.0.0.1:5000/clean");
    setState(res.data);
  };

  const energizeKimi = async () => {
    const res = await axios.post("http://127.0.0.1:5000/sleep");
    setState(res.data);
  };

  const exerciseKimi = async () => {
    const res = await axios.post("http://127.0.0.1:5000/exercise");
    setState(res.data);
  };

  const handleClose = () => {
    console.log("Header closed!");
    // navigate away, hide modal, etc.
  };

  useEffect(() => { loadState(); }, []);

  return (  
    
    <div className="app-container">
      <Inventory 
          isOpen={showInventory}           // Předáme stav pro řízení CSS třídy
          onClose={toggleInventory}       // Zavře panel
          onUpdateKimiState={updateKimiState} // Aktualizuje stav Kimiho
      />

      <div>
        <Header title="Kimi Demo" onClose={handleClose} />
      </div>
      
      <div className="app-container">
      <h1>Kimi Demo</h1>
      {/* 2.11. jednoduchá „navigace“ */}
      <div>
        
        <Link to="/pinball">
          <button>
            Spustit Pinball 🎮
          </button>
        </Link>
      </div>

      <div>
          <Link to="/achievements">
          <button>Check out your achievements</button>
        </Link>
      </div>

        <div>
          <Link to="/solitaire">
            <button>Play Solitaire</button>
          </Link>
        </div>

        <button onClick={toggleInventory}>
          Inventory 🎒
        </button>

        <button onClick={cleanKimi}>
          Clean Kimi 🧼
        </button>

        <button onClick={energizeKimi}>
          Make Kimi sleep 💤
        </button>

        <button onClick={exerciseKimi}>
          Make Kimi exercise ⚡
        </button>

        <StatusBar label="🍗 Hunger" value={state.hunger} color="#D02121" />
        <StatusBar label="🧼 Clean"  value={state.clean}  color="#59E817" />
        <StatusBar label="💤 Energy" value={state.energy} color="#EFE826" />
        </div>
      </div>
  );
}
