from sqlalchemy import Enum as SQLEnum

class SenderEnum(str, SQLEnum):
    CUSTOMER = "customer"
    STAFF = "staff"
    ADMIN = "admin"

class ChatStatusEnum(str, SQLEnum):
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"

