import { useState, useEffect } from "react";
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
      <h1>Pou Mini Demo</h1>
      <p>🍗 Hunger: {state.hunger}</p>
      <p>🧼 Clean: {state.clean}</p>
      <p>💤 Energy: {state.energy}</p>
      <button onClick={feedPou}>Feed Pou 🍗</button>
    </div>
  );
}
