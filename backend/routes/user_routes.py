# backend/routes/user_routes.py
from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from datetime import datetime
from bson import ObjectId
import hashlib, secrets

user_bp = Blueprint("users", __name__)
active_tokens = {}

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()
def generate_token(): return secrets.token_hex(32)
def get_user_from_token(req):
    token = req.headers.get("Authorization","").replace("Bearer ","")
    return active_tokens.get(token)

def ser(doc):
    doc["_id"] = str(doc["_id"])
    doc.pop("password", None)
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].strftime("%d %b %Y")
    return doc

@user_bp.route("/register", methods=["POST"])
def register():
    try:
        db = get_db(); data = request.get_json()
        if not data.get("name") or not data.get("email") or not data.get("password"):
            return jsonify({"success":False,"message":"Name, Email aur Password required"}), 400
        if len(data["password"]) < 6:
            return jsonify({"success":False,"message":"Password 6+ characters hona chahiye"}), 400
        if db.users.find_one({"email": data["email"].lower().strip()}):
            return jsonify({"success":False,"message":"Email already registered hai"}), 400
        user = {"name":data["name"].strip(),"email":data["email"].strip().lower(),
                "phone":data.get("phone","").strip(),"password":hash_password(data["password"]),
                "role":"customer","created_at":datetime.utcnow()}
        result = db.users.insert_one(user)
        token = generate_token()
        active_tokens[token] = str(result.inserted_id)
        print(f"✅ User registered: {user['email']}")
        return jsonify({"success":True,"message":"Registration successful!","token":token,
            "user":{"id":str(result.inserted_id),"name":user["name"],"email":user["email"],"role":user["role"]}}), 201
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@user_bp.route("/login", methods=["POST"])
def login():
    try:
        db = get_db(); data = request.get_json()
        if not data.get("email") or not data.get("password"):
            return jsonify({"success":False,"message":"Email aur Password required"}), 400
        user = db.users.find_one({"email":data["email"].lower().strip(),"password":hash_password(data["password"])})
        if not user:
            return jsonify({"success":False,"message":"Email ya Password galat hai"}), 401
        token = generate_token()
        active_tokens[token] = str(user["_id"])
        print(f"✅ Login: {user['email']}")
        return jsonify({"success":True,"message":"Login successful!","token":token,
            "user":{"id":str(user["_id"]),"name":user["name"],"email":user["email"],"role":user["role"]}})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@user_bp.route("/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization","").replace("Bearer ","")
    active_tokens.pop(token, None)
    return jsonify({"success":True,"message":"Logged out"})

@user_bp.route("/profile", methods=["GET"])
def profile():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        user = db.users.find_one({"_id":ObjectId(uid)})
        if not user: return jsonify({"success":False,"message":"User not found"}), 404
        return jsonify({"success":True,"data":ser(user)})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@user_bp.route("/orders", methods=["GET"])
def user_orders():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        user = db.users.find_one({"_id":ObjectId(uid)})
        orders = list(db.orders.find({"customer.email":user["email"]}).sort("created_at",-1))
        def so(d):
            d["_id"]=str(d["_id"])
            if isinstance(d.get("created_at"),datetime): d["created_at"]=d["created_at"].strftime("%d %b %Y, %I:%M %p")
            return d
        return jsonify({"success":True,"count":len(orders),"data":[so(o) for o in orders]})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@user_bp.route("/all", methods=["GET"])
def all_users():
    try:
        db = get_db()
        users = list(db.users.find({},{"password":0}).sort("created_at",-1))
        return jsonify({"success":True,"count":len(users),"data":[ser(u) for u in users]})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500
