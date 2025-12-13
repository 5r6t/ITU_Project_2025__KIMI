import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Důležité: Import axiosu pro komunikaci s API

import Header from "./meta_components/Header";
import StatusBar from "./meta_components/StatusBar";
import Inventory from "./Inventory"; 
import { Scene } from "./meta_components/Scene";

import { createKimiController } from "./controllers/kimiController";
import { createPinballController } from "./controllers/pinballController";
import { createSceneController } from "./controllers/sceneController";

//import { useAchievements } from "./meta_components/AchievementContext";
import trophy from "./assets/trophy.svg";
import './styles/App.css';

export default function App() {

  //const { completeAchievement } = useAchievements();

  // Stav pro Pinball Catcher
  const [extensionCatcher, setExtensionCatcher] = useState(false);
  
  // NOVÉ: Stav pro Breaker Power-ups
  const [breakerPowerups, setBreakerPowerups] = useState(false);

  const [kimi, setKimi] = useState({ hunger: 0, clean: 0, energy: 0 });

  const ctrl = createKimiController(setKimi);
  const pinball = createPinballController(setExtensionCatcher);

  const handleClose = () => {
    console.log("Can't close the app!");
  };

  useEffect(() => {
    ctrl.load();
    pinball.load();

    // NOVÉ: Načtení nastavení Breaker power-upů při startu aplikace
    axios.get("http://127.0.0.1:5000/api/breaker/powerups")
         .then(res => {
             // Nastavíme stav podle toho, co vrátí databáze
             setBreakerPowerups(res.data.powerups_enabled);
         })
         .catch(err => console.error("Failed to load breaker settings:", err));
  }, []);

  // NOVÉ: Funkce pro přepínání power-upů a uložení na server
  const toggleBreakerPowerups = () => {
      const newState = !breakerPowerups;
      setBreakerPowerups(newState); // Okamžitá vizuální změna
      
      // Odeslání změny na server
      axios.post("http://127.0.0.1:5000/api/breaker/powerups", { enabled: newState })
           .catch(err => {
               console.error("Failed to save breaker settings:", err);
               // V případě chyby vrátíme přepínač zpět
               setBreakerPowerups(!newState);
           });
  };

  const navigate = useNavigate();
  const sceneCtrl = createSceneController({
    navigate,
    kimiCtrl: ctrl,
  });

  const sceneCarouselItems = [
    { label: "Pinball", onClick: () => navigate("/pinball") },
    { label: "Wallball", onClick: () => navigate("/wallball") },
    { label: "Brick Breaker", onClick: () => navigate("/breaker") },
    { label: "Solitaire", onClick: () => navigate("/solitaire") },
  ];

  return (
    <div className="page">
      <Header title="Kimi" onClose={handleClose}>
        <Link to="/achievements"><img src={trophy} alt=""></img></Link>
      </Header>

      <div className="app-container">

        <div className="scene card">
          <Scene controller={sceneCtrl} carouselItems={sceneCarouselItems} />

          <div className="Games">
            
            {/* Sekce pro Brick Breaker */}
            <div style={{ display: "inline-block", marginLeft: 8 }}>
                {/* Tlačítko pro ovládání bonusů */}
                <button 
                    style={{ marginLeft: "5px", fontSize: "0.8rem", padding: "5px 10px" }} 
                    onClick={toggleBreakerPowerups}
                    title="Zapnout/Vypnout padající bonusy ve hře"
                >
                   Bonusy pre Brick Breaker: <b>{breakerPowerups ? "ZAP" : "VYP"}</b>
                </button>
            </div>

            
            <div style={{ display: "inline-block", marginLeft: 10 }}>
                <button onClick={() => pinball.toggle(extensionCatcher)}>
                Catcher
                </button>
                <span style={{ marginLeft: "5px", color: "white" }}>
                <b>{extensionCatcher ? "ON" : "OFF"}</b>
                </span>
            </div>
            
          </div>
        </div>
        
        <div className="stats card">
          <StatusBar label="🍗 Hunger"  value={kimi.hunger} color="#4FA3FF" />
          <StatusBar label="🧼 Clean"   value={kimi.clean} color="#6FD6B6" />
          <StatusBar label="💤 Energy"  value={kimi.energy} color="#B58CFF" />
        </div>

        <div className="inventory card">
            <Inventory
              isOpen={true} 
              onClose={() => {}} 
              onUpdateKimiState={setKimi}
              isEmbedded={true} 
            />
        </div>
      </div>
    </div>
  );
}
