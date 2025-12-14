/*
Main menu for kimi
Author: Jaroslav Mervart
*/
import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { useNavigate } from "react-router-dom";
import Header from "./meta_components/Header";
import StatusBar from "./meta_components/StatusBar";
import Inventory from "./Inventory"; 
import { Scene } from "./meta_components/Scene";
import KimiStatus from "./meta_components/KimiStatus";

import { createKimiController } from "./controllers/kimiController";
import { createSceneController } from "./controllers/sceneController";
import { withMood } from "./models/kimiMoodModel";
import { BreakerModel } from "./models/breakerModel";

//import { useAchievements } from "./meta_components/AchievementContext";
import trophy from "./assets/trophy.svg";
import './styles/App.css';

export default function App() {

  //const { completeAchievement } = useAchievements();
  
  // NOVÉ: Stav pro Breaker Power-ups
  const [breakerPowerups, setBreakerPowerups] = useState(false);

  const [kimi, setKimi] = useState(() =>
    withMood({ hunger: 0, clean: 0, energy: 0 })
  );

  const ctrl = createKimiController(setKimi);

  const handleClose = () => {
    console.log("Can't close the app!");
  };

  useEffect(() => {
    ctrl.load();

    // NOVÉ: Načtení nastavení Breaker power-upů při startu aplikace
    let isMounted = true;

    BreakerModel.fetchSettings()
      .then((enabled) => {
        if (isMounted) setBreakerPowerups(Boolean(enabled));
      })
      .catch((err) => console.error("Failed to load breaker settings:", err));

    return () => { isMounted = false; };
  }, []);

  // NOVÉ: Funkce pro přepínání power-upů a uložení na server
  const toggleBreakerPowerups = async () => {
      const newState = !breakerPowerups;
      setBreakerPowerups(newState); // Okamžitá vizuální změna
      
      // Odeslání změny na server
      try {
        const savedState = await BreakerModel.saveSettings(newState);
        setBreakerPowerups(Boolean(savedState));
      } catch (err) {
        console.error("Failed to save breaker settings:", err);
        // V případě chyby vrátíme přepínač zpět
        setBreakerPowerups(!newState);
      }
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

          {/* <div className="kimi-overlay">
            <img
              src={kimi.moodImage}
              alt={kimi.mood || "fox"}
              className="kimi-overlay__img"
            />
            <div className="kimi-overlay__text">
              <div className="kimi-overlay__label">Fox</div>
              <div className="kimi-overlay__status">{kimi.moodText}</div>
            </div>
          </div> */}

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
          </div>
        </div>
        
        <div className="stats card">
          <KimiStatus
            moodImage={kimi.moodImage}
            mood={kimi.mood}
            moodText={kimi.moodText}
          />
          <StatusBar label="🍗 Hunger"  value={kimi.hunger} color="#4FA3FF" />
          <StatusBar label="🧼 Clean"   value={kimi.clean}  color="#6FD6B6" />
          <StatusBar label="💤 Energy"  value={kimi.energy} color="#B58CFF" />
        </div>

        <div className="inventory card">
            <Inventory
              isOpen={true} 
              onClose={() => {}} 
              onUpdateKimiState={(data) => setKimi(withMood(data))}
              isEmbedded={true} 
            />
        </div>
      </div>
    </div>
  );
}
