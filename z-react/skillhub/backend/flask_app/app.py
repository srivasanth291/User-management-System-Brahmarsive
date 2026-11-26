from flask import Flask, jsonify
from flask_cors import CORS

from flask_app.routes.auth import auth_bp

app = Flask(__name__)

# Allow React frontend to access Flask API
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:5175",
                "http://127.0.0.1:5176",
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
            ],
            "allow_headers": [
                "Content-Type",
                "Authorization",
            ],
        }
    },
)

# Register authentication routes
app.register_blueprint(
    auth_bp,
    url_prefix="/api/auth"
)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "SkillHub Flask Backend Running"
    })


if __name__ == "__main__":
    app.run(port=5000, debug=False)