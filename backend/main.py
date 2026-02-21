from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import collection
from datetime import datetime
from bson import ObjectId
import requests
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
import time

def scrape_amazon_price(url):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-IN,en;q=0.9"
    }

    response = requests.get(url, headers=headers, timeout=10)

    if response.status_code != 200:
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # Try multiple selectors
    selectors = [
        ".a-price .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice",
        "#price_inside_buybox"
    ]

    for sel in selectors:
        tag = soup.select_one(sel)
        if tag:
            price_text = tag.get_text()
            return price_text.replace("₹", "").replace(",", "").strip()

    return None


def scrape_myntra_price(url):
    headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Connection": "keep-alive"
}

    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")

    price_tag = soup.select_one(".pdp-price strong")

    if price_tag:
        return price_tag.get_text().replace("₹", "").replace(",", "").strip()

    return None

def scrape_meesho_price(url):
    headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Connection": "keep-alive"
}

    response = requests.get(url, headers=headers, timeout=10)
    soup = BeautifulSoup(response.text, "html.parser")

    price_tag = soup.find("h4")

    if price_tag:
        price_text = price_tag.get_text()
        digits = "".join(filter(str.isdigit, price_text))
        return digits if digits else None

    return None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_price_with_browser(url):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")

    driver_path = "/home/rahul/.wdm/drivers/chromedriver/linux64/142.0.7444.175/chromedriver-linux64/chromedriver"

    driver = webdriver.Chrome(
    service=Service(driver_path),
    options=options
)

    driver.get(url)
    time.sleep(3)  # wait for page to load

    price = None

    try:
        # AMAZON
        if "amazon" in url:
            selectors = [
                ".a-price .a-offscreen",
                "#priceblock_ourprice",
                "#priceblock_dealprice"
            ]

        # MYNTRA
        elif "myntra" in url:
            selectors = [
                "span.pdp-price strong",
                "span.pdp-price"
            ]

        # MEESHO
        elif "meesho" in url:
            selectors = ["h4"]

        else:
            selectors = []

        for sel in selectors:
            try:
                element = driver.find_element(By.CSS_SELECTOR, sel)
                price = element.text
                if price:
                    break
            except:
                pass

    finally:
        driver.quit()

    if price:
        cleaned = "".join(c for c in price if c.isdigit() or c == ".")
        return float(cleaned) if cleaned else None

    return None

# Home route
@app.get("/")
def home():
    return {"message": "Backend is working"}


# Save item
@app.post("/save-item")
def save_item(item: dict):
    # Prevent duplicates (same user + same URL)
    existing = collection.find_one({
        "user_email": item["user_email"],
        "url": item["url"]
    })

    if existing:
        return {"message": "Item already saved"}

    item["created_at"] = datetime.utcnow()
    result = collection.insert_one(item)

    return {
        "message": "Item saved successfully",
        "id": str(result.inserted_id)
    }


# Get items by user
@app.get("/items/{user_email}")
def get_items(user_email: str):
    items = []

    cursor = collection.find(
        {"user_email": user_email}
    ).sort("created_at", -1)

    for item in cursor:
        item["_id"] = str(item["_id"])
        if "created_at" in item and item["created_at"]:
            item["created_at"] = item["created_at"].isoformat()
        items.append(item)
    
    print("Items found: ", len(items))
    return items



# Delete item
@app.delete("/item/{item_id}")
def delete_item(item_id: str):
    result = collection.delete_one({"_id": ObjectId(item_id)})

    if result.deleted_count == 1:
        return {"message": "Item deleted"}
    else:
        return {"message": "Item not found"}

        

# Update item price
@app.put("/update-price/{item_id}")
def update_price(item_id: str):
    item = collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        return {"message": "Item not found"}

    url = item.get("url")

    print("Fetching price for:", url)

    new_price = get_price_with_browser(url)

    print("New price:", new_price)

    if not new_price:
        return {"message": "Could not fetch price"}

    collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"price": new_price}}
    )

    return {
        "message": "Price updated",
        "new_price": new_price
    }

