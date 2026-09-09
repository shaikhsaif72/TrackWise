from marshmallow import fields, validate
from app.core.schemas import BaseStrictSchema
# Marshmallow does not natively support Enums efficiently until 3.18 with Enum field.
from app.modules.finance.models import TransactionType

# --- WALLET SCHEMAS ---

class WalletCreateSchema(BaseStrictSchema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    balance = fields.Decimal(required=False, as_string=True)
    currency = fields.String(required=False, validate=validate.Length(min=3, max=3))

class WalletUpdateSchema(BaseStrictSchema):
    name = fields.String(required=False, validate=validate.Length(min=1))
    currency = fields.String(required=False, validate=validate.Length(min=3, max=3))

class WalletResponseSchema(BaseStrictSchema):
    id = fields.UUID()
    name = fields.String()
    balance = fields.Decimal(as_string=True)
    currency = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

# --- CATEGORY SCHEMAS ---

class CategoryCreateSchema(BaseStrictSchema):
    name = fields.String(required=True, validate=validate.Length(min=1))

class CategoryUpdateSchema(BaseStrictSchema):
    name = fields.String(required=False, validate=validate.Length(min=1))

class CategoryResponseSchema(BaseStrictSchema):
    id = fields.UUID()
    name = fields.String()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

# --- TRANSACTION SCHEMAS ---

class TransactionCreateSchema(BaseStrictSchema):
    wallet_id = fields.UUID(required=True)
    category_id = fields.UUID(required=False, allow_none=True)
    type = fields.Enum(TransactionType, by_value=True, required=True)
    amount = fields.Decimal(required=True, as_string=True)
    transaction_date = fields.DateTime(required=True)
    description = fields.String(required=False, allow_none=True)

class TransactionUpdateSchema(BaseStrictSchema):
    wallet_id = fields.UUID(required=False)
    category_id = fields.UUID(required=False, allow_none=True)
    type = fields.Enum(TransactionType, by_value=True, required=False)
    amount = fields.Decimal(required=False, as_string=True)
    transaction_date = fields.DateTime(required=False)
    description = fields.String(required=False, allow_none=True)

class TransactionResponseSchema(BaseStrictSchema):
    id = fields.UUID()
    wallet_id = fields.UUID()
    category_id = fields.UUID(allow_none=True)
    type = fields.Enum(TransactionType, by_value=True)
    amount = fields.Decimal(as_string=True)
    transaction_date = fields.DateTime()
    description = fields.String(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

# --- BUDGET SCHEMAS ---

class BudgetCreateSchema(BaseStrictSchema):
    amount = fields.Decimal(required=True, as_string=True)
    start_date = fields.Date(required=True)
    end_date = fields.Date(required=True)
    category_id = fields.UUID(required=False, allow_none=True)

class BudgetUpdateSchema(BaseStrictSchema):
    amount = fields.Decimal(required=False, as_string=True)
    start_date = fields.Date(required=False)
    end_date = fields.Date(required=False)
    is_active = fields.Boolean(required=False)

class BudgetResponseSchema(BaseStrictSchema):
    id = fields.UUID()
    category_id = fields.UUID(allow_none=True)
    amount = fields.Decimal(as_string=True)
    start_date = fields.Date()
    end_date = fields.Date()
    is_active = fields.Boolean()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()

# --- ANALYTICS, ALERTS & PACING SCHEMAS ---

class BudgetAnalyticsResponseSchema(BaseStrictSchema):
    budget_id = fields.UUID()
    category_id = fields.UUID(allow_none=True)
    budget_amount = fields.Decimal(as_string=True)
    spent_amount = fields.Decimal(as_string=True)
    remaining_amount = fields.Decimal(as_string=True)
    percentage_used = fields.Decimal(as_string=True)
    health = fields.String()

class AlertEvaluateSchema(BaseStrictSchema):
    timezone = fields.String(required=True)

class BudgetAlertResponseSchema(BaseStrictSchema):
    id = fields.UUID()
    budget_id = fields.UUID()
    threshold_type = fields.Integer()
    budget_amount = fields.Decimal(as_string=True)
    spent_amount = fields.Decimal(as_string=True)
    percentage_used = fields.Decimal(as_string=True)
    is_read = fields.Boolean()
    created_at = fields.DateTime()

class BudgetPacingResponseSchema(BaseStrictSchema):
    budget_id = fields.UUID()
    total_days = fields.Integer()
    elapsed_days = fields.Integer()
    current_daily_rate = fields.Decimal(as_string=True)
    projected_spend = fields.Decimal(as_string=True)
    projected_overage = fields.Decimal(as_string=True)

class RolloverInstructionSchema(BaseStrictSchema):
    category_id = fields.UUID(required=False, allow_none=True)
    new_start_date = fields.Date(required=True)
    new_end_date = fields.Date(required=True)
    new_amount = fields.Decimal(required=True, as_string=True)

class BulkRolloverRequestSchema(BaseStrictSchema):
    instructions = fields.List(fields.Nested(RolloverInstructionSchema), required=True)