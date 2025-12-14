/*
View Component: PizzaBaking.jsx
Author: Šimon Dufek
*/
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import { createBakingController } from './controllers/pizzaController';
import './styles/PizzaBaking.css';

export default function PizzaBaking() { // Hlavní komponenta pro pečení pizzy
  const navigate = useNavigate();
  const location = useLocation();
  
  const [toppings, setToppings] = useState([]);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [result, setResult] = useState(null);
  const [pizzaName, setPizzaName] = useState('Moje Pizza');
  
  const intervalRef = useRef(null);
  const DURATION = 10;

  const ctrl = createBakingController(navigate);

  useEffect(() => { // Načtení počátečních toppingů
    const data = ctrl.getInitialToppings(location.state);
    setToppings(data);
  }, [location.state]);

  useEffect(() => { // Hlavní časovač pečení
    if (!running) return;
    intervalRef.current = setInterval(() => { // Aktualizace času
      setTime(prev => {
        const nextTime = +(prev + 0.1).toFixed(1);
        if (nextTime >= DURATION) {
          stopGame(DURATION);
          return DURATION;
        }
        return nextTime;
      });
    }, 100);
    return () => clearInterval(intervalRef.current); // Vyčištění intervalu
  }, [running]);

  const stopGame = (finalTime) => { // Zastavení pečení
    clearInterval(intervalRef.current);
    setRunning(false);
    const res = ctrl.evaluateResult(finalTime, DURATION);
    setResult(res);
  };

  const handlePull = () => { // Ovladač pro tlačítko "Vyndat"
    if(running) stopGame(time);
  };

  const handleRetry = () => { // Restart pečení
    setTime(0);
    setResult(null);
    setPizzaName('Moje Pizza');
    setRunning(true);
  };

  const progress = Math.min(100, Math.round((time / DURATION) * 100));
  const isDone = !!result;
  const TARGET_CENTER = Math.floor(DURATION * 0.5); 
  const TARGET_HALF_WINDOW = 1.5;
  const undercooked_end = TARGET_CENTER - TARGET_HALF_WINDOW;
  const perfect_start_inner = TARGET_CENTER - (TARGET_HALF_WINDOW * 0.5);
  const perfect_end_inner = TARGET_CENTER + (TARGET_HALF_WINDOW * 0.5);
  const good_end = TARGET_CENTER + TARGET_HALF_WINDOW;
  const burnt_start = good_end;

  const timeToPercent = (t) => Math.max(0, Math.min(100, (t / DURATION) * 100)); // Převod času na procenta pro progress bar

  // Render komponenty
  return (
    <div className="pizza-baking-page">
      <Header title="Pizza se peče..." onClose={() => navigate('/')} />
      
      {/* Hlavní obsah pečení pizzy */}
      <div className="baking-wrap">
        <div className="oven-section">
          <div className="oven-label">🔥 TROUBA 🔥</div>
          <div className="oven">
            <div className="oven-window">
                <div className="flames-container">
                    <div className="flame flame-1"></div>
                    <div className="flame flame-2"></div>
                    <div className="flame flame-3"></div>
                </div>
                <div className={`pizza-oven-canvas ${isDone ? 'stopped' : ''}`}>
                  <div 
                    className={`pizza-base ${isDone ? 'done' : ''}`} 
                    style={{
                      background: isDone && result 
                        ? result.pizzaColor 
                        : `radial-gradient(circle at 40% 35%, hsl(${38 - progress * 0.15}, 80%, ${88 - progress * 0.2}%) 0%, hsl(${35 - progress * 0.13}, 80%, ${78 - progress * 0.18}%) 40%, hsl(${32 - progress * 0.1}, 75%, ${68 - progress * 0.15}%) 70%, hsl(${30 - progress * 0.08}, 70%, ${55 - progress * 0.12}%) 100%)`
                    }} 
                  />
                  {toppings.map(t => (
                    <div key={t.id} className="topping-in-oven" style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(-50%,-50%) scale(${t.scale})` }}>
                      <span className="emoji">{t.emoji}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

        <div className="bake-info">
          <h2>Pečení...</h2>
          <div className="minigame">
            <div className="timer-row">
              <div className="timer">{time.toFixed(1)}s / {DURATION}s</div>
              <button className="pull-btn" onClick={handlePull} disabled={!running}>Vyndat!</button>
            </div>

            {/* Progress Bar se zónami*/}
            <div className="progress-container">
              <div className="zone zone-undercooked" style={{
                left: `${timeToPercent(0)}%`,
                width: `${timeToPercent(undercooked_end) - timeToPercent(0)}%`
              }} title="Nedopečeno" />
              <div className="zone zone-good" style={{
                left: `${timeToPercent(undercooked_end)}%`,
                width: `${timeToPercent(perfect_start_inner) - timeToPercent(undercooked_end)}%`
              }} title="Dobré (vlevo)" />
              <div className="zone zone-perfect" style={{
                left: `${timeToPercent(perfect_start_inner)}%`,
                width: `${timeToPercent(perfect_end_inner) - timeToPercent(perfect_start_inner)}%`
              }} title="Perfektní" />
              <div className="zone zone-good" style={{
                left: `${timeToPercent(perfect_end_inner)}%`,
                width: `${timeToPercent(good_end) - timeToPercent(perfect_end_inner)}%`
              }} title="Dobré (vpravo)" />
              <div className="zone zone-burnt" style={{
                left: `${timeToPercent(burnt_start)}%`,
                width: `${timeToPercent(DURATION) - timeToPercent(burnt_start)}%`
              }} title="Spáleno" />
              
              <div className="progress-bar"><div className="fill" style={{width: `${progress}%`}}/></div>
            </div>

            <div className="zone-legend">
              <div className="legend-item"><span className="legend-color" style={{background:'#e74c3c'}}></span>Nedopečeno</div>
              <div className="legend-item"><span className="legend-color" style={{background:'#f1c40f'}}></span>Dobré</div>
              <div className="legend-item"><span className="legend-color" style={{background:'#27ae60'}}></span>Perfektní</div>
              <div className="legend-item"><span className="legend-color" style={{background:'#8b4513'}}></span>Spáleno</div>
            </div>

            {/* Zobrazení výsledků pečení */}
            {result && (
              <div className={`result-panel result-${result.classification}`}>
                <div className="result-header">
                   <div className="result-emoji">
                    {result.classification === 'perfect' && '🎉'}
                    {result.classification === 'good' && '👍'}
                    {result.classification === 'undercooked' && '⏱️'}
                    {result.classification === 'burnt' && '🔥'}
                  </div>
                   <div className="result-title">{result.classification.toUpperCase()}</div>
                </div>
                
                {/* Score Display */}
                <div className="score-display">
                  <div className="score-bar-container">
                    <div className="score-bar-fill" style={{width: `${result.accuracy * 100}%`}}></div>
                  </div>
                </div>
                
                {/* Feedback Message */}
                <div className="result-feedback">
                  {result.classification === 'perfect' && '🌟 Perfektně! Tvoje pizza je mistr-dílo!'}
                  {result.classification === 'good' && '✨ Hezký výsledek! Pizza je chutná!'}
                  {result.classification === 'undercooked' && '⏰ Příliš brzy! Pizza není hotová.'}
                  {result.classification === 'burnt' && '🌡️ Příliš dlouho! Pizza je spálená.'}
                </div>

                {/* Input pro pojmenování pizzy */}
                <div className="pizza-name-input-container">
                  <label htmlFor="pizza-name">Pojmenuj svou pizzu:</label>
                  <input
                    id="pizza-name"
                    type="text"
                    value={pizzaName}
                    onChange={(e) => setPizzaName(e.target.value)}
                    placeholder="Např. Pepperoni Delight"
                    maxLength="50"
                    className="pizza-name-input"
                  />
                </div>

                {/* Akční tlačítka */}
                <div className="result-actions">
                  <button onClick={() => ctrl.savePizza(pizzaName, toppings, result)} className="save-btn">Uložit do inventáře</button>
                  <button onClick={handleRetry} className="retry-btn">Zkusit znovu</button>
                  <button onClick={ctrl.discard} className="back-btn">Zahodit</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}