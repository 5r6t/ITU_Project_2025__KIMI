import axios from "axios";

const API_URL = "http://127.0.0.1:5000";

export const TOPPING_EFFECTS = {
  tomato: { hunger: 8, clean: 2 },
  cheese: { hunger: 18 },
  mushroom: { hunger: 6, clean: 1 },
  pepper: { hunger: 4, energy: 2 },
  bacon: { hunger: 25, clean: -5 },
};

export const SPECIAL_RECIPES = [
  {
    id: 'classic',
    name: 'Classic Margherita',
    required: ['tomato', 'cheese'],
    bonus: { hunger: 10, clean: 5 },
    ingredients: [{ type: 'tomato', emoji: '🍅' }, { type: 'cheese', emoji: '🧀' }],
  },
  {
    id: 'veggie',
    name: 'Veggie Deluxe',
    required: ['tomato', 'mushroom', 'pepper'],
    bonus: { hunger: 8, clean: 8, energy: 3 },
    ingredients: [{ type: 'tomato', emoji: '🍅' }, { type: 'mushroom', emoji: '🍄' }, { type: 'pepper', emoji: '🌶️' }],
  },
  {
    id: 'hearty',
    name: 'Hearty Feast',
    required: ['cheese', 'bacon'],
    bonus: { hunger: 20, clean: -3 },
    ingredients: [{ type: 'cheese', emoji: '🧀' }, { type: 'bacon', emoji: '🥓' }],
  },
  {
    id: 'supreme',
    name: 'Pizza Supreme',
    required: ['tomato', 'cheese', 'mushroom', 'bacon'],
    bonus: { hunger: 30, clean: 2, energy: 5 },
    ingredients: [{ type: 'tomato', emoji: '🍅' }, { type: 'cheese', emoji: '🧀' }, { type: 'mushroom', emoji: '🍄' }, { type: 'bacon', emoji: '🥓' }],
  },
  {
    id: 'spicy',
    name: 'Spicy Kick',
    required: ['pepper', 'bacon'],
    bonus: { hunger: 15, energy: 10, clean: -2 },
    ingredients: [{ type: 'pepper', emoji: '🌶️' }, { type: 'bacon', emoji: '🥓' }],
  },
];

export const PALETTE = [
  { type: 'tomato', label: 'Tomato', emoji: '🍅' },
  { type: 'cheese', label: 'Cheese', emoji: '🧀' },
  { type: 'mushroom', label: 'Mushroom', emoji: '🍄' },
  { type: 'pepper', label: 'Pepper', emoji: '🌶️' },
  { type: 'bacon', label: 'Bacon', emoji: '🥓' },
];

export const PizzaModel = {
  loadToppings() {
    try {
      const raw = localStorage.getItem('pizza_toppings');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to load toppings", e);
      return [];
    }
  },

  saveToppings(toppings) {
    try {
      localStorage.setItem('pizza_toppings', JSON.stringify(toppings));
    } catch (e) {
      console.error("Failed to save toppings", e);
    }
  },

  clearToppings() {
    try {
      localStorage.removeItem('pizza_toppings');
    } catch (e) {
      console.error("Failed to clear toppings", e);
    }
  },

  // --- Calculations ---
  calculateStats(toppings) {
    const base = { hunger: 0, clean: 0, energy: 0 };
    toppings.forEach((t) => {
      const e = TOPPING_EFFECTS[t.type] || {};
      const scale = t.scale || 1;
      base.hunger += (e.hunger || 0) * scale / 5;
      base.clean += (e.clean || 0) * scale / 5;
      base.energy += (e.energy || 0) * scale / 5;
    });

    const toppingTypes = new Set(toppings.map((t) => t.type));
    const matched = SPECIAL_RECIPES.filter((recipe) =>
      recipe.required.every((type) => toppingTypes.has(type))
    );

    let bonus = { hunger: 0, clean: 0, energy: 0 };
    matched.forEach((recipe) => {
      bonus.hunger += recipe.bonus.hunger || 0;
      bonus.clean += recipe.bonus.clean || 0;
      bonus.energy += recipe.bonus.energy || 0;
    });

    return {
      base,
      bonus,
      total: {
        hunger: base.hunger + bonus.hunger,
        clean: base.clean + bonus.clean,
        energy: base.energy + bonus.energy,
      },
      matchedRecipes: matched
    };
  },

  calculateBakeResult(finalTime, duration) {
    const TARGET_CENTER = Math.floor(duration * 0.5); 
    const TARGET_HALF_WINDOW = 1.5;

    // Zone boundaries
    const undercooked_end = TARGET_CENTER - TARGET_HALF_WINDOW; 
    const perfect_start_inner = TARGET_CENTER - (TARGET_HALF_WINDOW * 0.5); 
    const perfect_end_inner = TARGET_CENTER + (TARGET_HALF_WINDOW * 0.5); 
    const good_end = TARGET_CENTER + TARGET_HALF_WINDOW; 
    
    let classification = 'ok';
    let accuracy = 0;

    if (finalTime < undercooked_end) {
      classification = 'undercooked';
      accuracy = (finalTime / undercooked_end) * 0.3;
    } else if (finalTime < perfect_start_inner) {
      classification = 'good';
      accuracy = 0.3 + ((finalTime - undercooked_end) / (perfect_start_inner - undercooked_end)) * 0.25;
    } else if (finalTime < perfect_end_inner) {
      classification = 'perfect';
      const perfectDist = Math.abs(finalTime - TARGET_CENTER);
      accuracy = Math.max(0.8, 1 - (perfectDist / (TARGET_HALF_WINDOW * 0.5)));
    } else if (finalTime < good_end) {
      classification = 'good';
      accuracy = 0.55 + ((good_end - finalTime) / (good_end - perfect_end_inner)) * 0.25;
    } else {
      classification = 'burnt';
      accuracy = Math.max(0, 0.3 - ((finalTime - good_end) / (duration - good_end)) * 0.3);
    }

    accuracy = Math.max(0, Math.min(1, accuracy));
    const score = Math.round(accuracy * 100);

    // Pizza Color calculation
    const bakeProgress = Math.min(100, Math.round((finalTime / duration) * 100));
    const pizzaColor = `radial-gradient(circle at 40% 35%, hsl(${38 - bakeProgress * 0.15}, 80%, ${88 - bakeProgress * 0.2}%) 0%, hsl(${35 - bakeProgress * 0.13}, 80%, ${78 - bakeProgress * 0.18}%) 40%, hsl(${32 - bakeProgress * 0.1}, 75%, ${68 - bakeProgress * 0.15}%) 70%, hsl(${30 - bakeProgress * 0.08}, 70%, ${55 - bakeProgress * 0.12}%) 100%)`;

    return {
      time: Number(finalTime.toFixed(1)),
      classification,
      score,
      accuracy,
      pizzaColor
    };
  },

  // --- API Calls ---
  async apiPreview(toppings) {
    try {
      const res = await axios.post(`${API_URL}/pizza/preview`, { toppings });
      return res.data;
    } catch (e) {
      console.error("Preview sync failed:", e);
      return null;
    }
  },

  async apiSave(payload) {
    if (payload.toppings) {
      payload.toppings = payload.toppings.map(t => ({
        ...t,
        hunger: t.hunger ? Math.floor(t.hunger) : t.hunger,
        clean: t.clean ? Math.floor(t.clean) : t.clean,
        energy: t.energy ? Math.floor(t.energy) : t.energy,
      }));
    }
    const res = await axios.post(`${API_URL}/pizza/save`, payload);
    return res.data;
  }
};