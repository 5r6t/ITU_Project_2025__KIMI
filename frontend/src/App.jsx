import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // 2.11. Přidání odkazu na Pinball stránku
import axios from "axios";

export default function App() {
  const [state, setState] = useState({ hunger: 0, clean: 0, energy: 0 });

  const loadState = async () => {
    const res = await axios.get("http://127.0.0.1:5000/state");
    setState(res.data);
  };

  const feedPou = async () => {
    const res = await axios.post("http://127.0.0.1:5000/feed");
    setState(res.data);
  };

  useEffect(() => { loadState(); }, []);

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
      {/* 2.11. jednoduchá „navigace“ */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/pinball">
          <button style={{ padding: "8px 14px", fontSize: 14 }}>
            Spustit Pinball 🎮
          </button>
        </Link>
      </div>
      {/* 2.11. konec */}
      
      <h1>Pou Mini Demo</h1>
      <p>🍗 Hunger: {state.hunger}</p>
      <p>🧼 Clean: {state.clean}</p>
      <p>💤 Energy: {state.energy}</p>
      <button onClick={feedPou}>Feed Pou 🍗</button>
    </div>
  );
}
