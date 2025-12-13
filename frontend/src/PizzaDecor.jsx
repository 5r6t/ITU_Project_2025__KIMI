import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './meta_components/Header';
import { PizzaModel, PALETTE, SPECIAL_RECIPES } from './models/pizzaModel';
import { createDecorController } from './controllers/pizzaController';
import './styles/PizzaDecor.css';

export default function PizzaDecor() {
  const navigate = useNavigate();
  const [toppings, setToppings] = useState([]);
  const [dragging, setDragging] = useState(null);
  const pizzaRef = useRef(null);

  const ctrl = createDecorController(toppings, setToppings, navigate);

  useEffect(() => {
    ctrl.load();
  }, []);

  useEffect(() => {
    const onMove = (ev) => {
      if (!dragging) return;
      const pizza = pizzaRef.current;
      if (!pizza) return;
      const rect = pizza.getBoundingClientRect();
      const px = ((ev.clientX - rect.left) / rect.width) * 100;
      const py = ((ev.clientY - rect.top) / rect.height) * 100;
      
      ctrl.updateToppingPosition(dragging.id, px, py);
    };
    
    const onUp = () => {
        if(dragging) {
            ctrl.finalizeDrag();
            setDragging(null);
        }
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, toppings]);

  // View Calculations
  const stats = PizzaModel.calculateStats(toppings);

  return (
    <div>
      <Header title="Pizza Decor" onClose={() => navigate('/')} />

      <div className="orders-panel">
        <h3>📋 Available Recipes</h3>
        <div className="orders-scroll">
          {SPECIAL_RECIPES.map((recipe) => {
            const isMatched = stats.matchedRecipes.some(r => r.id === recipe.id);
            return (
              <div key={recipe.id} className={`order-ticket ${isMatched ? 'matched' : ''}`}>
                <div className="ticket-header">
                  <div className="ticket-name">{recipe.name}</div>
                  {isMatched && <div className="matched-badge">✨ MATCHED</div>}
                </div>
                <div className="ticket-ingredients">
                  {recipe.ingredients.map((ing) => (
                    <div key={ing.type} className="ingredient-line">
                      <span>{ing.emoji}</span> {ing.type}
                    </div>
                  ))}
                </div>
                <div className="ticket-rewards">
                    {/* Zobrazení bonusů */}
                    {recipe.bonus.hunger && <span className="reward">🍗 +{recipe.bonus.hunger}</span>}
                    {recipe.bonus.clean && <span className="reward">🧼 {recipe.bonus.clean}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pizza-page">
        <aside className="palette">
          <h3>Palette</h3>
          <div className="palette-list">
            {PALETTE.map((p) => (
              <button key={p.type} className="palette-item" onClick={() => ctrl.addTopping(p)}>
                <span className="emoji">{p.emoji}</span>
                <span className="label">{p.label}</span>
              </button>
            ))}
          </div>
          <div className="palette-actions">
            <button onClick={() => ctrl.clear()}>Clear</button>
            <button onClick={() => ctrl.startBaking()}>Bake</button>
          </div>

          <div className="effects-panel">
            <h4>Effects</h4>
            <div className="effect-item">
              <span className="effect-label">🍗 Hunger:</span>
              <span>{Math.round(stats.total.hunger * 10) / 10}</span>
            </div>
            <div className="effect-item">
              <span className="effect-label">🧼 Clean:</span>
              <span>{Math.round(stats.total.clean * 10) / 10}</span>
            </div>
            <div className="effect-item">
              <span className="effect-label">💤 Energy:</span>
              <span>{Math.round(stats.total.energy * 10) / 10}</span>
            </div>
          </div>
        </aside>

        <main className="pizza-area-wrapper">
          <div className="pizza-area" ref={pizzaRef}>
            <div className="pizza-base" />
            {toppings.map((t) => (
              <div
                key={t.id}
                className="topping"
                style={{ 
                    left: `${t.x}%`, 
                    top: `${t.y}%`, 
                    transform: `translate(-50%, -50%) scale(${t.scale || 2})` 
                }}
                onPointerDown={(e) => { e.preventDefault(); setDragging({ id: t.id }); }}
                onDoubleClick={(e) => { e.stopPropagation(); ctrl.scaleTopping(t.id); }}
                onContextMenu={(e) => { e.preventDefault(); ctrl.removeTopping(t.id); }}
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