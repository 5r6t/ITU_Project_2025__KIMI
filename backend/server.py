from flask import Flask, jsonify, request
from flask_cors import CORS
from database import *


app = Flask(__name__)
CORS(app)  # povolí Reactu volať API

ADMIN_ID = 1 

init_db()
create_default_user()
creature_id = create_creature(owner_id=ADMIN_ID)

@app.route("/feed", methods=["POST"])
def feed():
    creature = get_creature(creature_id)
    if not creature:
        return jsonify({"error": "not found"}), 404

    update_creature_state(creature_id, clean=creature["clean"]-5, hunger=creature["hunger"]+10)
    return jsonify(creature)

@app.route("/state")
def get_state():
    row = get_creature(creature_id)
    if not row:
        return jsonify({"error": "creature not found"}), 404

    clean, energy, hunger = row

    return jsonify({
        "hunger": hunger,
        "clean": clean,
        "energy": energy
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
