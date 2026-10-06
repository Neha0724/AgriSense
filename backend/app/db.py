"""MongoDB connection helpers.

Collections:
  fields      - registered farm fields (numeric `id`, as the frontend expects)
  analyses    - every analysis result (the latest one is the "active" recommendation)
  history     - recommendations the farmer chose to save
  settings    - single document with _id "default" (profile, preferences, notifications)
  counters    - auto-increment sequences for numeric ids
"""
from flask import current_app
from pymongo import ASCENDING, DESCENDING, MongoClient, ReturnDocument


def init_db(app):
    uri = app.config["MONGO_URI"]
    if uri.startswith("mongomock://"):
        import mongomock  # dev/testing only

        client = mongomock.MongoClient()
    else:
        client = MongoClient(uri, serverSelectionTimeoutMS=4000)

    db = client[app.config["MONGO_DB_NAME"]]
    app.extensions["mongo_client"] = client
    app.extensions["mongo_db"] = db

    db.fields.create_index([("id", ASCENDING)], unique=True)
    db.analyses.create_index([("fieldId", ASCENDING), ("createdAt", DESCENDING)])
    db.history.create_index([("createdAt", DESCENDING)])
    return db


def get_db():
    return current_app.extensions["mongo_db"]


def next_id(db, name):
    doc = db.counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc["seq"]


NO_ID = {"_id": 0}
