from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from bson import ObjectId

from database import collection
from price_service import fetch_price_selenium


# ================= Job Function =================
def update_all_prices():
    print("Running background price update...")

    items = list(collection.find())

    for item in items:
        try:
            url = item.get("url")
            old_price = item.get("price")

            new_price = fetch_price_selenium(url)

            if new_price is None:
                continue

            price_drop = False
            if old_price:
                price_drop = new_price < old_price

            collection.update_one(
                {"_id": ObjectId(item["_id"])},
                {
                    "$set": {
                        "price": new_price,
                        "previous_price": old_price,
                        "price_drop": price_drop,
                        "last_checked": datetime.utcnow()
                    }
                }
            )

        except Exception as e:
            print(f"Error updating {item['_id']}: {e}")


# ================= Scheduler =================
scheduler = BackgroundScheduler()

# Runs every 30 minutes
scheduler.add_job(update_all_prices, "interval", minutes=1)