import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import axios from 'axios';
import './PizzaDecor.css';

const PALETTE = [
  { type: 'tomato', label: 'Tomato', emoji: '🍅' },
  { type: 'cheese', label: 'Cheese', emoji: '🧀' },
  { type: 'mushroom', label: 'Mushroom', emoji: '🍄' },
  { type: 'pepper', label: 'Pepper', emoji: '🌶️' },
  { type: 'bacon', label: 'Bacon', emoji: '🥓' },
];

const TOPPING_EFFECTS = {
  tomato: { hunger: 8, clean: 2 },
  cheese: { hunger: 18 },
  mushroom: { hunger: 6, clean: 1 },
  pepper: { hunger: 4, energy: 2 },
  bacon: { hunger: 25, clean: -5 },
};

const SPECIAL_RECIPES = [
  {
    id: 'classic',
    name: 'Classic Margherita',
    required: ['tomato', 'cheese'],
    bonus: { hunger: 10, clean: 5 },
    description: 'Tomato + Cheese',
    ingredients: [
      { type: 'tomato', emoji: '🍅' },
      { type: 'cheese', emoji: '🧀' },
    ],
  },
  {
    id: 'veggie',
    name: 'Veggie Deluxe',
    required: ['tomato', 'mushroom', 'pepper'],
    bonus: { hunger: 8, clean: 8, energy: 3 },
    description: 'Tomato + Mushroom + Pepper',
    ingredients: [
      { type: 'tomato', emoji: '🍅' },
      { type: 'mushroom', emoji: '🍄' },
      { type: 'pepper', emoji: '🌶️' },
    ],
  },
  {
    id: 'hearty',
    name: 'Hearty Feast',
    required: ['cheese', 'bacon'],
    bonus: { hunger: 20, clean: -3 },
    description: 'Cheese + Bacon',
    ingredients: [
      { type: 'cheese', emoji: '🧀' },
      { type: 'bacon', emoji: '🥓' },
    ],
  },
  {
    id: 'supreme',
    name: 'Pizza Supreme',
    required: ['tomato', 'cheese', 'mushroom', 'bacon'],
    bonus: { hunger: 30, clean: 2, energy: 5 },
    description: 'All 4 ingredients',
    ingredients: [
      { type: 'tomato', emoji: '🍅' },
      { type: 'cheese', emoji: '🧀' },
      { type: 'mushroom', emoji: '🍄' },
      { type: 'bacon', emoji: '🥓' },
    ],
  },
  {
    id: 'spicy',
    name: 'Spicy Kick',
    required: ['pepper', 'bacon'],
    bonus: { hunger: 15, energy: 10, clean: -2 },
    description: 'Pepper + Bacon',
    ingredients: [
      { type: 'pepper', emoji: '🌶️' },
      { type: 'bacon', emoji: '🥓' },
    ],
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function PizzaDecor() {
  const navigate = useNavigate();
  const [toppings, setToppings] = useState([]);
  const [dragging, setDragging] = useState(null);
  const pizzaRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pizza_toppings');
      if (raw) setToppings(JSON.parse(raw));
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('pizza_toppings', JSON.stringify(toppings));
  }, [toppings]);

  const addTopping = (type) => {
    // place roughly center
    setToppings((s) => [
      ...s,
      {
        id: uid(),
        type: type.type || type,
        emoji: type.emoji,
        x: 50 + (Math.random() - 0.5) * 10, // percent
        y: 50 + (Math.random() - 0.5) * 10,
        scale: 2,
        rotation: 0,
      },
    ]);
  };

  // Calculate aggregated effects from all toppings (with /5 reduction)
  const calculateEffects = () => {
    const effects = { hunger: 0, clean: 0, energy: 0 };
    toppings.forEach((t) => {
      const e = TOPPING_EFFECTS[t.type] || {};
      effects.hunger += e.hunger ? e.hunger * t.scale / 5 : 0;
      effects.clean += e.clean ? e.clean * t.scale / 5 : 0;
      effects.energy += e.energy ? e.energy * t.scale / 5 : 0;
    });
    return effects;
  };

  // Check which recipes are matched
  const getMatchedRecipes = () => {
    const toppingTypes = new Set(toppings.map((t) => t.type));
    return SPECIAL_RECIPES.filter((recipe) =>
      recipe.required.every((type) => toppingTypes.has(type))
    );
  };

  // Calculate total effects including bonuses from matched recipes
  const calculateTotalEffects = () => {
    const baseEffects = calculateEffects();
    const matched = getMatchedRecipes();
    let bonusEffects = { hunger: 0, clean: 0, energy: 0 };
    matched.forEach((recipe) => {
      bonusEffects.hunger += recipe.bonus.hunger || 0;
      bonusEffects.clean += recipe.bonus.clean || 0;
      bonusEffects.energy += recipe.bonus.energy || 0;
    });
    return {
      base: baseEffects,
      bonus: bonusEffects,
      total: {
        hunger: baseEffects.hunger + bonusEffects.hunger,
        clean: baseEffects.clean + bonusEffects.clean,
        energy: baseEffects.energy + bonusEffects.energy,
      },
    };
  };

  const handleScaleTopping = (id, ev) => {
    ev.stopPropagation();
    setToppings((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, scale: Math.max(0.5, Math.min(5, t.scale + 1)) }
          : t
      )
    );
  };

  // pointer-based drag (works with mouse + touch)
  useEffect(() => {
    const onMove = (ev) => {
      if (!dragging) return;
      const pizza = pizzaRef.current;
      if (!pizza) return;
      const rect = pizza.getBoundingClientRect();
      const px = ((ev.clientX - rect.left) / rect.width) * 100;
      const py = ((ev.clientY - rect.top) / rect.height) * 100;
      setToppings((prev) => prev.map((t) => (t.id === dragging.id ? { ...t, x: px, y: py } : t)));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  const startDrag = (topping, ev) => {
    ev.preventDefault();
    setDragging({ id: topping.id });
  };

  const removeTopping = (id) => {
    setToppings((s) => s.filter((t) => t.id !== id));
  };

  const clearPizza = () => setToppings([]);

  const saveToInventory = async () => {
    try {
      // Floor all effect values before saving
      const floored_toppings = toppings.map(t => ({
        ...t,
        hunger: t.hunger ? Math.floor(t.hunger) : t.hunger,
        clean: t.clean ? Math.floor(t.clean) : t.clean,
        energy: t.energy ? Math.floor(t.energy) : t.energy,
      }));
      const payload = { name: `Custom Pizza`, toppings: floored_toppings };
      const res = await axios.post('http://127.0.0.1:5000/pizza/save', payload);
      if (res.data && res.data.pizza_id) {
        alert('Pizza saved to inventory as ' + res.data.ingredient_name);
      } else {
        alert('Saved, but server returned unexpected response.');
      }
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save pizza to server. Is backend running?');
    }
  };

  const effectData = calculateTotalEffects();
  const matchedRecipes = getMatchedRecipes();

  return (
    <div>
      <div>
        <Header title="Pizza Decor" onClose={() => navigate('/')} />
      </div>

      {/* Orders Panel at Top */}
      <div className="orders-panel">
        <h3>📋 Available Recipes / Orders</h3>
        <div className="orders-scroll">
          {SPECIAL_RECIPES.map((recipe) => (
            <div key={recipe.id} className={`order-ticket ${matchedRecipes.some(r => r.id === recipe.id) ? 'matched' : ''}`}>
              <div className="ticket-header">
                <div className="ticket-name">{recipe.name}</div>
                {matchedRecipes.some(r => r.id === recipe.id) && <div className="matched-badge">✨ MATCHED</div>}
              </div>
              <div className="ticket-ingredients">
                {recipe.ingredients && recipe.ingredients.map((ing) => (
                  <div key={ing.type} className="ingredient-line">
                    <span>{ing.emoji}</span> {ing.type}
                  </div>
                ))}
              </div>
              <div className="ticket-rewards">
                {recipe.bonus.hunger && <span className="reward">🍗 +{recipe.bonus.hunger}</span>}
                {recipe.bonus.clean && <span className="reward">🧼 {recipe.bonus.clean > 0 ? '+' : ''}{recipe.bonus.clean}</span>}
                {recipe.bonus.energy && <span className="reward">💤 +{recipe.bonus.energy}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pizza-page">
        <aside className="palette">
          <h3>Palette</h3>
          <div className="palette-list">
            {PALETTE.map((p) => (
              <button key={p.type} className="palette-item" onClick={() => addTopping(p)}>
                <span className="emoji">{p.emoji}</span>
                <span className="label">{p.label}</span>
              </button>
            ))}
          </div>
          <div className="palette-actions">
            <button onClick={clearPizza}>Clear</button>
            <button onClick={saveToInventory}>Bake</button>
          </div>

          {/* Effects Preview Panel */}
          <div className="effects-panel">
            <h4>Effects</h4>
            <div className="effect-item">
              <span className="effect-label">🍗 Hunger:</span>
              <div className="effect-breakdown">
                <span className={`effect-value ${effectData.base.hunger > 0 ? 'positive' : effectData.base.hunger < 0 ? 'negative' : ''}`}>
                  {effectData.base.hunger > 0 ? '+' : ''}{Math.round(effectData.base.hunger * 10) / 10}
                </span>
                {effectData.bonus.hunger > 0 && (
                  <span className="effect-bonus">+{Math.round(effectData.bonus.hunger * 10) / 10}</span>
                )}
                <span className={`effect-total ${effectData.total.hunger > 0 ? 'positive' : effectData.total.hunger < 0 ? 'negative' : ''}`}>
                  = {Math.round(effectData.total.hunger * 10) / 10}
                </span>
              </div>
            </div>
            <div className="effect-item">
              <span className="effect-label">🧼 Clean:</span>
              <div className="effect-breakdown">
                <span className={`effect-value ${effectData.base.clean > 0 ? 'positive' : effectData.base.clean < 0 ? 'negative' : ''}`}>
                  {effectData.base.clean > 0 ? '+' : ''}{Math.round(effectData.base.clean * 10) / 10}
                </span>
                {effectData.bonus.clean !== 0 && (
                  <span className="effect-bonus">{effectData.bonus.clean > 0 ? '+' : ''}{Math.round(effectData.bonus.clean * 10) / 10}</span>
                )}
                <span className={`effect-total ${effectData.total.clean > 0 ? 'positive' : effectData.total.clean < 0 ? 'negative' : ''}`}>
                  = {Math.round(effectData.total.clean * 10) / 10}
                </span>
              </div>
            </div>
            <div className="effect-item">
              <span className="effect-label">💤 Energy:</span>
              <div className="effect-breakdown">
                <span className={`effect-value ${effectData.base.energy > 0 ? 'positive' : effectData.base.energy < 0 ? 'negative' : ''}`}>
                  {effectData.base.energy > 0 ? '+' : ''}{Math.round(effectData.base.energy * 10) / 10}
                </span>
                {effectData.bonus.energy > 0 && (
                  <span className="effect-bonus">+{Math.round(effectData.bonus.energy * 10) / 10}</span>
                )}
                <span className={`effect-total ${effectData.total.energy > 0 ? 'positive' : effectData.total.energy < 0 ? 'negative' : ''}`}>
                  = {Math.round(effectData.total.energy * 10) / 10}
                </span>
              </div>
            </div>
          </div>

          <p className="hint">Click to add. Drag to move. Double-click to scale. Right-click to remove.</p>
        </aside>

        <main className="pizza-area-wrapper">
          <div className="pizza-area" ref={pizzaRef}>
            <div className="pizza-base" />
            {toppings.map((t) => (
              <div
                key={t.id}
                className="topping"
                style={{ left: `${t.x}%`, top: `${t.y}%`, transform: `translate(-50%, -50%) scale(${t.scale})` }}
                onPointerDown={(e) => startDrag(t, e)}
                onDoubleClick={(e) => handleScaleTopping(t.id, e)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  removeTopping(t.id);
                }}
                title={`Drag to move, Double-click to scale, Right-click to remove`}
              >
                <span className="emoji-large">{t.emoji}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
