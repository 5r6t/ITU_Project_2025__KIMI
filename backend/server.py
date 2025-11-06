from flask import Flask, jsonify, request
from flask_cors import CORS
from pou_state import PouState

app = Flask(__name__)
CORS(app)  # povolí Reactu volať API

state = PouState()

# Původní endpoint pro krmení
@app.route("/feed", methods=["POST"])
def feed():
    state.feed()
    return jsonify(state.to_dict())

# Původní endpoint pro získání stavu
@app.route("/state")
def get_state():
    return jsonify(state.to_dict())

# --- Nové endpointy pro Inventář ---

@app.route("/inventory")
def get_inventory():
    """Vrátí obsah inventáře."""
    return jsonify(state.inventory.to_dict())

@app.route("/use_item/<int:item_id>", methods=["POST"])
def use_item(item_id):
    """Použije položku s daným ID."""
    if state.use_item(item_id):
        # Vracíme stav Poua, protože se změnil
        return jsonify(state.to_dict())
    else:
        return jsonify({"message": "Item not found or unavailable"}), 404

if __name__ == "__main__":
    app.run(debug=True, port=5000)