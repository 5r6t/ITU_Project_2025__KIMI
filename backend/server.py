from flask import Flask, jsonify, request
import json
from flask_cors import CORS
from database import *

ITEM_EFFECTS = {
    "Cheese": {"hunger": 20, "clean": -5},
    "Soap": {"clean": 30},
    "Energy Drink": {"energy": 40, "clean": -5},
    # Přidejte další ingredience, které chcete mít v inventáři
}

# Effects for pizza toppings (used when saving a pizza)
TOPPING_EFFECTS = {
    "tomato": {"hunger": 8, "clean": 2},
    "cheese": {"hunger": 18},
    "mushroom": {"hunger": 6, "clean": 1},
    "pepper": {"hunger": 4, "energy": 2},
    "bacon": {"hunger": 25, "clean": -5},
}

app = Flask(__name__)
CORS(app)  # povolí Reactu volať API

ADMIN_ID = 1 

destroy()
init_db() # INITIALIZE DB (NOTHING HAPPENS IF INITIALIZED)
create_default_user() # admin, `id`` is 1
creature_id = create_default_creature() # ``id`` is 1

clean_inventory(ADMIN_ID)

cheese_id = add_ingredient("Cheese")
soap_id = add_ingredient("Soap")
energy_drink_id = add_ingredient("Energy Drink")

add_to_inventory(ADMIN_ID, cheese_id, 10)
add_to_inventory(ADMIN_ID, soap_id, 5)
add_to_inventory(ADMIN_ID, energy_drink_id, 3)

ensure_pinball_row(ADMIN_ID)   # ensure pinball row for admin user

# see get_achievements api
#remove_all_achievements()
create_default_achievements(ADMIN_ID)
data = list_achievements(ADMIN_ID)

@app.route("/feed", methods=["POST"])
def feed():
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "not found"}), 404

    updated =update_creature_state(creature_id, clean=creature["clean"]-5, hunger=creature["hunger"]+10)
    return jsonify(updated)

@app.route("/clean", methods=["POST"])
def clean():
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "not found"}), 404
    updated = update_creature_state(creature_id, clean=creature["clean"]+25)
    return jsonify(updated)  

@app.route("/sleep", methods=["POST"])
def sleep():
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "not found"}), 404
    updated = update_creature_state(creature_id, hunger=creature["hunger"]-15, energy=creature["energy"]+100)
    return jsonify(updated)  

@app.route("/exercise", methods=["POST"])
def exercise():
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "not found"}), 404
    updated = update_creature_state(creature_id, clean=creature["clean"]-10, energy=creature["energy"]-25)
    return jsonify(updated)  

@app.route("/state")
def get_state():
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "creature not found"}), 404
    return jsonify(creature)

@app.route("/inventory")
def get_inventory_api():
    """Získá inventář pro výchozího uživatele."""
    inventory_data = get_inventory(ADMIN_ID)
    return jsonify({"items": inventory_data})

@app.route("/use_item/<item_name>", methods=["POST"])
def use_item_api(item_name):
    """Použije položku z inventáře a aplikuje její efekt na Kimiho."""
    
    ingredient_id = get_ingredient_by_name(item_name)
    if not ingredient_id:
        return jsonify({"message": f"Položka '{item_name}' nebyla nalezena v DB."}), 404

    # Special handling for saved pizzas stored as Ingredient with name "Pizza:<id>"
    if isinstance(item_name, str) and item_name.startswith("Pizza:"):
        # extract id
        try:
            pizza_id = int(item_name.split(':', 1)[1])
        except Exception:
            return jsonify({"message": "Neplatný formát Pizza ID."}), 400

        saved = get_saved_pizza(pizza_id)
        if not saved:
            return jsonify({"message": "Uložená pizza nenalezena."}), 404
        try:
            pizza_obj = json.loads(saved["pizza_data"]) if isinstance(saved["pizza_data"], str) else saved["pizza_data"]
        except Exception:
            return jsonify({"message": "Chyba při čtení dat pizzy."}), 500

        # compute effects from stored effects or derive from toppings
        effects = pizza_obj.get("effects") if isinstance(pizza_obj, dict) else None
        if effects is None:
            # fallback: compute from toppings array (including scale and /5 reduction)
            base_effects = {"hunger": 0, "clean": 0, "energy": 0}
            toppingTypes = set()
            for t in pizza_obj.get("toppings", []) or []:
                ttype = t.get("type") if isinstance(t, dict) else t
                scale = t.get("scale", 1) if isinstance(t, dict) else 1
                toppingTypes.add(ttype)
                e = TOPPING_EFFECTS.get(ttype, {})
                for k, v in e.items():
                    base_effects[k] = base_effects.get(k, 0) + (v * scale / 5)

            # compute recipe bonuses
            bonus_effects = {"hunger": 0, "clean": 0, "energy": 0}
            special_recipes = [
                {"required": ["tomato", "cheese"], "bonus": {"hunger": 10, "clean": 5}},
                {"required": ["tomato", "mushroom", "pepper"], "bonus": {"hunger": 8, "clean": 8, "energy": 3}},
                {"required": ["cheese", "bacon"], "bonus": {"hunger": 20, "clean": -3}},
                {"required": ["tomato", "cheese", "mushroom", "bacon"], "bonus": {"hunger": 30, "clean": 2, "energy": 5}},
                {"required": ["pepper", "bacon"], "bonus": {"hunger": 15, "energy": 10, "clean": -2}},
            ]
            for recipe in special_recipes:
                if all(t in toppingTypes for t in recipe["required"]):
                    for k, v in recipe["bonus"].items():
                        bonus_effects[k] = bonus_effects.get(k, 0) + v

            effects = {
                "hunger": int(base_effects["hunger"] + bonus_effects["hunger"]),
                "clean": int(base_effects["clean"] + bonus_effects["clean"]),
                "energy": int(base_effects["energy"] + bonus_effects["energy"]),
            }

        effect = effects
    else:
        effect = ITEM_EFFECTS.get(item_name)
        if not effect:
            return jsonify({"message": f"Položka '{item_name}' nemá definovaný herní efekt."}), 400

    # 1. KONTROLA: Ověřit, zda je položka v inventáři a má kladné množství
    inventory = get_inventory(ADMIN_ID)
    item_in_inventory = next((item for item in inventory if item['name'] == item_name), None)

    if not item_in_inventory or item_in_inventory['quantity'] <= 0:
        return jsonify({"message": f"Položka '{item_name}' není v inventáři, nebo je její množství 0."}), 400
    
    # 2. Načti aktuální stav Kimiho
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "Kimi not found"}), 404
        
    # 3. Aplikuj efekty
    new_clean = creature['clean'] + effect.get('clean', 0)
    new_energy = creature['energy'] + effect.get('energy', 0)
    new_hunger = creature['hunger'] + effect.get('hunger', 0)

    # 4. Aktualizuj stav Kimiho v DB (s clampingem 0-100)
    updated_state = update_creature_state(
        creature_id, 
        clean=new_clean, 
        energy=new_energy, 
        hunger=new_hunger
    )
    
    # 5. KONTROLA: Zda se stav úspěšně zapsal
    if updated_state is None:
        # TATO zpráva se zobrazí v konzoli serveru, pokud dojde k chybě
        print(f"!!! KRITICKÁ CHYBA: Selhání update_creature_state pro ID: {creature_id}")
        return jsonify({"error": "Chyba DB: Selhání aktualizace stavu Kimiho."}), 500

    # 6. POUZE PO ÚSPĚŠNÉ AKTUALIZACI: Odeber položku z inventáře (potvrzení použití)
    remove_from_inventory(ADMIN_ID, ingredient_id, 1)
    
    # 7. ÚSPĚCH: Vrátíme nový stav pro aktualizaci UI
    return jsonify(updated_state)

# --- PINBALL API ---
@app.route("/api/v1/pinball/state", methods=["GET"])
def pinball_state():
    ensure_pinball_row(ADMIN_ID)
    return jsonify(get_pinball_state(ADMIN_ID))

@app.route("/api/v1/pinball/hit", methods=["POST"])
def pinball_hit():
    data = request.get_json(force=True) or {}
    points = int(data.get("points", 0))
    ensure_pinball_row(ADMIN_ID)
    return jsonify(add_pinball_points(ADMIN_ID, points))

@app.route("/api/v1/pinball/ball_lost", methods=["POST"])
def pinball_ball_lost_endpoint():
    ensure_pinball_row(ADMIN_ID)
    return jsonify(pinball_ball_lost(ADMIN_ID))

@app.route("/api/v1/pinball/reset_record", methods=["POST"])
def pinball_reset_record():
    ensure_pinball_row(ADMIN_ID)
    return jsonify(reset_pinball_record(ADMIN_ID))

@app.route("/api/v1/pinball/extension_catcher", methods=["GET"])
def ext_catcher_get():
    ensure_pinball_row(ADMIN_ID)
    return jsonify(get_extension_catcher(ADMIN_ID))

@app.route("/api/v1/pinball/extension_catcher", methods=["POST"])
def ext_catcher_post():
    ensure_pinball_row(ADMIN_ID)
    data = request.get_json(force=True) or {}
    enabled = bool(data.get("enabled", False))
    return jsonify(set_extension_catcher(ADMIN_ID, enabled))


# --- PIZZA SAVE API ---
@app.route("/pizza/save", methods=["POST"])
def pizza_save():
    """Uloží JSON reprezentaci pizzy do DB a přidá ji jako položku do inventáře (jako "Custom Pizza <id>")."""
    data = request.get_json(force=True) or {}
    toppings = data.get("toppings")
    name = data.get("name") or "Custom Pizza"

    # basic validation
    if toppings is None:
        return jsonify({"error": "missing toppings"}), 400

    # save pizza blob
    try:
        # compute aggregated effects from toppings (including scale and /5 reduction)
        base_effects = {"hunger": 0, "clean": 0, "energy": 0}
        for t in toppings:
            ttype = t.get('type') if isinstance(t, dict) else t
            scale = t.get('scale', 1) if isinstance(t, dict) else 1
            e = TOPPING_EFFECTS.get(ttype, {})
            for k, v in e.items():
                base_effects[k] = base_effects.get(k, 0) + (v * scale / 5)

        # compute recipe bonuses
        toppingTypes = set(t.get('type') if isinstance(t, dict) else t for t in toppings)
        bonus_effects = {"hunger": 0, "clean": 0, "energy": 0}
        # Check all special recipes (hardcoded for now, or can fetch from SPECIAL_RECIPES if defined on backend)
        special_recipes = [
            {"required": ["tomato", "cheese"], "bonus": {"hunger": 10, "clean": 5}},
            {"required": ["tomato", "mushroom", "pepper"], "bonus": {"hunger": 8, "clean": 8, "energy": 3}},
            {"required": ["cheese", "bacon"], "bonus": {"hunger": 20, "clean": -3}},
            {"required": ["tomato", "cheese", "mushroom", "bacon"], "bonus": {"hunger": 30, "clean": 2, "energy": 5}},
            {"required": ["pepper", "bacon"], "bonus": {"hunger": 15, "energy": 10, "clean": -2}},
        ]
        for recipe in special_recipes:
            if all(t in toppingTypes for t in recipe["required"]):
                for k, v in recipe["bonus"].items():
                    bonus_effects[k] = bonus_effects.get(k, 0) + v

        # combine base + bonus and floor to int
        total_effects = {
            "hunger": int(base_effects["hunger"] + bonus_effects["hunger"]),
            "clean": int(base_effects["clean"] + bonus_effects["clean"]),
            "energy": int(base_effects["energy"] + bonus_effects["energy"]),
        }

        pizza_obj = {"name": name, "toppings": toppings, "effects": total_effects}
        pizza_json = json.dumps(pizza_obj)
        pizza_id = save_pizza(ADMIN_ID, name, pizza_json)
    except Exception as e:
        print("Failed to save pizza:", e)
        return jsonify({"error": "failed to save pizza"}), 500

    # create an ingredient representing this saved pizza so it can appear in inventory
    pizza_ingredient_name = f"Pizza:{pizza_id}"
    ingredient_id = add_ingredient(pizza_ingredient_name)
    add_to_inventory(ADMIN_ID, ingredient_id, 1)

    return jsonify({"pizza_id": pizza_id, "ingredient_name": pizza_ingredient_name})


@app.route("/pizza/saved")
def pizza_saved_list():
    data = list_saved_pizzas(ADMIN_ID)
    return jsonify({"saved": data})

# --- Achievements ----
@app.route("/get_achievements")
def get_achievements():
    data = list_achievements(ADMIN_ID)
    unlocked = []
    locked = []

    for each_id, name, progress, completed in data:
        if completed:
            unlocked.append(name)
        else:
            locked.append(name)

    return jsonify({"unlocked": unlocked, "locked": locked})


@app.route("/update_achievement/<int:achvmnt_id>/<int:new_progress>", methods=["POST"])
def update_achievement(achvmnt_id, new_progress):
    updated = update_achievement_progress(achvmnt_id, new_progress)
    if not updated:
        return jsonify({"error": "Achievement not found"}), 404

    ach_id, name, progress, target, completed = updated
    return jsonify({
        "id": ach_id,
        "name": name,
        "progress": progress,
        "target": target,
        "completed": bool(completed)
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)