# backend/routes/contact_routes.py

from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

contact_bp = Blueprint("contact", __name__)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].strftime("%d %b %Y, %I:%M %p")
    return doc

@contact_bp.route("/", methods=["POST"])
def submit_contact():
    try:
        db   = get_db()
        data = request.get_json()

        print(f"\n📩 Contact form received: {data}")

        # Validation
        if not data.get("name") or not data.get("email") or not data.get("message"):
            return jsonify({
                "success": False,
                "message": "Name, Email aur Message required hain"
            }), 400

        inquiry = {
            "name":         data.get("name", "").strip(),
            "email":        data.get("email", "").strip().lower(),
            "phone":        data.get("phone", "").strip(),
            "inquiry_type": data.get("inquiryType", ""),
            "message":      data.get("message", "").strip(),
            "status":       "new",
            "created_at":   datetime.utcnow()
        }

        result = db.contacts.insert_one(inquiry)
        print(f"✅ Contact saved to MongoDB! ID: {result.inserted_id}")

        return jsonify({
            "success": True,
            "message": "Message received! We will contact you within 24 hours.",
            "id": str(result.inserted_id)
        }), 201

    except Exception as e:
        print(f"❌ Contact save error: {e}")
        return jsonify({
            "success": False,
            "message": f"Server error: {str(e)}"
        }), 500

@contact_bp.route("/", methods=["GET"])
def get_contacts():
    try:
        db       = get_db()
        contacts = list(db.contacts.find().sort("created_at", -1))
        return jsonify({
            "success": True,
            "count":   len(contacts),
            "data":    [serialize(c) for c in contacts]
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
