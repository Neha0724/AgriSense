import copy
from datetime import datetime

from . import seed_data


def seed_if_empty(db):
    """Insert sample data into collections that are empty. Safe to run on every start."""
    if db.fields.count_documents({}) == 0:
        db.fields.insert_many(copy.deepcopy(seed_data.FIELDS))
        max_id = max(f["id"] for f in seed_data.FIELDS)
        db.counters.update_one({"_id": "fields"}, {"$max": {"seq": max_id}}, upsert=True)

    if db.analyses.count_documents({}) == 0:
        rec = copy.deepcopy(seed_data.ACTIVE_RECOMMENDATION)
        rec["createdAt"] = datetime(2026, 9, 4, 9, 30)
        db.analyses.insert_one(rec)

    if db.history.count_documents({}) == 0:
        entries = []
        for h in copy.deepcopy(seed_data.HISTORY):
            h["createdAt"] = datetime.strptime(f"{h['date']} {h['time']}", "%Y-%m-%d %I:%M %p")
            entries.append(h)
        db.history.insert_many(entries)

    if db.settings.count_documents({"_id": "default"}) == 0:
        db.settings.insert_one({"_id": "default", **copy.deepcopy(seed_data.SETTINGS)})
