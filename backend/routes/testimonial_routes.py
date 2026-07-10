# backend/routes/testimonial_routes.py
# API: GET /api/testimonials → returns active testimonials
# API: POST /api/testimonials/seed → seeds default testimonials

from flask import Blueprint, jsonify
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

testimonial_bp = Blueprint("testimonials", __name__)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# ── GET all active testimonials ──────────────────────────────────────
@testimonial_bp.route("/", methods=["GET"])
def get_testimonials():
    db = get_db()
    testimonials = list(db.testimonials.find({"is_active": True}).sort("created_at", -1))
    return jsonify({"success": True, "data": [serialize(t) for t in testimonials]})

# ── SEED default testimonials ────────────────────────────────────────
@testimonial_bp.route("/seed", methods=["POST"])
def seed_testimonials():
    db = get_db()
    if db.testimonials.count_documents({}) > 0:
        return jsonify({"success": False, "message": "Testimonials already seeded"}), 400

    testimonials = [
        {
            "name": "Neha Sharma",
            "initials": "NS",
            "rating": 5,
            "review": "This Multani Mitti is amazing! My skin feels so fresh and oil-free. Highly recommended.",
            "verified": True,
            "location": "Mumbai",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Priya Verma",
            "initials": "PV",
            "rating": 5,
            "review": "Best quality powder I have ever used. Packaging is also very premium. Will buy again!",
            "verified": True,
            "location": "Delhi",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Ankit Singh",
            "initials": "AS",
            "rating": 5,
            "review": "Helped me a lot with acne & blemishes. Skin is visibly clearer after 2 weeks of use.",
            "verified": True,
            "location": "Jaipur",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "name": "Riya Mehta",
            "initials": "RM",
            "rating": 5,
            "review": "Used it as a hair mask too — scalp feels so much cleaner. Great natural product.",
            "verified": True,
            "location": "Pune",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    db.testimonials.insert_many(testimonials)
    return jsonify({"success": True, "message": f"✅ {len(testimonials)} testimonials seeded"})
