from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "SkillHub Flask Backend Running"
    })

@app.route("/api/users", methods=["GET"])
def get_users():
    return jsonify({
        "users": [
            {"id": 1, "name": "Admin", "role": "admin"},
            {"id": 2, "name": "Staff", "role": "staff"},
            {"id": 3, "name": "Student", "role": "student"}
        ]
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)