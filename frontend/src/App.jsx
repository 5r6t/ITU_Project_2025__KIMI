import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // 2.11. Přidání odkazu na Pinball stránku

import Header from "./meta_components/Header";
import StatusBar from "./meta_components/StatusBar";
import Inventory from "./Inventory";

import { createKimiController } from "./controllers/kimiController";
import { createPinballController } from "./controllers/pinballController";

import { useAchievements } from "./meta_components/AchievementContext";
import trophy from "./assets/trophy.svg";
import './styles/App.css';

export default function App() {

  const { completeAchievement } = useAchievements();

  const [showInventory, setShowInventory] = useState(false);
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
    <div className="page">
      <Header title="Kimi" onClose={handleClose}>
        <Link to="/achievements"><img src={trophy} alt=""></img></Link>
      </Header>

      <div className="app-container">

        <div className="left_large_scene?">
          <button onClick={() => ctrl.feed()}> Feed Kimi 🍗 </button>
          <button onClick={() => ctrl.clean()}> Clean Kimi 🧼 </button>
          <button onClick={() => { ctrl.sleep(); completeAchievement(5); }} > Make Kimi sleep 💤</button>
          <button onClick={() => ctrl.exercise()}> Make Kimi exercise ⚡</button>
          <div className="Games">
            <Link to="/pinball">
              <button>
                Spustit Pinball 🎮
              </button>
            </Link>
            <Link to="/wallball" style={{ marginLeft: 8 }}>
              <button>
                Spustit Wallball 🧱
              </button>
            </Link>
            <Link to="/pizza" style={{ marginLeft: 8 }}>
              <button>
                Decorate Pizza 🍕
              </button>
            </Link>
            <button style={{ marginLeft: "10px" }} onClick={() => pinball.toggle(extensionCatcher)}>
              Catcher
            </button>
            <span style={{ margin: "10px" }}>
              Stav: <b>{extensionCatcher ? "Zapnuto" : "Vypnuto"}</b>
            </span>
            <Link to="/solitaire"><button>Play Solitaire</button></Link>
          </div>
        </div>
        
        <div className="right_top_kimi_stats?">
          <StatusBar label="🍗 Hunger" value={kimi.hunger} color="#D02121" />
          <StatusBar label="🧼 Clean" value={kimi.clean} color="#59E817" />
          <StatusBar label="💤 Energy" value={kimi.energy} color="#EFE826" />
        </div>
        <div className="right_bottom_inventory?">
          <button onClick={toggleInventory}> Inventory 🎒 </button>

        </div>

        <Inventory
          isOpen={showInventory}
          onClose={toggleInventory}
          onUpdateKimiState={setKimi}
        />

        

      </div>
    </div>
  );
}
