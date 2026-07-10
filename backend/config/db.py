# backend/config/db.py — MongoDB connection with detailed error logging

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv
import os

load_dotenv()

client = None
db = None

def connect_db():
    global client, db
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name   = os.getenv("DB_NAME", "skincare_with_multani")

    try:
        print(f"\n🔄 Connecting to MongoDB...")
        print(f"   URI: {mongo_uri}")
        print(f"   DB : {db_name}")

        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )

        # Force connection test
        client.admin.command("ping")

        db = client[db_name]
        print(f"✅ MongoDB Connected successfully: {db_name}\n")
        return db

    except ServerSelectionTimeoutError:
        print("\n❌ ERROR: MongoDB server not reachable!")
        print("   → Make sure MongoDB is running: net start MongoDB")
        print("   → Or start it manually: mongod")
        print("   → Check MONGO_URI in your .env file\n")
        raise

    except ConnectionFailure as e:
        print(f"\n❌ ERROR: MongoDB connection failed: {e}\n")
        raise

    except Exception as e:
        print(f"\n❌ ERROR: Unexpected error: {e}\n")
        raise

def get_db():
    global db
    if db is None:
        connect_db()
    return db
