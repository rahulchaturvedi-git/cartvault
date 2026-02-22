from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import collection
from datetime import datetime
from bson import ObjectId
from scheduler import scheduler
from price_service import fetch_price_selenium

# ================= FastAPI App =================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= Health Check =================
@app.get("/")
def home():
    return {"message": "Backend is working"}


# ================= Save Item =================
@app.post("/save-item")
def save_item(item: dict):
    # Prevent duplicates (same user + same URL)
    existing = collection.find_one({
        "user_email": item["user_email"],
        "url": item["url"]
    })

    if existing:
        return {"message": "Item already saved"}

    # Default tracking fields
    item["created_at"] = datetime.utcnow()
    item["previous_price"] = None
    item["price_drop"] = False
    item["last_checked"] = None

    result = collection.insert_one(item)

    return {
        "message": "Item saved successfully",
        "id": str(result.inserted_id)
    }


# ================= Get Items =================
@app.get("/items/{user_email}")
def get_items(user_email: str):
    items = []

    cursor = collection.find(
        {"user_email": user_email}
    ).sort("created_at", -1)

    for item in cursor:
        item["_id"] = str(item["_id"])

        if item.get("created_at"):
            item["created_at"] = item["created_at"].isoformat()

        if item.get("last_checked"):
            item["last_checked"] = item["last_checked"].isoformat()

        items.append(item)

    print("Items found:", len(items))
    return items


# ================= Delete Item =================
@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    result = collection.delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 1:
        return {"message": "Item deleted"}
    else:
        return {"message": "Item not found"}


# ================= Manual Price Update =================
@app.put("/update-price/{item_id}")
def update_price(item_id: str):
    try:
        item = collection.find_one({"_id": ObjectId(item_id)})

        if not item:
            return {"message": "Item not found"}

        url = item.get("url")
        print("Fetching price for:", url)

        #skip protected sites (they block selenium)
        blocked_sites = ["flipkart"]

        if any (site in url.lower() for site in blocked_sites):
            return{
                "message": "Auto price refresh not supported for this website. Please check manually."
            }

        from price_service import fetch_price_selenium
        new_price = fetch_price_selenium(url)

        print("New price:", new_price)

        if new_price is None:
            return {"message": "Price not found on page"}

        old_price = item.get("price")
        try:
             old_price = int(old_price)
        except:
             old_price = None

        collection.update_one(
            {"_id": ObjectId(item_id)},
            {
                "$set": {
                    "price": new_price,
                    "previous_price": old_price,
                    "price_drop": old_price is not None and new_price < old_price,
                    "last_checked": datetime.utcnow()
                }
            }
        )

        return {
            "message": "Price updated",
            "new_price": new_price
        }

    except Exception as e:
        print("Update price error:", e)
        return {
            "message": "Internal error",
            "error": str(e)
        }


# ================= Start Scheduler =================
#@app.on_event("startup")
#def start_scheduler():
#    scheduler.start()
#    print("Background scheduler started")