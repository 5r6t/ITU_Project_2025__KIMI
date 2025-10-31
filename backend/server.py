from flask import Flask, jsonify, request
from flask_cors import CORS
from pou_state import PouState

app = Flask(__name__)
CORS(app)  # povolí Reactu volať API

state = PouState()

@app.route("/feed", methods=["POST"])
def feed():
    state.feed()
    return jsonify(state.to_dict())

@app.route("/state")
def get_state():
    return jsonify(state.to_dict())

if __name__ == "__main__":
    app.run(debug=True, port=5000)
