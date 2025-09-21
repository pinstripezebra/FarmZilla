from pydantic import BaseModel
from uuid import UUID,uuid4
from typing import Optional
from enum import Enum
from sqlalchemy import Column, String, Float, Integer
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy.dialects.postgresql import UUID as SA_UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid
from uuid import UUID

# loading sql model
from sqlmodel import Field, Session, SQLModel, create_engine, select


# Initialize the base class for SQLAlchemy models
Base = declarative_base()


class Consumer(Base):
    __tablename__ = "consumers"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    consumer_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)

class ConsumerModel(BaseModel):
    id: Optional[UUID] = None
    consumer_id: str
    name: str
    email: str
    class Config:
        orm_mode = True
        from_attributes = True

class Producer(Base):
    __tablename__ = "producers"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    producer_id = Column(String, unique=True, nullable=False)
    product_id = Column(String, nullable=False)

class ProducerModel(BaseModel):
    id: Optional[UUID] = None
    producer_id: str
    product_id: str
    class Config:
        orm_mode = True
        from_attributes = True

class Product(Base):
    __tablename__ = "products"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    product_id = Column(String, unique=True, nullable=False)
    product_name = Column(String, nullable=False)
    description = Column(String, nullable=False)

class ProductModel(BaseModel):
    id: Optional[UUID] = None
    product_id: str
    product_name: str
    description: str
    class Config:
        orm_mode = True
        from_attributes = True

class ProducerConsumerMatch(Base):
    __tablename__ = "producer_consumer_matches"
    id = Column(pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, nullable=False)
    producer_id = Column(String, nullable=False)
    consumer_id = Column(String, nullable=False)

class ProducerConsumerMatchModel(BaseModel):
    id: Optional[UUID] = None
    producer_id: str
    consumer_id: str
    class Config:
        orm_mode = True
        from_attributes = True