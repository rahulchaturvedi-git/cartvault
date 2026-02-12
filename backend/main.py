from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import products_collection
from datetime import datetime
from bson import ObjectId

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Home route
@app.get("/")
def home():
    return {"message": "Backend is working"}


# Save item
@app.post("/save-item")
def save_item(item: dict):
    # Prevent duplicates (same user + same URL)
    existing = products_collection.find_one({
        "user_email": item["user_email"],
        "url": item["url"]
    })

    if existing:
        return {"message": "Item already saved"}

    item["created_at"] = datetime.utcnow()
    result = products_collection.insert_one(item)

    return {
        "message": "Item saved successfully",
        "id": str(result.inserted_id)
    }


# Get items by user
@app.get("/items/{user_email}")
def get_items(user_email: str):
    items = []
    cursor = products_collection.find(
        {"user_email": user_email}
    ).sort("created_at", -1)   # newest first

    for item in cursor:
        item["_id"] = str(item["_id"])
        if "created_at" in item:
            item["created_at"] = item["created_at"].isoformat()
        items.append(item)

    return items



# Delete item
@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    result = products_collection.delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 1:
        return {"message": "Item deleted"}
    else:
        return {"message": "Item not found"}
