from flask import Flask, jsonify, request
from flask_cors import CORS
from database import *


app = Flask(__name__)
CORS(app)  # povolí Reactu volať API

ADMIN_ID = 1 

init_db() # INITIALIZE DB (NOTHING HAPPENS IF INITIALIZED)
create_default_user() # admin, `id`` is 1
creature_id = create_default_creature() # ``id`` is1
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

if __name__ == "__main__":
    app.run(debug=True, port=5000)
