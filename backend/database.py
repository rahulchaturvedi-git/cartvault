from pymongo import MongoClient

MONGO_URL = "mongodb+srv://rahul:#Rahul30092004@cartvault.5fa8w7a.mongodb.net/?appName=CartVault"

client = MongoClient(MONGO_URL)

db = client["cartvault"]
products_collection = db["products"]