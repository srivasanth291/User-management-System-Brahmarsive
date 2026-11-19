from flask import Flask, jsonify
from flask_app.routes.auth import auth_bp
from shared.security import verify_password, create_access_token
app = Flask(__name__)
app.register_blueprint(
    auth_bp,
    url_prefix="/api/auth"
)

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