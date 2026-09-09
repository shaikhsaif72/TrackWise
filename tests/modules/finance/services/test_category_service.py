import pytest
import uuid
from app.core.exceptions import APIException
from app.modules.finance.services.category_service import CategoryService

def test_category_service_crud(db_session):
    service = CategoryService()
    user_id = uuid.uuid4()

    # Create
    cat = service.create_category(user_id, "Food")
    assert cat.id is not None
    
    # Bulk Validation (Success)
    service.validate_categories_ownership(user_id, [cat.id])
    
    # Bulk Validation (Failure - Cross Tenant)
    with pytest.raises(APIException) as exc:
        service.validate_categories_ownership(uuid.uuid4(), [cat.id])
    assert exc.value.status_code == 400
    
    # Update
    service.update_category(cat.id, user_id, name="Groceries")
    assert service.get_category(cat.id, user_id).name == "Groceries"
    
    # Delete
    service.delete_category(cat.id, user_id)
    with pytest.raises(APIException):
        service.get_category(cat.id, user_id)