import boto3
from fastapi import FastAPI, Depends, HTTPException, UploadFile, status
from uuid import uuid4, UUID
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError

# Load environment variables
load_dotenv()

# security imports
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt
from datetime import datetime, timedelta

# custom imports
from .models import (
    User, UserModel,
    Product, ProductModel,
    ProducerConsumerMatch, ProducerConsumerMatchModel,
    Event, EventModel,
    EventVendor, EventVendorModel,
    Rating, RatingModel
)


# Load the database connection string from environment variable or .env file
DATABASE_URL = os.environ.get("AWS_RDS_URL")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

# secure the API with OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# creating connection to the database with connection pooling and timeouts
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_pre_ping=True,  # Validate connections before use
    connect_args={
        "connect_timeout": 10,
        "options": "-c timezone=utc"
    }
)
s3 = boto3.client('s3')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the FastAPI app
app = FastAPI(title="FarmZilla", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        # Create the database tables (if they don't already exist)
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not create database tables: {e}")
        # Don't crash the app, let it start and handle DB errors per request

# Add CORS middleware to allow requests 
origins = [
    "http://localhost:8000", 
    "http://localhost:5174", 
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration from environment variables
SECRET_KEY = os.environ.get("AUTH_SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 30))


#-------------------------------------------------#
# ----------PART 1: GET METHODS-------------------#
#-------------------------------------------------#
@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/api/v1/user/")
async def fetch_users(user_id: str = None, username: str = None, db: Session = Depends(get_db)):
    if user_id:
        users = db.query(User).filter(User.id == user_id).all()
    elif username:
        users = db.query(User).filter(User.username == username).all()
    else:
        users = db.query(User).all()
    return [UserModel.from_orm(user) for user in users]


@app.get("/api/v1/products/")
async def fetch_products(product_id: str = None, db: Session = Depends(get_db)):
    if product_id:
        products = db.query(Product).filter(Product.product_id == product_id).all()
    else:
        products = db.query(Product).all()
    return [ProductModel.from_orm(product) for product in products]

@app.get("/api/v1/products/user/{user_id}")
async def fetch_user_products(user_id: str, db: Session = Depends(get_db)):
    """Fetch all products for a specific user"""
    try:
        # Convert string to UUID
        user_uuid = UUID(user_id)
        products = db.query(Product).filter(Product.user_id == user_uuid).all()
        return [ProductModel.from_orm(product) for product in products]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")

@app.get("/api/v1/producer_consumer_matches/")
async def fetch_producer_consumer_matches(
    match_id: str = None, 
    producer_id: str = None, 
    consumer_id: str = None, 
    db: Session = Depends(get_db)
):
    """
    Fetch producer-consumer matches with optional filters:
    - match_id: specific match by ID
    - producer_id: all matches for a specific producer
    - consumer_id: all matches for a specific consumer
    - no parameters: all matches
    """
    try:
        query = db.query(ProducerConsumerMatch)
        
        if match_id:
            # Convert string to UUID for match_id
            match_uuid = UUID(match_id)
            query = query.filter(ProducerConsumerMatch.id == match_uuid)
        elif producer_id:
            query = query.filter(ProducerConsumerMatch.producer_id == producer_id)
        elif consumer_id:
            query = query.filter(ProducerConsumerMatch.consumer_id == consumer_id)
        
        matches = query.all()
        return [ProducerConsumerMatchModel.from_orm(match) for match in matches]
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching producer-consumer matches: {str(e)}")

@app.get("/api/v1/users/all")
async def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [UserModel.from_orm(user) for user in users]

@app.get("/api/v1/user/{user_id}/username")
async def get_username_by_id(user_id: str, db: Session = Depends(get_db)):
    """Get username by user_id"""
    try:
        user_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"username": user.username}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching username: {str(e)}")

@app.get("/api/v1/events/")
async def fetch_events(event_id: str = None, db: Session = Depends(get_db)):
    """
    Fetch events with optional filter:
    - event_id: specific event by event_id
    - no parameters: all events
    """
    try:
        if event_id:
            events = db.query(Event).filter(Event.event_id == event_id).all()
        else:
            events = db.query(Event).all()
        return [EventModel.from_orm(event) for event in events]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching events: {str(e)}")

@app.get("/api/v1/event_vendor/")
async def fetch_event_vendors(event_id: str = None, producer_id: str = None, db: Session = Depends(get_db)):
    """
    Fetch event vendors with optional filters:
    - event_id: all vendors for a specific event
    - producer_id: all events for a specific producer
    - no parameters: all event vendor relationships
    """
    try:
        query = db.query(EventVendor)
        
        if event_id:
            query = query.filter(EventVendor.event_id == event_id)
        elif producer_id:
            query = query.filter(EventVendor.producer_id == producer_id)
        
        event_vendors = query.all()
        return [EventVendorModel.from_orm(event_vendor) for event_vendor in event_vendors]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching event vendors: {str(e)}")

@app.get("/api/v1/ratings/")
async def fetch_ratings(producer_id: str = None, consumer_id: str = None, db: Session = Depends(get_db)):
    """
    Fetch ratings with optional filters:
    - producer_id: all ratings for a specific producer
    - consumer_id: all ratings by a specific consumer
    - no parameters: all ratings
    """
    try:
        query = db.query(Rating)
        
        if producer_id:
            query = query.filter(Rating.producer_id == producer_id)
        elif consumer_id:
            query = query.filter(Rating.consumer_id == consumer_id)
        
        ratings = query.all()
        return [RatingModel.from_orm(rating) for rating in ratings]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ratings: {str(e)}")

# for verifying JWT token
@app.get("/api/v1/verify/{token}")
async def verify_token_endpoint(token: str):
    try:
        payload = verify_token(token)
        return {"message": "Token is valid", "payload": payload}
    except HTTPException as e:
        raise e
    

#-------------------------------------------------#
# -----------PART 2: POST METHODS-----------------#
#-------------------------------------------------#



@app.post("/api/v1/user/")
async def create_user(user: UserModel, db: Session = Depends(get_db)):
    # Check if the entry already exists
    existing = db.query(User).filter_by(username=user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists.")

    # Validate role
    if user.role not in ["producer", "consumer"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Role must be either 'producer' or 'consumer'."
        )

    # Ensure password is not longer than 72 bytes for bcrypt
    password_bytes = user.password.encode('utf-8')
    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password cannot be longer than 72 bytes."
        )
    password = user.password

    # Hash the password before storing
    hashed_password = pwd_context.hash(password)

    # Only include id if provided, otherwise let SQLAlchemy generate it
    user_data = {
        "username": user.username,
        "password": hashed_password,
        "email": user.email,
        "role": user.role,
        "location": user.location
    }
    if user.id is not None:
        user_data["id"] = UUID(str(user.id))

    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# for creating a new product
@app.post("/api/v1/products/")
async def create_product(product: ProductModel, db: Session = Depends(get_db)):
    # Check if the entry already exists for this user
    existing = db.query(Product).filter_by(
        product_name=product.product_name, 
        user_id=product.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this name already exists for this user.")

    # Generate a unique product_id if not provided or if it's the placeholder
    if not product.product_id or product.product_id == "test_id":
        product.product_id = str(uuid4())[:8].upper()  # Generate 8-character uppercase ID

    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

# for generating a JWT token for user authentication
@app.post("/api/v1/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = user_authentication(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) if ACCESS_TOKEN_EXPIRE_MINUTES is not None and ACCESS_TOKEN_EXPIRE_MINUTES else timedelta(minutes=15)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


# for uploading files to s3 bucket
@app.post("/api/v1/uploadfile/")
async def upload_file_to_s3(file: UploadFile | None = None):
    if file is None:
        return {"error": "No file provided"}
    try:
        s3.upload_fileobj(file.file, AWS_BUCKET_NAME, file.filename)
        return {"message": "File uploaded successfully"}
    except Exception as e:
        return {"error": str(e)}

# for creating producer-consumer matches
@app.post("/api/v1/producer_consumer_matches/")
async def create_producer_consumer_match(producer_id: str, consumer_id: str, db: Session = Depends(get_db)):
    """
    Create a new producer-consumer match
    """
    try:
        # Check if the match already exists
        existing_match = db.query(ProducerConsumerMatch).filter(
            ProducerConsumerMatch.producer_id == producer_id,
            ProducerConsumerMatch.consumer_id == consumer_id
        ).first()
        
        if existing_match:
            raise HTTPException(
                status_code=400, 
                detail=f"Match between producer '{producer_id}' and consumer '{consumer_id}' already exists"
            )
        
        # Create new match
        new_match = ProducerConsumerMatch(
            producer_id=producer_id,
            consumer_id=consumer_id
        )
        
        db.add(new_match)
        db.commit()
        db.refresh(new_match)
        
        return {
            "message": f"Producer-consumer match created successfully",
            "match_id": str(new_match.id),
            "producer_id": producer_id,
            "consumer_id": consumer_id,
            "created_at": new_match.created_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating producer-consumer match: {str(e)}"
        )

# for creating events
@app.post("/api/v1/events/")
async def create_event(event: EventModel, db: Session = Depends(get_db)):
    """
    Create a new event
    """
    try:
        # Check if event with same event_id already exists
        existing = db.query(Event).filter_by(event_id=event.event_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Event with this event_id already exists.")

        # Generate a unique event_id if not provided
        if not event.event_id:
            event.event_id = str(uuid4())[:8].upper()

        db_event = Event(**event.dict())
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return EventModel.from_orm(db_event)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating event: {str(e)}")

# for creating event vendor relationships
@app.post("/api/v1/event_vendor/")
async def create_event_vendor(event_id: str, producer_id: str, db: Session = Depends(get_db)):
    """
    Create a new event vendor relationship
    """
    try:
        # Check if the relationship already exists
        existing = db.query(EventVendor).filter(
            EventVendor.event_id == event_id,
            EventVendor.producer_id == producer_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Event vendor relationship between event '{event_id}' and producer '{producer_id}' already exists"
            )
        
        # Create new event vendor relationship
        new_event_vendor = EventVendor(
            event_id=event_id,
            producer_id=producer_id
        )
        
        db.add(new_event_vendor)
        db.commit()
        db.refresh(new_event_vendor)
        
        return {
            "message": "Event vendor relationship created successfully",
            "id": str(new_event_vendor.id),
            "event_id": event_id,
            "producer_id": producer_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating event vendor relationship: {str(e)}")

# for creating ratings
@app.post("/api/v1/ratings/")
async def create_rating(rating: RatingModel, db: Session = Depends(get_db)):
    """
    Create a new rating for a producer
    """
    try:
        # Validate rating is between 1-5
        if rating.rating < 1 or rating.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Check if consumer has already rated this producer
        existing_rating = db.query(Rating).filter(
            Rating.producer_id == rating.producer_id,
            Rating.consumer_id == rating.consumer_id
        ).first()
        
        if existing_rating:
            raise HTTPException(status_code=400, detail="You have already rated this producer")
        
        # Create new rating
        rating_data = rating.dict()
        if rating_data.get('id') is None:
            rating_data.pop('id', None)
        if rating_data.get('date') is None:
            rating_data['date'] = datetime.utcnow()
        
        new_rating = Rating(**rating_data)
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        
        return {
            "message": "Rating created successfully",
            "id": str(new_rating.id),
            "producer_id": rating.producer_id,
            "consumer_id": rating.consumer_id,
            "rating": rating.rating
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating rating: {str(e)}")
    

#-------------------------------------------------#
# ----------PART 3: HELPER METHODS----------------#
#-------------------------------------------------#

# helper function to authenticate user by hasing password
def user_authentication(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not pwd_context.verify(password, user.password):
        return None
    return user

# helper function to create JWT access token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta is None:
        expire = datetime.utcnow() + timedelta(minutes=15)
    else:
        expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# helper function to verify JWT token
def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return payload
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
#-------------------------------------------------#
# -----------PART 4: DELETE METHODS---------------#
#-------------------------------------------------#

@app.delete("/api/v1/products/user/{user_id}/{product_id}")
async def delete_user_product(user_id: str, product_id: str, db: Session = Depends(get_db)):
    """
    Delete a product from the database for a specific user (with additional security)
    """
    try:
        # Convert string to UUID for user_id
        user_uuid = UUID(user_id)
        
        # Find the product in the database for the specific user
        product = db.query(Product).filter(
            Product.product_id == product_id,
            Product.user_id == user_uuid
        ).first()
        
        if not product:
            raise HTTPException(
                status_code=404, 
                detail=f"Product with ID '{product_id}' not found for user '{user_id}'"
            )
        
        # Store image_url before deleting the product
        image_url = product.image_url
        
        # Delete the product from the database
        db.delete(product)
        db.commit()
        
        # Delete the image from S3 if it exists
        s3_deletion_status = "No image to delete"
        if image_url:
            try:
                # Extract the S3 key from the image URL
                s3_key = image_url.split('amazonaws.com/')[-1]
                
                # Delete the object from S3
                s3.delete_object(Bucket=AWS_BUCKET_NAME, Key=s3_key)
                s3_deletion_status = f"Image '{s3_key}' deleted from S3"
                
            except ClientError as e:
                error_code = e.response['Error']['Code']
                if error_code == 'NoSuchKey':
                    s3_deletion_status = f"Image was already missing from S3"
                else:
                    s3_deletion_status = f"Failed to delete image from S3: {str(e)}"
            except Exception as e:
                s3_deletion_status = f"Error processing S3 deletion: {str(e)}"
        
        return {
            "message": f"Product '{product_id}' deleted successfully for user '{user_id}'",
            "product_name": product.product_name,
            "s3_status": s3_deletion_status
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting product: {str(e)}"
        )

@app.delete("/api/v1/producer_consumer_matches/")
async def delete_producer_consumer_match(producer_id: str, consumer_id: str, db: Session = Depends(get_db)):
    """
    Delete a producer-consumer match by producer_id and consumer_id
    """
    try:
        # Find the match to delete
        match = db.query(ProducerConsumerMatch).filter(
            ProducerConsumerMatch.producer_id == producer_id,
            ProducerConsumerMatch.consumer_id == consumer_id
        ).first()
        
        if not match:
            raise HTTPException(
                status_code=404, 
                detail=f"No match found between producer '{producer_id}' and consumer '{consumer_id}'"
            )
        
        # Delete the match
        db.delete(match)
        db.commit()
        
        return {
            "message": f"Producer-consumer match deleted successfully",
            "producer_id": producer_id,
            "consumer_id": consumer_id,
            "deleted_match_id": str(match.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting producer-consumer match: {str(e)}"
        )

@app.delete("/api/v1/events/{event_id}")
async def delete_event(event_id: str, db: Session = Depends(get_db)):
    """
    Delete an event by event_id
    """
    try:
        # Find the event to delete
        event = db.query(Event).filter(Event.event_id == event_id).first()
        
        if not event:
            raise HTTPException(
                status_code=404, 
                detail=f"Event with ID '{event_id}' not found"
            )
        
        # Delete the event
        db.delete(event)
        db.commit()
        
        return {
            "message": f"Event '{event_id}' deleted successfully",
            "event_id": event_id,
            "event_name": event.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting event: {str(e)}"
        )

@app.delete("/api/v1/event_vendor/")
async def delete_event_vendor(event_id: str, producer_id: str, db: Session = Depends(get_db)):
    """
    Delete an event vendor relationship by event_id and producer_id
    """
    try:
        # Find the event vendor relationship to delete
        event_vendor = db.query(EventVendor).filter(
            EventVendor.event_id == event_id,
            EventVendor.producer_id == producer_id
        ).first()
        
        if not event_vendor:
            raise HTTPException(
                status_code=404, 
                detail=f"No event vendor relationship found between event '{event_id}' and producer '{producer_id}'"
            )
        
        # Delete the relationship
        db.delete(event_vendor)
        db.commit()
        
        return {
            "message": "Event vendor relationship deleted successfully",
            "event_id": event_id,
            "producer_id": producer_id,
            "deleted_id": str(event_vendor.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting event vendor relationship: {str(e)}"
        )