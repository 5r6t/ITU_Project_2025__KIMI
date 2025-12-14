from flask import Flask, jsonify, request
import json
from flask_cors import CORS
from database import *

ITEM_EFFECTS = {
    "Cheese": {"hunger": 20, "clean": -5},
    "Soap": {"clean": 30},
    "Energy Drink": {"energy": 40, "clean": -5},
}

TOPPING_EFFECTS = {
    "tomato": {"hunger": 8, "clean": 2},
    "cheese": {"hunger": 18},
    "mushroom": {"hunger": 6, "clean": 1},
    "pepper": {"hunger": 4, "energy": 2},
    "bacon": {"hunger": 25, "clean": -5},
}

app = Flask(__name__)
CORS(app)

ADMIN_ID = 1 

destroy()
init_db()
create_default_user()
creature_id = create_default_creature()

clean_inventory(ADMIN_ID)

cheese_id = add_ingredient("Cheese")
soap_id = add_ingredient("Soap")
energy_drink_id = add_ingredient("Energy Drink")

add_to_inventory(ADMIN_ID, cheese_id, 10)
add_to_inventory(ADMIN_ID, soap_id, 5)
add_to_inventory(ADMIN_ID, energy_drink_id, 3)

ensure_pinball_row(ADMIN_ID)
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
    inventory_data = get_inventory(ADMIN_ID)
    enriched_inventory = []
    
    for item in inventory_data:
        item_detail = item.copy()
        name = item_detail.get("name", "")

        if isinstance(name, str) and ":" in name and "://" not in name:
            parts = name.split(":")
            candidate_id = parts[-1]
            if candidate_id.isdigit():
                pizza_id = int(candidate_id)
                saved_pizza = get_saved_pizza(pizza_id)
                if saved_pizza:
                    try:
                        pizza_json = saved_pizza["pizza_data"]
                        pizza_obj = json.loads(pizza_json) if isinstance(pizza_json, str) else pizza_json
                        item_detail["toppings"] = pizza_obj.get("toppings", [])
                        item_detail["pizza_color"] = pizza_obj.get("pizza_color")
                        item_detail["display_name"] = pizza_obj.get("name", name.split(":")[0])
                        item_detail["effects"] = pizza_obj.get("effects", {}) 
                    except Exception as e:
                        print(f"Chyba při parsování pizzy {pizza_id}: {e}")
        enriched_inventory.append(item_detail)

    return jsonify({"items": enriched_inventory})

@app.route("/use_item/<item_name>", methods=["POST"])
def use_item_api(item_name):
    ingredient_id = get_ingredient_by_name(item_name)
    if not ingredient_id:
        return jsonify({"message": f"Položka '{item_name}' nebyla nalezena v DB."}), 404

    pizza_id = None
    if isinstance(item_name, str) and ":" in item_name and "://" not in item_name:
        candidate = item_name.split(":")[-1]
        if candidate.isdigit():
            pizza_id = int(candidate)

    if pizza_id is not None:
        saved = get_saved_pizza(pizza_id)
        if not saved:
            return jsonify({"message": "Uložená pizza nenalezena."}), 404
        try:
            pizza_obj = json.loads(saved["pizza_data"]) if isinstance(saved["pizza_data"], str) else saved["pizza_data"]
        except Exception:
            return jsonify({"message": "Chyba při čtení dat pizzy."}), 500

        effects = pizza_obj.get("effects") if isinstance(pizza_obj, dict) else None
        if effects is None:
            base_effects = {"hunger": 0, "clean": 0, "energy": 0}
            toppingTypes = set()
            for t in pizza_obj.get("toppings", []) or []:
                ttype = t.get("type") if isinstance(t, dict) else t
                scale = t.get("scale", 1) if isinstance(t, dict) else 1
                toppingTypes.add(ttype)
                e = TOPPING_EFFECTS.get(ttype, {})
                for k, v in e.items():
                    base_effects[k] = base_effects.get(k, 0) + (v * scale / 5)

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

    inventory = get_inventory(ADMIN_ID)
    item_in_inventory = next((item for item in inventory if item['name'] == item_name), None)

    if not item_in_inventory or item_in_inventory['quantity'] <= 0:
        return jsonify({"message": f"Položka '{item_name}' není v inventáři, nebo je její množství 0."}), 400
    
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "Kimi not found"}), 404
        
    new_clean = creature['clean'] + effect.get('clean', 0)
    new_energy = creature['energy'] + effect.get('energy', 0)
    new_hunger = creature['hunger'] + effect.get('hunger', 0)

    updated_state = update_creature_state(
        creature_id, 
        clean=new_clean, 
        energy=new_energy, 
        hunger=new_hunger
    )
    
    if updated_state is None:
        return jsonify({"error": "Chyba DB: Selhání aktualizace stavu Kimiho."}), 500

    remove_from_inventory(ADMIN_ID, ingredient_id, 1)
    return jsonify(updated_state)

# --- PINBALL ENDPOINTS ---

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

@app.route("/api/v1/pinball/cheat_money", methods=["POST"])
def pinball_cheat_money():
    ensure_pinball_row(ADMIN_ID)
    new_money = add_pinball_money(ADMIN_ID, 1000)
    return jsonify({"money": new_money})

@app.route("/api/v1/pinball/place_item", methods=["POST"])
def pinball_place_item():
    ensure_pinball_row(ADMIN_ID)
    data = request.get_json(force=True)
    item_type = data.get("type")
    x = data.get("x")
    y = data.get("y")
    price = data.get("price", 0)
    
    result = buy_pinball_item(ADMIN_ID, item_type, x, y, price)
    if not result:
        return jsonify({"error": "Not enough money"}), 400
    return jsonify(result)

@app.route("/api/v1/pinball/move_item", methods=["POST"])
def pinball_move_item():
    ensure_pinball_row(ADMIN_ID)
    data = request.get_json(force=True)
    item_id = data.get("item_id")
    x = data.get("x")
    y = data.get("y")
    
    move_pinball_item(ADMIN_ID, item_id, x, y)
    return jsonify({"success": True})

@app.route("/api/v1/pinball/remove_item", methods=["POST"])
def pinball_remove_item():
    ensure_pinball_row(ADMIN_ID)
    data = request.get_json(force=True)
    item_id = data.get("item_id")
    price = data.get("price", 0)
    
    result = remove_pinball_item(ADMIN_ID, item_id, price)
    return jsonify(result)

# --- WALLBALL ENDPOINTS ---

@app.route('/api/v1/wallball/progress', methods=['GET'])
def get_wallball_progress_api():
    level = get_wallball_progress_db(ADMIN_ID)
    return jsonify({"max_unlocked_level": level})

@app.route('/api/v1/wallball/complete_level', methods=['POST'])
def complete_wallball_level_api():
    data = request.json
    completed_level_id = data.get('level_id')
    
    if not completed_level_id:
        return jsonify({"success": False}), 400

    # Odemkneme level + 1
    new_max = update_wallball_progress_db(ADMIN_ID, completed_level_id + 1)
    
    return jsonify({
        "success": True, 
        "next_level_unlocked": True, # Zjednodušeno
        "max_unlocked_level": new_max
    })

@app.route('/api/v1/wallball/level_state/<int:level_id>', methods=['GET'])
def get_wallball_level_state_api(level_id):
    pieces = get_wallball_level_pieces(ADMIN_ID, level_id)
    return jsonify({"pieces": pieces})

@app.route('/api/v1/wallball/place_piece', methods=['POST'])
def place_wallball_piece_api():
    data = request.get_json(force=True)
    level_id = data.get("level_id")
    piece_type = data.get("type")
    col = data.get("col")
    row = data.get("row")
    
    add_wallball_piece(ADMIN_ID, level_id, piece_type, col, row)
    return jsonify({"success": True})

@app.route('/api/v1/wallball/remove_piece', methods=['POST'])
def remove_wallball_piece_api():
    data = request.get_json(force=True)
    level_id = data.get("level_id")
    col = data.get("col")
    row = data.get("row")
    
    remove_wallball_piece(ADMIN_ID, level_id, col, row)
    return jsonify({"success": True})

@app.route('/api/v1/wallball/reset_level', methods=['POST'])
def reset_wallball_level_api():
    data = request.get_json(force=True)
    level_id = data.get("level_id")
    
    clear_wallball_level(ADMIN_ID, level_id)
    return jsonify({"success": True})

# --- BRICK BREAKER ENDPOINTS ---

@app.route("/api/breaker/stats", methods=["GET"])
def breaker_stats():
    return jsonify(get_breaker_stats(ADMIN_ID))

@app.route("/api/breaker/save", methods=["POST"])
def breaker_save():
    data = request.get_json(force=True) or {}
    score = data.get("score", 0)
    updated_stats = update_breaker_score(ADMIN_ID, score)
    return jsonify(updated_stats)

@app.route("/api/breaker/powerups", methods=["GET"])
def breaker_powerups_get():
    return jsonify(get_breaker_powerups(ADMIN_ID))

@app.route("/api/breaker/powerups", methods=["POST"])
def breaker_powerups_post():
    data = request.get_json(force=True) or {}
    enabled = bool(data.get("enabled", False))
    return jsonify(set_breaker_powerups(ADMIN_ID, enabled))

@app.route("/api/breaker/progress", methods=["GET"])
def breaker_progress_get():
    return jsonify(get_breaker_progress(ADMIN_ID))

@app.route("/api/breaker/progress", methods=["POST"])
def breaker_progress_post():
    data = request.get_json(force=True) or {}
    world_index = int(data.get("worldIndex", 0))
    return jsonify(update_breaker_progress(ADMIN_ID, world_index))

@app.route("/api/breaker/state", methods=["POST"])
def breaker_save_state_endpoint():
    """Uloží kompletní stav hry jako JSON."""
    data = request.get_json(force=True)
    save_breaker_state(ADMIN_ID, json.dumps(data))
    return jsonify({"success": True})

@app.route("/api/breaker/state", methods=["GET"])
def breaker_load_state_endpoint():
    """Načte uložený stav hry."""
    json_str = load_breaker_state(ADMIN_ID)
    if not json_str:
        return jsonify({"state": None})
    try:
        state = json.loads(json_str)
        return jsonify({"state": state})
    except Exception as e:
        print(f"Chyba parsování Breaker state: {e}")
        return jsonify({"state": None})

@app.route("/api/breaker/state", methods=["DELETE"])
def breaker_clear_state_endpoint():
    """Smaže uloženou hru (např. po Game Over)."""
    clear_breaker_state(ADMIN_ID)
    return jsonify({"success": True})

# --- SOLITAIRE ENDPOINTS ---

@app.route("/api/solitaire/state", methods=["GET"])
def solitaire_state_get():
    state = get_solitaire_state(ADMIN_ID)
    return jsonify({"state": state})

@app.route("/api/solitaire/save", methods=["POST"])
def solitaire_state_save():
    data = request.get_json(force=True) or {}
    state = data.get("state")
    if state is None:
        return jsonify({"error": "missing state"}), 400
    try:
        save_solitaire_state(ADMIN_ID, state)
        return jsonify({"success": True})
    except Exception as e:
        print("Failed to save solitaire state:", e)
        return jsonify({"error": "failed to save"}), 500

# --- PIZZA ENDPOINTS ---

@app.route("/pizza/save", methods=["POST"])
def pizza_save():
    data = request.get_json(force=True) or {}
    toppings = data.get("toppings")
    name = data.get("name") or "Custom Pizza"

    if toppings is None:
        return jsonify({"error": "missing toppings"}), 400

    bake_result = data.get('bake_result')
    score = data.get('score')

    try:
        base_effects = {"hunger": 0, "clean": 0, "energy": 0}
        for t in toppings:
            ttype = t.get('type') if isinstance(t, dict) else t
            scale = t.get('scale', 1) if isinstance(t, dict) else 1
            e = TOPPING_EFFECTS.get(ttype, {})
            for k, v in e.items():
                base_effects[k] = base_effects.get(k, 0) + (v * scale / 5)

        toppingTypes = set(t.get('type') if isinstance(t, dict) else t for t in toppings)
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

        total_effects = {
            "hunger": int(base_effects["hunger"] + bonus_effects["hunger"]),
            "clean": int(base_effects["clean"] + bonus_effects["clean"]),
            "energy": int(base_effects["energy"] + bonus_effects["energy"]),
        }

        if bake_result and isinstance(bake_result, dict):
            classification = bake_result.get("classification", "ok")
            multiplier = 1.0
            if classification == "perfect":
                multiplier = 1.3
            elif classification == "good":
                multiplier = 1.1
            elif classification in ["undercooked", "burnt"]:
                multiplier = 0.7
            for key in total_effects:
                total_effects[key] = int(total_effects[key] * multiplier)

        pizza_obj = {"name": name, "toppings": toppings, "effects": total_effects}
        if bake_result is not None:
            pizza_obj["bake_result"] = bake_result
        if score is not None:
            try:
                pizza_obj["score"] = int(score)
            except Exception:
                pizza_obj["score"] = score
        pizza_color = data.get('pizza_color')
        if pizza_color is not None:
            pizza_obj["pizza_color"] = pizza_color
        pizza_json = json.dumps(pizza_obj)
        pizza_id = save_pizza(ADMIN_ID, name, pizza_json)
    except Exception as e:
        print("Failed to save pizza:", e)
        return jsonify({"error": "failed to save pizza"}), 500

    pizza_ingredient_name = f"{name}:{pizza_id}"
    ingredient_id = add_ingredient(pizza_ingredient_name)
    add_to_inventory(ADMIN_ID, ingredient_id, 1)

    return jsonify({"pizza_id": pizza_id, "ingredient_name": pizza_ingredient_name})

@app.route("/pizza/saved")
def pizza_saved_list():
    data = list_saved_pizzas(ADMIN_ID)
    return jsonify({"saved": data})

@app.route("/pizza/preview", methods=["POST"])
def pizza_preview():
    data = request.get_json(force=True) or {}
    toppings = data.get("toppings", [])
    
    if not toppings:
        return jsonify({"error": "missing toppings"}), 400
    
    try:
        base_effects = {"hunger": 0, "clean": 0, "energy": 0}
        for t in toppings:
            ttype = t.get('type') if isinstance(t, dict) else t
            scale = t.get('scale', 1) if isinstance(t, dict) else 1
            e = TOPPING_EFFECTS.get(ttype, {})
            for k, v in e.items():
                base_effects[k] = base_effects.get(k, 0) + (v * scale / 5)

        toppingTypes = set(t.get('type') if isinstance(t, dict) else t for t in toppings)
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

        total_effects = {
            "hunger": int(base_effects["hunger"] + bonus_effects["hunger"]),
            "clean": int(base_effects["clean"] + bonus_effects["clean"]),
            "energy": int(base_effects["energy"] + bonus_effects["energy"]),
        }
        
        return jsonify({"toppings": toppings, "effects": total_effects})
    except Exception as e:
        print("Failed to preview pizza:", e)
        return jsonify({"error": "failed to preview pizza"}), 500

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

    return jsonify(updated)

@app.route("/reset_achievements", methods=["POST"])
def reset_achievements():
    """Wipe and recreate achievements for the admin user."""
    remove_all_achievements()
    create_default_achievements(ADMIN_ID)

    data = list_achievements(ADMIN_ID)
    unlocked = []
    locked = []

    for each_id, name, progress, completed in data:
        (unlocked if completed else locked).append(name)

    return jsonify({"success": True, "unlocked": unlocked, "locked": locked})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
