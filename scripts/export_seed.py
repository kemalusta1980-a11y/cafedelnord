import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]
    data = {
        "settings": await db.settings.find_one({"id": "site"}, {"_id": 0}),
        "categories": await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100),
        "menu_items": await db.menu_items.find({}, {"_id": 0}).sort("order", 1).to_list(1000),
        "gallery": await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(200),
    }
    with open("/app/backend/seed_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("exported:", {k: (len(v) if isinstance(v, list) else 1) for k, v in data.items()})
    client.close()

asyncio.run(main())
