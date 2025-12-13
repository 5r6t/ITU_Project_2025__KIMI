import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { useNavigate } from "react-router-dom";

import Header from "./meta_components/Header";
import StatusBar from "./meta_components/StatusBar";
import Inventory from "./Inventory"; // Importujeme Inventory
import { Scene } from "./meta_components/Scene";

import { createKimiController } from "./controllers/kimiController";
import { createPinballController } from "./controllers/pinballController";
import { createSceneController } from "./controllers/sceneController";

import { useAchievements } from "./meta_components/AchievementContext";
import trophy from "./assets/trophy.svg";
import './styles/App.css';

export default function App() {

  const { completeAchievement } = useAchievements();

  // ODSTRANĚNO: const [showInventory, setShowInventory] = useState(false);
  const [extensionCatcher, setExtensionCatcher] = useState(false);

  const [kimi, setKimi] = useState({ hunger: 0, clean: 0, energy: 0 });

  const ctrl = createKimiController(setKimi);
  const pinball = createPinballController(setExtensionCatcher);

  // ODSTRANĚNO: const toggleInventory ...

  const handleClose = () => {
    console.log("Can't close the app!");
  };
  useEffect(() => {
    ctrl.load();
    pinball.load();
  }, []);

  const navigate = useNavigate();
  const sceneCtrl = createSceneController({
    navigate,
    kimiCtrl: ctrl,
  });

  return (
    <div className="page">
      <Header title="Kimi" onClose={handleClose}>
        <Link to="/achievements"><img src={trophy} alt=""></img></Link>
      </Header>

      <div className="app-container">

        <div className="scene card">
          <Scene controller={sceneCtrl} />

          <button onClick={() => ctrl.feed()}> Feed Kimi 🍗 </button>
          <button onClick={() => ctrl.clean()}> Clean Kimi 🧼 </button>
          <button onClick={() => { ctrl.sleep(); completeAchievement(5); }} > Make Kimi sleep 💤</button>
          <button onClick={() => ctrl.exercise()}> Make Kimi exercise ⚡</button>
          <div className="Games">
            {/* ... odkazy na hry zůstávají stejné ... */}
            <Link to="/pinball"><button>Spustit Pinball 🎮</button></Link>
            <Link to="/wallball" style={{ marginLeft: 8 }}><button>Spustit Wallball 🧱</button></Link>
            <Link to="/breaker" style={{ marginLeft: 8 }}><button>Brick Breaker 🔨</button></Link>
            <Link to="/pizza" style={{ marginLeft: 8 }}><button>Decorate Pizza 🍕</button></Link>
            <button style={{ marginLeft: "10px" }} onClick={() => pinball.toggle(extensionCatcher)}>
              Catcher
            </button>
            <span style={{ margin: "10px" }}>
              Stav: <b>{extensionCatcher ? "Zapnuto" : "Vypnuto"}</b>
            </span>
            <Link to="/solitaire"><button>Play Solitaire</button></Link>
          </div>
        </div>
        
        <div className="stats card">
          <StatusBar label="🍗 Hunger"  value={kimi.hunger} color="#4FA3FF" />
          <StatusBar label="🧼 Clean"   value={kimi.clean} color="#6FD6B6" />
          <StatusBar label="💤 Energy"  value={kimi.energy} color="#B58CFF" />
        </div>

        <div className="inventory card">
            <Inventory
              isOpen={true} // Vždy otevřeno (načte data při mountu)
              onClose={() => {}} // Není potřeba
              onUpdateKimiState={setKimi}
              isEmbedded={true} // Zapne embedded styl
            />
        </div>
      </div>
    </div>
  );
}