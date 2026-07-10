# backend/routes/review_routes.py

from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

review_bp = Blueprint("reviews", __name__)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].strftime("%d %b %Y")
    return doc

# GET — only approved reviews shown on frontend
@review_bp.route("/", methods=["GET"])
def get_reviews():
    try:
        db      = get_db()
        reviews = list(db.reviews.find({"status": "approved"}).sort("created_at", -1))
        print(f"📋 Fetching reviews: {len(reviews)} approved found")
        return jsonify({"success": True, "data": [serialize(r) for r in reviews]})
    except Exception as e:
        print(f"❌ Get reviews error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# POST — customer submits review (saved as pending, admin approves)
@review_bp.route("/", methods=["POST"])
def submit_review():
    try:
        db   = get_db()
        data = request.get_json()

        print(f"\n⭐ Review received: {data}")

        if not data.get("name") or not data.get("review"):
            return jsonify({
                "success": False,
                "message": "Name aur Review required hain"
            }), 400

        review = {
            "name":       data.get("name", "").strip(),
            "initials":   data.get("name", "")[:2].upper(),
            "location":   data.get("location", "").strip(),
            "rating":     int(data.get("rating", 5)),
            "review":     data.get("review", "").strip(),
            "status":     "pending",  # admin se approve hoga
            "created_at": datetime.utcnow()
        }

        result = db.reviews.insert_one(review)
        print(f"✅ Review saved to MongoDB! ID: {result.inserted_id}")

        return jsonify({
            "success": True,
            "message": "Review submit ho gaya! Approval ke baad publish hoga.",
            "id":      str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"❌ Review save error: {e}")
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

# GET all reviews — admin use (all statuses)
@review_bp.route("/all", methods=["GET"])
def get_all_reviews():
    try:
        db      = get_db()
        reviews = list(db.reviews.find().sort("created_at", -1))
        return jsonify({"success": True, "count": len(reviews), "data": [serialize(r) for r in reviews]})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# PATCH — approve or reject a review
@review_bp.route("/<review_id>/status", methods=["PATCH"])
def update_review_status(review_id):
    try:
        db     = get_db()
        data   = request.get_json()
        status = data.get("status")
        if status not in ["approved", "rejected", "pending"]:
            return jsonify({"success": False, "message": "Invalid status"}), 400
        db.reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        print(f"✅ Review {review_id} status → {status}")
        return jsonify({"success": True, "message": f"Review status updated to '{status}'"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
