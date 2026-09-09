from marshmallow import Schema, RAISE

class BaseStrictSchema(Schema):
    """
    Base API schema.
    Strictly rejects any payload fields not defined in the schema (unknown = RAISE).
    """
    class Meta:
        unknown = RAISE