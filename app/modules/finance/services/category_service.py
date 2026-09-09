import uuid
from typing import Sequence
from app.extensions import db
from app.core.exceptions import APIException
from app.core.constants import MISSING
from app.core.utils.datetime import utc_now
from app.modules.finance.models import Category
from app.modules.finance.repositories import CategoryRepository


class CategoryService:
    def __init__(self, category_repo: CategoryRepository = None):
        self.category_repo = category_repo or CategoryRepository()

    def create_category(self, user_id: uuid.UUID, name: str) -> Category:
        if not name or not name.strip():
            raise APIException("Category name cannot be empty.", status_code=400)

        category = Category(user_id=user_id, name=name.strip())
        self.category_repo.add(category)
        
        try:
            db.session.commit()
            return category
        except Exception:
            db.session.rollback()
            raise APIException("Failed to create category.", status_code=500)

    def get_category(self, category_id: uuid.UUID, user_id: uuid.UUID) -> Category:
        category = self.category_repo.get_active_by_id(category_id, user_id)
        if not category:
            raise APIException("Category not found.", status_code=404)
        return category

    def get_all_categories(self, user_id: uuid.UUID) -> Sequence[Category]:
        return self.category_repo.get_all_active_by_user(user_id)

    def validate_categories_ownership(self, user_id: uuid.UUID, category_ids: list[uuid.UUID]) -> None:
        if not category_ids:
            return
        unique_ids = set(category_ids)
        valid_categories = self.category_repo.get_active_categories_by_ids(user_id, list(unique_ids))
        if len(valid_categories) != len(unique_ids):
            raise APIException("One or more categories are invalid or not owned by user.", status_code=400)

    def update_category(self, category_id: uuid.UUID, user_id: uuid.UUID, name=MISSING) -> Category:
        category = self.get_category(category_id, user_id)

        if name is not MISSING:
            if not name or not str(name).strip():
                raise APIException("Category name cannot be empty.", status_code=400)
            category.name = str(name).strip()

        try:
            db.session.commit()
            return category
        except Exception:
            db.session.rollback()
            raise APIException("Failed to update category.", status_code=500)

    def delete_category(self, category_id: uuid.UUID, user_id: uuid.UUID) -> None:
        category = self.get_category(category_id, user_id)
        category.deleted_at = utc_now()
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise APIException("Failed to delete category.", status_code=500)