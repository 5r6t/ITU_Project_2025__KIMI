import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // 2.11. Přidání odkazu na Pinball stránku

import Header from "./meta_components/Header";
import StatusBar from "./meta_components/StatusBar";
import Inventory from "./Inventory";

import { createKimiController } from "./controllers/kimiController";
import { createPinballController } from "./controllers/pinballController";

import { useAchievements } from "./meta_components/AchievementContext";

import './App.css';

export default function App() {

  const { completeAch } = useAchievements();

  const [showInventory, setShowInventory]       = useState(false);
  const [extensionCatcher, setExtensionCatcher] = useState(false);

  const [kimi, setKimi] = useState({ hunger: 0, clean: 0, energy: 0 });

  const ctrl = createKimiController(setKimi);
  const pinball = createPinballController(setExtensionCatcher);

  const toggleInventory = () => {
    setShowInventory(prev => !prev);
  }

  const handleClose = () => {
    console.log("Can't close the app!");
  };

  useEffect(() => {
    ctrl.load();
    pinball.load();
  }, []);

  return (
    <div>
      <div>
        <Header title="Kimi Demo" onClose={handleClose} />
      </div>
      <div className="app-container">
        <Inventory isOpen={showInventory} onClose={toggleInventory}/>

        <div>
          <Link to="/pinball">
            <button>
              Spustit Pinball 🎮
            </button>
          </Link>
          <Link to="/pizza" style={{ marginLeft: 8 }}>
            <button>
              Decorate Pizza 🍕
            </button>
          </Link>
        </div>
        <div style={{ marginTop: "8px" }}>
          <button onClick={() => pinball.toggle(extensionCatcher)}>
            Catcher
          </button>
          <span style={{ marginLeft: "10px" }}>
            Stav: <b>{extensionCatcher ? "Zapnuto" : "Vypnuto"}</b>
          </span>
        </div>

        <div>
          <Link to="/achievements"><button>Achievements 🏅</button></Link>
        </div>

        <div>
          <Link to="/solitaire"><button>Play Solitaire</button></Link>
        </div>

        <button onClick={toggleInventory}> Inventory 🎒 </button>

        <button onClick={() => ctrl.feed()}> Feed Kimi 🍗 </button>
        <button onClick={() => ctrl.clean()}> Clean Kimi 🧼 </button>
        <button onClick={() => { ctrl.sleep(); completeAch(5); }} > Make Kimi sleep 💤</button>
        <button onClick={() => ctrl.exercise()}> Make Kimi exercise ⚡</button>

        <StatusBar label="🍗 Hunger" value={kimi.hunger} color="#D02121" />
        <StatusBar label="🧼 Clean" value={kimi.clean} color="#59E817" />
        <StatusBar label="💤 Energy" value={kimi.energy} color="#EFE826" />
      </div>
    </div>
  );
}
