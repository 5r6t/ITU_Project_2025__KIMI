from flask import Flask, jsonify, request
from flask_cors import CORS
from database import *


ITEM_EFFECTS = {
    "Cheese": {"hunger": 20, "clean": -5},
    "Soap": {"clean": 30},
    "Energy Drink": {"energy": 40, "clean": -5},
    # Přidejte další ingredience, které chcete mít v inventáři
}

app = Flask(__name__)
CORS(app)  # povolí Reactu volať API

ADMIN_ID = 1 

init_db() # INITIALIZE DB (NOTHING HAPPENS IF INITIALIZED)
create_default_user() # admin, `id`` is 1
creature_id = create_default_creature() # ``id`` is1

clean_inventory(ADMIN_ID)

cheese_id = add_ingredient("Cheese")
soap_id = add_ingredient("Soap")
energy_drink_id = add_ingredient("Energy Drink")

add_to_inventory(ADMIN_ID, cheese_id, 10)
add_to_inventory(ADMIN_ID, soap_id, 5)
add_to_inventory(ADMIN_ID, energy_drink_id, 3)

ensure_pinball_row(ADMIN_ID)   # ensure pinball row for admin user

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

if __name__ == "__main__":
    app.run(debug=True, port=5000)
