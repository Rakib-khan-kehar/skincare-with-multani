# backend/routes/product_routes.py
from flask import Blueprint, jsonify, request
from backend.config.db import get_db
from bson import ObjectId
from datetime import datetime

product_bp = Blueprint("products", __name__)

def serialize(doc):
    doc["_id"] = str(doc["_id"]); return doc

@product_bp.route("/", methods=["GET"])
def get_products():
    try:
        db = get_db()
        cat = request.args.get("category")
        query = {"is_active":True}
        if cat: query["category"] = cat
        products = list(db.products.find(query))
        return jsonify({"success":True,"data":[serialize(p) for p in products]})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@product_bp.route("/<pid>", methods=["GET"])
def get_product(pid):
    try:
        db = get_db()
        p = db.products.find_one({"_id":ObjectId(pid)})
        if not p: return jsonify({"success":False,"message":"Not found"}), 404
        return jsonify({"success":True,"data":serialize(p)})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500

@product_bp.route("/seed", methods=["POST"])
def seed_products():
    try:
        db = get_db()
        if db.products.count_documents({}) > 0:
            return jsonify({"success":False,"message":"Already seeded"}), 400
        products = [
            {
                "name":"Premium Multani Mitti Powder",
                "category":"powder",
                "tagline":"100% Natural | Chemical Free | For All Skin Types",
                "description":"Our Premium Multani Mitti Powder is sourced directly from mineral-rich earth and triple-sifted to an ultra-fine, lump-free texture. Free from any chemicals or additives.",
                "benefits":["Deep cleanses pores","Controls excess oil","Brightens skin","Reduces acne","Strengthens hair"],
                "specifications":{"form":"Fine Powder","mesh_size":"200 Mesh","shelf_life":"24 Months","origin":"Rajasthan, India","skin_type":"All Skin Types"},
                "packaging_info":"Resealable stand-up pouches with food-grade zip-lock.",
                "image":"images/products/product-pouch.jpg",
                "variants":[
                    {"weight":"250g","price":99,"old_price":149,"discount":34,"stock":200},
                    {"weight":"500g","price":179,"old_price":None,"discount":None,"stock":150},
                    {"weight":"1kg","price":299,"old_price":None,"discount":None,"stock":100},
                ],
                "is_active":True,"created_at":datetime.utcnow()
            },
            {
                "name":"Natural Multani Mitti Stone Chunk",
                "category":"chunk",
                "tagline":"Raw | Unprocessed | Traditional Ayurvedic Form",
                "description":"Raw, unprocessed Multani Mitti stone chunks in their purest natural form. Traditionally used in Ayurvedic beauty rituals. Each piece is unique, mined responsibly from Rajasthan.",
                "benefits":["100% unprocessed & natural","Traditional Ayurvedic grade","Ideal for grinding","Ethically mined","Rich in natural minerals"],
                "specifications":{"form":"Raw Stone Chunks","mesh_size":"N/A","shelf_life":"36 Months","origin":"Rajasthan, India","skin_type":"All Skin Types"},
                "packaging_info":"Packed in moisture-proof sealed bags.",
                "image":"images/gallery/stone-raw.jpg",
                "variants":[
                    {"weight":"1kg","price":149,"old_price":None,"discount":None,"stock":100},
                ],
                "is_active":True,"created_at":datetime.utcnow()
            }
        ]
        db.products.insert_many(products)
        return jsonify({"success":True,"message":f"✅ {len(products)} products seeded!"})
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}), 500
