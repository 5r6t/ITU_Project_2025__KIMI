import { PizzaModel } from "../models/pizzaModel";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// --- Decor Controller ---
export function createDecorController(toppings, setToppings, navigate) {
  const commit = (newToppings) => {
    setToppings(newToppings);
    PizzaModel.saveToppings(newToppings);
    if (newToppings.length > 0) {
      PizzaModel.apiPreview(newToppings);
    }
  };

  return {
    load: () => {
      const saved = PizzaModel.loadToppings();
      if (saved) setToppings(saved);
    },

    addTopping: (typeObj) => {
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

    updateToppingPosition: (id, x, y) => {
      const updated = toppings.map(t => t.id === id ? { ...t, x, y } : t);
      setToppings(updated);
    },
    
    finalizeDrag: () => {
        PizzaModel.saveToppings(toppings);
    },

    scaleTopping: (id) => {
      const updated = toppings.map(t => 
        t.id === id ? { ...t, scale: Math.max(0.5, Math.min(5, (t.scale || 2) + 1)) } : t
      );
      commit(updated);
    },

    removeTopping: (id) => {
      commit(toppings.filter(t => t.id !== id));
    },

    clear: () => {
      commit([]);
    },

    startBaking: () => {
      PizzaModel.saveToppings(toppings);
      navigate('/pizza-baking', { state: { toppings } });
    }
  };
}

// --- Baking Controller ---
export function createBakingController(navigate) {
  return {
    getInitialToppings: (locationState) => {
      if (locationState?.toppings) return locationState.toppings;
      return PizzaModel.loadToppings();
    },

    evaluateResult: (time, duration) => {
      return PizzaModel.calculateBakeResult(time, duration);
    },

    savePizza: async (name, toppings, result) => {
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
            
            //alert('Pizza uložena do inventáře jako ' + response.ingredient_name);
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