# backend/routes/order_routes.py
from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

order_bp = Blueprint("orders", __name__)

def ser(doc):
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("created_at"),datetime): doc["created_at"]=doc["created_at"].strftime("%d %b %Y, %I:%M %p")
    if isinstance(doc.get("updated_at"),datetime): doc["updated_at"]=doc["updated_at"].strftime("%d %b %Y, %I:%M %p")
    return doc

@order_bp.route("/", methods=["POST"])
def place_order():
    try:
        db = get_db(); data = request.get_json()
        print(f"\n🛒 New order: {data.get('customer',{}).get('name','?')}")
        required = ["name","phone","address","items"]
        missing = [f for f in required if not data.get(f)]
        if missing: return jsonify({"success":False,"message":f"Missing: {', '.join(missing)}"}), 400
        items = data.get("items",[])
        subtotal = sum(i.get("price",0)*i.get("qty",1) for i in items)
        delivery = 0 if subtotal >= 499 else 50
        total = subtotal + delivery
        order = {
            "customer":{"name":data["name"].strip(),"phone":data["phone"].strip(),
                "email":data.get("email","").strip().lower(),"address":data["address"].strip(),
                "pincode":data.get("pincode","").strip(),"city":data.get("city","").strip()},
            "items":items,"subtotal":subtotal,"delivery_charge":delivery,"total_amount":total,
            "payment_method":data.get("paymentMethod","COD"),
            "payment_status":data.get("paymentStatus","pending"),
            "upi_ref":data.get("upiRef",""),
            "order_status":"placed","notes":data.get("notes",""),"created_at":datetime.utcnow()
        }
        result = db.orders.insert_one(order)
        oid = str(result.inserted_id)
        print(f"✅ Order saved! ID:{oid} Total:₹{total}")
        return jsonify({"success":True,"message":"Order placed!","order_id":oid,"total":total,"delivery_charge":delivery}), 201
    except Exception as e:
        print(f"❌ Order error: {e}")
        return jsonify({"success":False,"message":str(e)}), 500

@order_bp.route("/", methods=["GET"])
def get_orders():
    try:
        db = get_db()
        status = request.args.get("status")
        query = {}
        if status: query["order_status"] = status
        orders = list(db.orders.find(query).sort("created_at",-1))
        return jsonify({"success":True,"count":len(orders),"data":[ser(o) for o in orders]})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@order_bp.route("/<oid>/status", methods=["PATCH"])
def update_status(oid):
    try:
        db = get_db(); data = request.get_json()
        ns = data.get("order_status")
        if ns not in ["placed","confirmed","dispatched","delivered","cancelled"]:
            return jsonify({"success":False,"message":"Invalid status"}), 400
        db.orders.update_one({"_id":ObjectId(oid)},{"$set":{"order_status":ns,"updated_at":datetime.utcnow()}})
        return jsonify({"success":True,"message":f"Status → {ns}"})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@order_bp.route("/<oid>", methods=["GET"])
def get_order(oid):
    try:
        db = get_db()
        order = db.orders.find_one({"_id":ObjectId(oid)})
        if not order: return jsonify({"success":False,"message":"Order not found"}), 404
        return jsonify({"success":True,"data":ser(order)})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500
