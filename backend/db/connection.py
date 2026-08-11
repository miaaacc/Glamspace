from pymongo import MongoClient
from django.conf import settings

_client = None

def get_db():
    """Retorna la base de datos MongoDB. Reutiliza la conexión existente."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URL)
    return _client[settings.MONGO_DB_NAME]

def get_collection(nombre):
    """Retorna una colección específica de MongoDB."""
    db = get_db()
    return db[nombre]