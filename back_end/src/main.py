from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from uuid import uuid4, UUID
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# security imports
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

# custom imports
from models import (
    Consumer, ConsumerModel,
    Producer, ProducerModel,
    Product, ProductModel,
    ProducerConsumerMatch, ProducerConsumerMatchModel
)


# Load the database connection string from environment variable or .env file
DATABASE_URL = os.environ.get("AWS_RDS_URL")

# creating connection to the database
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create the database tables (if they don't already exist)
Base.metadata.create_all(bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the FastAPI app
app = FastAPI(title="FarmZilla", version="1.0.0")

# Add CORS middleware to allow requests 
origins = ["http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#-------------------------------------------------#
# ----------PART 1: GET METHODS-------------------#
#-------------------------------------------------#
@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/api/v1/consumers/")
async def fetch_consumers(consumer_id: str = None, db: Session = Depends(get_db)):
    if consumer_id:
        consumers = db.query(Consumer).filter(Consumer.consumer_id == consumer_id).all()
    else:
        consumers = db.query(Consumer).all()
    return [ConsumerModel.from_orm(consumer) for consumer in consumers]

@app.get("/api/v1/producers/")
async def fetch_producers(producer_id: str = None, db: Session = Depends(get_db)):
    if producer_id:
        producers = db.query(Producer).filter(Producer.producer_id == producer_id).all()
    else:
        producers = db.query(Producer).all()
    return [ProducerModel.from_orm(producer) for producer in producers]

@app.get("/api/v1/products/")
async def fetch_products(product_id: str = None, db: Session = Depends(get_db)):
    if product_id:
        products = db.query(Product).filter(Product.product_id == product_id).all()
    else:
        products = db.query(Product).all()
    return [ProductModel.from_orm(product) for product in products]

@app.get("/api/v1/producer_consumer_matches/")
async def fetch_producer_consumer_matches(match_id: str = None, db: Session = Depends(get_db)):
    if match_id:
        matches = db.query(ProducerConsumerMatch).filter(ProducerConsumerMatch.id == match_id).all()
    else:
        matches = db.query(ProducerConsumerMatch).all()
    return [ProducerConsumerMatchModel.from_orm(match) for match in matches]