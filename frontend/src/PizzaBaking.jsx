import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import axios from 'axios';
import './styles/PizzaBaking.css';

const TOPPING_EFFECTS = {
  tomato: { hunger: 8, clean: 2 },
  cheese: { hunger: 18 },
  mushroom: { hunger: 6, clean: 1 },
  pepper: { hunger: 4, energy: 2 },
  bacon: { hunger: 25, clean: -5 },
};

export default function PizzaBaking(){
  const navigate = useNavigate();
  const location = useLocation();
  const [toppings, setToppings] = useState([]);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [stoppedTime, setStoppedTime] = useState(null);
  const [result, setResult] = useState(null);
  const [pizzaName, setPizzaName] = useState('Moje Pizza');
  const DURATION = 20; // seconds
  const intervalRef = useRef(null);

  const isDone = !!result || stoppedTime === DURATION;
  // minigame target settings (sweet spot)
  const TARGET_CENTER = Math.floor(DURATION * 0.5); // center second
  const TARGET_HALF_WINDOW = 1.5; // seconds on each side for perfect zone

  useEffect(()=>{
    const fromState = location.state?.toppings;
    try{
      const stored = JSON.parse(localStorage.getItem('pizza_toppings') || 'null');
      setToppings(fromState || stored || []);
    }catch(e){
      setToppings(fromState || []);
    }
  },[location.state]);

  useEffect(()=>{
    if(!running) return;
    // 100ms resolution for better accuracy
    intervalRef.current = setInterval(()=>{
      setTime(prev=>{
        const n = +(prev + 0.1).toFixed(1);
        if(n >= DURATION){
          clearInterval(intervalRef.current);
          setRunning(false);
          setStoppedTime(DURATION);
          computeResult(DURATION);
          return DURATION;
        }
        return n;
      });
    },100);
    return ()=>clearInterval(intervalRef.current);
  },[running]);

  const handleSave = async ()=>{
    try{
      // floor numeric props if any, send to save endpoint
      const floored = toppings.map(t=>({ ...t }));
      const payload = { name: pizzaName || 'Moje Pizza', toppings: floored };
      // include bake metadata if available
      if(result){
        payload.bake_result = result;
        payload.score = result.score;
        payload.pizza_color = result.pizzaColor;
      }
      const res = await axios.post('http://127.0.0.1:5000/pizza/save', payload);
      if(res.data && res.data.pizza_id){
        navigate('/');
      }else{
        alert('Uložení proběhlo, ale server vrátil neočekávanou odpověď.');
      }
    }catch(e){
      console.error('save failed', e);
      alert('Nepodařilo se uložit pizzu.');
    }
  };

  const progress = Math.min(100, Math.round((time / DURATION) * 100));

  // Calculate zone boundaries (in seconds)
  // Zone structure: UNDERCOOKED | GOOD (left) | PERFECT | GOOD (right) | BURNT
  const undercooked_end = TARGET_CENTER - TARGET_HALF_WINDOW; // ~8.5s
  const perfect_start_inner = TARGET_CENTER - (TARGET_HALF_WINDOW * 0.5); // ~9.25s
  const perfect_end_inner = TARGET_CENTER + (TARGET_HALF_WINDOW * 0.5); // ~10.75s
  const good_end = TARGET_CENTER + TARGET_HALF_WINDOW; // ~11.5s
  const burnt_start = good_end; // ~11.5s

  // Helper: convert time (seconds) to percentage on progress bar
  const timeToPercent = (t) => Math.max(0, Math.min(100, (t / DURATION) * 100));

  function computeResult(finalTime){
    // Determine classification based on zone boundaries (must match slider zones)
    let classification = 'ok';
    let accuracy = 0;
    
    if(finalTime < undercooked_end) {
      // UNDERCOOKED zone: before ~8.5s
      classification = 'undercooked';
      accuracy = (finalTime / undercooked_end) * 0.3; // 0-0.3 for this zone
    } else if(finalTime < perfect_start_inner) {
      // GOOD (left) zone: ~8.5s to ~9.25s
      classification = 'good';
      accuracy = 0.3 + ((finalTime - undercooked_end) / (perfect_start_inner - undercooked_end)) * 0.25;
    } else if(finalTime < perfect_end_inner) {
      // PERFECT zone: ~9.25s to ~10.75s
      classification = 'perfect';
      const perfectDist = Math.abs(finalTime - TARGET_CENTER);
      accuracy = Math.max(0.8, 1 - (perfectDist / (TARGET_HALF_WINDOW * 0.5)));
    } else if(finalTime < good_end) {
      // GOOD (right) zone: ~10.75s to ~11.5s
      classification = 'good';
      accuracy = 0.55 + ((good_end - finalTime) / (good_end - perfect_end_inner)) * 0.25;
    } else {
      // BURNT zone: after ~11.5s
      classification = 'burnt';
      accuracy = Math.max(0, 0.3 - ((finalTime - good_end) / (DURATION - good_end)) * 0.3);
    }

    accuracy = Math.max(0, Math.min(1, accuracy));
    const score = Math.round(accuracy * 100);

    // Calculate pizza color based on baking progress
    const bakeProgress = Math.min(100, Math.round((finalTime / DURATION) * 100));
    const pizzaColor = `radial-gradient(circle at 40% 35%, hsl(${38 - bakeProgress * 0.15}, 80%, ${88 - bakeProgress * 0.2}%) 0%, hsl(${35 - bakeProgress * 0.13}, 80%, ${78 - bakeProgress * 0.18}%) 40%, hsl(${32 - bakeProgress * 0.1}, 75%, ${68 - bakeProgress * 0.15}%) 70%, hsl(${30 - bakeProgress * 0.08}, 70%, ${55 - bakeProgress * 0.12}%) 100%)`;

    const outcome = {
      time: Number(finalTime.toFixed(1)),
      target: TARGET_CENTER,
      accuracy: Number(accuracy.toFixed(3)),
      classification,
      score,
      pizzaColor
    };
    setResult(outcome);
    return outcome;
  }

  function pullNow(){
    if(!running) return;
    clearInterval(intervalRef.current);
    setRunning(false);
    setStoppedTime(time);
    computeResult(time);
  }

  function retry(){
    clearInterval(intervalRef.current);
    setTime(0);
    setStoppedTime(null);
    setResult(null);
    setPizzaName('Moje Pizza');
    setRunning(true);
  }

  return (
    <div className="pizza-baking-page">
      <Header title="Pizza se peče..." onClose={()=>navigate('/')} />
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
            <div className={`pizza-oven-canvas ${isDone? 'stopped': ''}`}>
              <div className={`pizza-base ${isDone? 'done': ''}`} style={{
                background: isDone && result ? result.pizzaColor : !isDone ? `radial-gradient(circle at 40% 35%, hsl(${38 - progress * 0.15}, 80%, ${88 - progress * 0.2}%) 0%, hsl(${35 - progress * 0.13}, 80%, ${78 - progress * 0.18}%) 40%, hsl(${32 - progress * 0.1}, 75%, ${68 - progress * 0.15}%) 70%, hsl(${30 - progress * 0.08}, 70%, ${55 - progress * 0.12}%) 100%)` : undefined
              }} />
              {toppings.map(t => (
                <div key={t.id} className="topping-in-oven" style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(-50%,-50%) scale(${t.scale||1})` }}>
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
              <button className="pull-btn" onClick={pullNow} disabled={!running}>Vyndat!</button>
            </div>

            <div className="progress-container">
              {/* Zone backgrounds - all four zones in order */}
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
              
              {/* Progress bar on top of zones */}
              <div className="progress-bar"><div className="fill" style={{width: `${progress}%`}}/></div>
            </div>

            {/* Zone legend */}
            <div className="zone-legend">
              <div className="legend-item"><span className="legend-color" style={{background:'#e74c3c'}}></span>Nedopečeno</div>
              <div className="legend-item"><span className="legend-color" style={{background:'#f1c40f'}}></span>Dobré</div>
              <div className="legend-item"><span className="legend-color" style={{background:'#27ae60'}}></span>Perfektní</div>
              <div className="legend-item"><span className="legend-color" style={{background:'#8b4513'}}></span>Spáleno</div>
            </div>

            {result ? (
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
                
                <div className="score-display">
                  <div className="score-bar-container">
                    <div className="score-bar-fill" style={{width: `${result.accuracy * 100}%`}}></div>
                  </div>
                </div>

                <div className="result-feedback">
                  {result.classification === 'perfect' && '🌟 Perfektně! Tvoje pizza je mistr-dílo!'}
                  {result.classification === 'good' && '✨ Hezký výsledek! Pizza je chutná!'}
                  {result.classification === 'undercooked' && '⏰ Příliš brzy! Pizza není hotová.'}
                  {result.classification === 'burnt' && '🌡️ Příliš dlouho! Pizza je spálená.'}
                </div>

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

                <div className="result-actions">
                  <button onClick={handleSave} className="save-btn">Uložit do inventáře</button>
                  <button onClick={retry} className="retry-btn">Zkusit znovu</button>
                  <button onClick={()=>navigate('/pizza')} className="back-btn">Zahodit</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
