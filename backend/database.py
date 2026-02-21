from pymongo import MongoClient

MONGO_URL = "mongodb+srv://rahul:%23Rahul30092004@cartvault.5fa8w7a.mongodb.net/?appName=CartVault"

client = MongoClient(MONGO_URL)

db = client["cartvault"]
collection = db["products"]