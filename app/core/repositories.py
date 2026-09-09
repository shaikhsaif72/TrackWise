from typing import Generic, TypeVar

from app.extensions import db

T = TypeVar("T")


class BaseRepository(Generic[T]):
    def __init__(self, model):
        self.model = model

    def get_by_id(self, record_id):
        return db.session.get(self.model, record_id)

    def add(self, entity):
        db.session.add(entity)
        return entity

    def delete(self, entity):
        db.session.delete(entity)