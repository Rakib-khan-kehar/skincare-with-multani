# seed_admin.py — Run once to create admin user
# python seed_admin.py

import hashlib
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
db     = client[os.getenv("DB_NAME", "skincare_with_multani")]

email    = "admin@skincarewithmultani.com"
password = "admin123"

if db.users.find_one({"email": email}):
    print(f"✅ Admin already exists: {email}")
else:
    db.users.insert_one({
        "name":       "Admin",
        "email":      email,
        "phone":      "+91 92534 12896",
        "password":   hashlib.sha256(password.encode()).hexdigest(),
        "role":       "admin",
        "created_at": datetime.utcnow()
    })
    print(f"✅ Admin created!")
    print(f"   Email:    {email}")
    print(f"   Password: {password}")

client.close()
