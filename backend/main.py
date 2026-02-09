from fastapi import FastAPI
from database import products_collection
from datetime import datetime

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Backend is working"}


@app.post("/save-item")
def save_item(item: dict):
    item["created_at"] = datetime.utcnow()
    products_collection.insert_one(item)
    return {"message": "Item saved successfully"}
