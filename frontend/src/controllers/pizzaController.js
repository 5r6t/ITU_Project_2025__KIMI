/*
Controller Component: PizzaDecor.jsx, PizzaBaking.jsx
Author: Šimon Dufek
*/
import { PizzaModel } from "../models/pizzaModel";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// --- Decoration Controller ---
export function createDecorController(toppings, setToppings, navigate) {
  const commit = (newToppings) => {
    setToppings(newToppings);
    PizzaModel.saveToppings(newToppings);
    if (newToppings.length > 0) {
      PizzaModel.apiPreview(newToppings);
    }
  };

  return { // Metody pro manipulaci s polevou
    load: () => {
      const saved = PizzaModel.loadToppings();
      if (saved) setToppings(saved);
    },

    addTopping: (typeObj) => { // Přidání nové polevy
      const newTopping = {
        id: uid(),
        type: typeObj.type || typeObj,
        emoji: typeObj.emoji,
        x: 50 + (Math.random() - 0.5) * 10,
        y: 50 + (Math.random() - 0.5) * 10,
        scale: 2,
        rotation: 0,
      };
      commit([...toppings, newTopping]);
    },

    updateToppingPosition: (id, x, y) => { // Aktualizace pozice polevy
      const updated = toppings.map(t => t.id === id ? { ...t, x, y } : t);
      setToppings(updated);
    },
    
    finalizeDrag: () => { // Uložení pozice po přetažení
        PizzaModel.saveToppings(toppings);
    },

    scaleTopping: (id) => { // Změna velikosti toppingů
      const updated = toppings.map(t => 
        t.id === id ? { ...t, scale: Math.max(0.5, Math.min(5, (t.scale || 2) + 1)) } : t
      );
      commit(updated);
    },

    removeTopping: (id) => { // Odebrání toppingů
      commit(toppings.filter(t => t.id !== id));
    },

    clear: () => { // Vyčištění všech toppingů
      commit([]);
    },

    startBaking: () => { // Přechod na pečení
      PizzaModel.saveToppings(toppings);
      navigate('/pizza-baking', { state: { toppings } });
    }
  };
}

// --- Baking Controller ---
export function createBakingController(navigate) {
  return { // Metody pro pečení pizzy
    getInitialToppings: (locationState) => { // Načtení toppingů
      if (locationState?.toppings) return locationState.toppings;
      return PizzaModel.loadToppings();
    },

    evaluateResult: (time, duration) => { // Vyhodnocení výsledku pečení
      return PizzaModel.calculateBakeResult(time, duration);
    },

    savePizza: async (name, toppings, result) => { // Uložení pizzy
      try {
        const payload = { 
          name: name || 'Custom Pizza', 
          toppings: toppings 
        };
        
        if (result) {
          payload.bake_result = result;
          payload.score = result.score;
          payload.pizza_color = result.pizzaColor;
        }

        const response = await PizzaModel.apiSave(payload);
        
        if (response && response.pizza_id) {
            PizzaModel.clearToppings(); 
            navigate('/');
        } else {
            alert('Uloženo, ale odpověď serveru byla nečekaná.');
        }
      } catch (e) {
        console.error("Save error", e);
        alert('Chyba při ukládání pizzy.');
      }
    },

    discard: () => navigate('/pizza')
  };
}