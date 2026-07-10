# backend/routes/cart_routes.py
from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from backend.routes.user_routes import get_user_from_token
from datetime import datetime

cart_bp = Blueprint("cart", __name__)

def get_cart_data(db, user_id):
    cart = db.carts.find_one({"user_id": user_id}) or {"items":[]}
    items = cart.get("items",[])
    subtotal = sum(i["price"]*i["qty"] for i in items)
    delivery = 0 if subtotal >= 499 else (50 if subtotal > 0 else 0)
    return {"items":items,"subtotal":subtotal,"delivery_charge":delivery,
            "total":subtotal+delivery,"item_count":sum(i["qty"] for i in items)}

@cart_bp.route("/", methods=["GET"])
def get_cart():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        return jsonify({"success":True,"data":get_cart_data(db,uid)})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@cart_bp.route("/add", methods=["POST"])
def add_to_cart():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        data = request.get_json()
        new_item = {"product_name":data["product_name"],"weight":data["weight"],
                    "price":int(data["price"]),"qty":int(data.get("qty",1)),
                    "image":data.get("image","images/products/product-pouch.jpg")}
        cart = db.carts.find_one({"user_id":uid})
        if not cart:
            db.carts.insert_one({"user_id":uid,"items":[new_item],"updated_at":datetime.utcnow()})
        else:
            items = cart.get("items",[])
            ex = next((i for i in items if i["product_name"]==new_item["product_name"] and i["weight"]==new_item["weight"]),None)
            if ex: ex["qty"] += new_item["qty"]
            else: items.append(new_item)
            db.carts.update_one({"user_id":uid},{"$set":{"items":items,"updated_at":datetime.utcnow()}})
        return jsonify({"success":True,"message":"Item added to cart!"})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@cart_bp.route("/update", methods=["PATCH"])
def update_cart():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        data = request.get_json()
        cart = db.carts.find_one({"user_id":uid})
        if not cart: return jsonify({"success":False,"message":"Cart not found"}), 404
        items = cart.get("items",[])
        for i in items:
            if i["product_name"]==data["product_name"] and i["weight"]==data["weight"]:
                i["qty"] = int(data["qty"]); break
        db.carts.update_one({"user_id":uid},{"$set":{"items":items,"updated_at":datetime.utcnow()}})
        return jsonify({"success":True,"data":get_cart_data(db,uid)})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@cart_bp.route("/remove", methods=["DELETE"])
def remove_from_cart():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        data = request.get_json()
        cart = db.carts.find_one({"user_id":uid})
        if not cart: return jsonify({"success":False,"message":"Cart not found"}), 404
        items = [i for i in cart.get("items",[]) if not(i["product_name"]==data["product_name"] and i["weight"]==data["weight"])]
        db.carts.update_one({"user_id":uid},{"$set":{"items":items,"updated_at":datetime.utcnow()}})
        return jsonify({"success":True,"data":get_cart_data(db,uid)})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@cart_bp.route("/clear", methods=["DELETE"])
def clear_cart():
    try:
        db = get_db(); uid = get_user_from_token(request)
        if not uid: return jsonify({"success":False,"message":"Login required"}), 401
        db.carts.update_one({"user_id":uid},{"$set":{"items":[],"updated_at":datetime.utcnow()}})
        return jsonify({"success":True,"message":"Cart cleared!"})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500
