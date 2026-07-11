# app.py — Skincare With Multani — Complete Flask Backend
import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from backend.config.db import connect_db
from backend.routes.product_routes     import product_bp
from backend.routes.testimonial_routes import testimonial_bp
from backend.routes.gallery_routes     import gallery_bp
from backend.routes.faq_routes         import faq_bp
from backend.routes.contact_routes     import contact_bp
from backend.routes.order_routes       import order_bp
from backend.routes.review_routes      import review_bp
from backend.routes.newsletter_routes  import newsletter_bp
from backend.routes.user_routes        import user_bp
from backend.routes.cart_routes        import cart_bp

load_dotenv()
app = Flask(__name__, static_folder="")
CORS(app)
connect_db()

app.register_blueprint(product_bp,     url_prefix="/api/products")
app.register_blueprint(testimonial_bp, url_prefix="/api/testimonials")
app.register_blueprint(gallery_bp,     url_prefix="/api/gallery")
app.register_blueprint(faq_bp,         url_prefix="/api/faq")
app.register_blueprint(contact_bp,     url_prefix="/api/contact")
app.register_blueprint(order_bp,       url_prefix="/api/orders")
app.register_blueprint(review_bp,      url_prefix="/api/reviews")
app.register_blueprint(newsletter_bp,  url_prefix="/api/newsletter")
app.register_blueprint(user_bp,        url_prefix="/api/users")
app.register_blueprint(cart_bp,        url_prefix="/api/cart")

@app.route("/api/health")
def health():
    return jsonify({"status":"ok","message":"Skincare With Multani API running ✅"})

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/admin")
@app.route("/admin/")
def serve_admin():
    return send_from_directory(
        os.path.join(app.static_folder, "admin"), "index.html"
    )

@app.route("/<path:path>")
def serve_static(path):
    full = os.path.join(app.static_folder, path)
    if os.path.exists(full):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

@app.errorhandler(404)
def not_found(e): return jsonify({"success":False,"message":"Route not found"}), 404

@app.errorhandler(500)
def server_error(e): return jsonify({"success":False,"message":"Server error"}), 500

if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG","True") == "True"
    print(f"\n{'='*50}")
    print(f"  Skincare With Multani Server")
    print(f"  Website  : http://localhost:{port}")
    print(f"  Admin    : http://localhost:{port}/admin")
    print(f"  API      : http://localhost:{port}/api/health")
    print(f"{'='*50}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
