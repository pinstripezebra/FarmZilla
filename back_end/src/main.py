import boto3
from fastapi import FastAPI, Depends, HTTPException, UploadFile, status
from uuid import uuid4, UUID
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os
import boto3

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
from back_end.src.models import (
    User, UserModel,
    Product, ProductModel,
    ProducerConsumerMatch, ProducerConsumerMatchModel
)


# Load the database connection string from environment variable or .env file
DATABASE_URL = os.environ.get("AWS_RDS_URL")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

# secure the API with OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# creating connection to the database
engine = create_engine(DATABASE_URL)
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
async def fetch_users(user_id: str = None, db: Session = Depends(get_db)):
    if user_id:
        users = db.query(User).filter(User.id == user_id).all()
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

@app.get("/api/v1/producer_consumer_matches/")
async def fetch_producer_consumer_matches(match_id: str = None, db: Session = Depends(get_db)):
    if match_id:
        matches = db.query(ProducerConsumerMatch).filter(ProducerConsumerMatch.id == match_id).all()
    else:
        matches = db.query(ProducerConsumerMatch).all()
    return [ProducerConsumerMatchModel.from_orm(match) for match in matches]

@app.get("/api/v1/users/all")
async def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [UserModel.from_orm(user) for user in users]

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
        "role": user.role
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
    # Check if the entry already exists
    existing = db.query(Product).filter_by(product_name=product.product_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product already exists.")

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