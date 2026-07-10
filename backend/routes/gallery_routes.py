# backend/routes/gallery_routes.py
# API: GET /api/gallery → returns gallery items by category
# API: POST /api/gallery/seed → seeds default gallery items

from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

gallery_bp = Blueprint("gallery", __name__)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# ── GET gallery items ────────────────────────────────────────────────
@gallery_bp.route("/", methods=["GET"])
def get_gallery():
    db = get_db()
    category = request.args.get("category")   # ?category=powder / packing / closeup
    query = {"is_active": True}
    if category and category != "all":
        query["category"] = category
    items = list(db.gallery.find(query).sort("order", 1))
    return jsonify({"success": True, "data": [serialize(i) for i in items]})

# ── SEED default gallery items ───────────────────────────────────────
@gallery_bp.route("/seed", methods=["POST"])
def seed_gallery():
    db = get_db()
    if db.gallery.count_documents({}) > 0:
        return jsonify({"success": False, "message": "Gallery already seeded"}), 400

    # NOTE: 'image_url' → replace these with real image URLs/paths once you have product photos
    items = [
        {"title": "Fine Ground Powder",       "category": "powder",  "css_class": "gal-bowl1",  "image_url": "", "order": 1, "is_active": True},
        {"title": "Premium Packaging",        "category": "packing", "css_class": "gal-pouch1", "image_url": "", "order": 2, "is_active": True},
        {"title": "Close Up Texture",         "category": "closeup", "css_class": "gal-spoon",  "image_url": "", "order": 3, "is_active": True},
        {"title": "Stand-up Pouch",           "category": "packing", "css_class": "gal-pouch2", "image_url": "", "order": 4, "is_active": True},
        {"title": "Multani Mitti Pile",       "category": "powder",  "css_class": "gal-pile",   "image_url": "", "order": 5, "is_active": True},
        {"title": "Raw Stone Texture",        "category": "closeup", "css_class": "gal-texture","image_url": "", "order": 6, "is_active": True},
    ]
    for item in items:
        item["created_at"] = datetime.utcnow()

    db.gallery.insert_many(items)
    return jsonify({"success": True, "message": f"✅ {len(items)} gallery items seeded"})
