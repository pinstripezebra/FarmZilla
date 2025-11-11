from pydantic import BaseModel
from uuid import UUID,uuid4
from typing import Optional
from enum import Enum
from sqlalchemy import Column, String, Float, Integer, DateTime
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy.dialects.postgresql import UUID as SA_UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid
from uuid import UUID
from sqlalchemy import Enum as SAEnum
from datetime import datetime

# loading sql model
from sqlmodel import Field, Session, SQLModel, create_engine, select


# Initialize the base class for SQLAlchemy models
Base = declarative_base()

class UserRole(str, Enum):
    producer = "producer"
    consumer = "consumer"

class User(Base):
    __tablename__ = "users"  # Table name in the PostgreSQL database

    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=True)  # Latitude,Longitude coordinates


class UserModel(BaseModel):
    id: Optional[UUID] = None
    username: str
    password: str
    email: str
    role: str
    location: Optional[str] = None  # Latitude,Longitude coordinates

    class Config:
        orm_mode = True  # Enable ORM mode to work with SQLAlchemy objects
        from_attributes = True # Enable attribute access for SQLAlchemy objects

class Product(Base):
    __tablename__ = "products"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    product_id = Column(String, unique=True, nullable=False)
    product_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=True)  # URL to S3 image
    user_id = Column(pg.UUID(as_uuid=True), nullable=True)  # Link to user who created the product
    cost = Column(Float, nullable=True)  # Product cost
    unit = Column(String, nullable=True)  # Product unit (each or lb)

class ProductModel(BaseModel):
    id: Optional[UUID] = None
    product_id: str
    product_name: str
    description: str
    image_url: Optional[str] = None  # URL to S3 image
    user_id: Optional[UUID] = None  # Link to user who created the product
    cost: Optional[float] = None  # Product cost
    unit: Optional[str] = None  # Product unit (each or lb)
    class Config:
        orm_mode = True
        from_attributes = True

class ProducerConsumerMatch(Base):
    __tablename__ = "producer_consumer_matches"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    producer_id = Column(String, nullable=False)
    consumer_id = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class ProducerConsumerMatchModel(BaseModel):
    id: Optional[UUID] = None
    producer_id: str
    consumer_id: str
    created_at: Optional[datetime] = None
    class Config:
        orm_mode = True
        from_attributes = True

class Event(Base):
    __tablename__ = "events"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    event_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(String, nullable=False)
    coordinates = Column(String, nullable=False)

class EventModel(BaseModel):
    id: Optional[UUID] = None
    event_id: str
    name: str
    date: str
    time: str
    location: str
    description: str
    coordinates: str
    class Config:
        orm_mode = True
        from_attributes = True

class EventVendor(Base):
    __tablename__ = "event_vendor"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    event_id = Column(String, nullable=False)
    producer_id = Column(String, nullable=False)

class EventVendorModel(BaseModel):
    id: Optional[UUID] = None
    event_id: str
    producer_id: str
    class Config:
        orm_mode = True
        from_attributes = True

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    producer_id = Column(String, nullable=False)
    consumer_id = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 rating
    review = Column(String, nullable=True)   # Optional review text
    date = Column(DateTime, nullable=False, default=datetime.utcnow)

class RatingModel(BaseModel):
    id: Optional[UUID] = None
    producer_id: str
    consumer_id: str
    rating: int  # Should be between 1-5
    review: Optional[str] = None
    date: Optional[datetime] = None
    class Config:
        orm_mode = True
        from_attributes = True