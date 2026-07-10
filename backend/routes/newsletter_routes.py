# backend/routes/newsletter_routes.py
# POST /api/newsletter/ — saves email subscription to MongoDB

from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from datetime import datetime

newsletter_bp = Blueprint("newsletter", __name__)

@newsletter_bp.route("/", methods=["POST"])
def subscribe():
    db   = get_db()
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    # Avoid duplicates
    if db.newsletter.find_one({"email": email}):
        return jsonify({"success": True, "message": "Already subscribed!"})
    db.newsletter.insert_one({"email": email, "subscribed_at": datetime.utcnow()})
    return jsonify({"success": True, "message": "Subscribed successfully!"})

@newsletter_bp.route("/", methods=["GET"])
def get_subscribers():
    db = get_db()
    subs = list(db.newsletter.find({}, {"_id": 0}))
    return jsonify({"success": True, "count": len(subs), "data": subs})
