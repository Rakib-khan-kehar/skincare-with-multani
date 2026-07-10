# backend/routes/faq_routes.py
# API: GET /api/faq → returns all active FAQs
# API: POST /api/faq/seed → seeds default FAQs

from flask import Blueprint, jsonify
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

faq_bp = Blueprint("faq", __name__)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# ── GET all FAQs ─────────────────────────────────────────────────────
@faq_bp.route("/", methods=["GET"])
def get_faqs():
    db = get_db()
    faqs = list(db.faqs.find({"is_active": True}).sort("order", 1))
    return jsonify({"success": True, "data": [serialize(f) for f in faqs]})

# ── SEED default FAQs ────────────────────────────────────────────────
@faq_bp.route("/seed", methods=["POST"])
def seed_faqs():
    db = get_db()
    if db.faqs.count_documents({}) > 0:
        return jsonify({"success": False, "message": "FAQs already seeded"}), 400

    faqs = [
        {
            "question": "What is the shipping time?",
            "answer": "Orders are dispatched within 24-48 hours and delivered within 3-7 business days across India.",
            "order": 1, "is_active": True, "created_at": datetime.utcnow()
        },
        {
            "question": "Do you offer wholesale or bulk pricing?",
            "answer": "Yes! We offer special bulk pricing for retailers, salons, and manufacturers. Message us on WhatsApp with your required quantity for a custom quote.",
            "order": 2, "is_active": True, "created_at": datetime.utcnow()
        },
        {
            "question": "What is your return policy?",
            "answer": "We accept returns within 7 days for unopened, unused products. Damaged or incorrect orders are replaced free of charge.",
            "order": 3, "is_active": True, "created_at": datetime.utcnow()
        },
        {
            "question": "How should I use Multani Mitti powder?",
            "answer": "Mix 2 tablespoons with rose water or plain water to form a paste, apply evenly on clean skin, leave for 10-15 minutes, then rinse with lukewarm water.",
            "order": 4, "is_active": True, "created_at": datetime.utcnow()
        },
        {
            "question": "Is the packaging eco-friendly?",
            "answer": "Our pouches are made from food-grade, resealable material designed to preserve freshness while minimizing waste.",
            "order": 5, "is_active": True, "created_at": datetime.utcnow()
        },
        {
            "question": "Do you ship internationally?",
            "answer": "Currently we ship across India. For international inquiries, please contact us on WhatsApp or email.",
            "order": 6, "is_active": True, "created_at": datetime.utcnow()
        }
    ]
    db.faqs.insert_many(faqs)
    return jsonify({"success": True, "message": f"✅ {len(faqs)} FAQs seeded"})
