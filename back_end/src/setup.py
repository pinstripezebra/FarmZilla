from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv
from utils.db_handler import DatabaseHandler
import pandas as pd
import uuid
import boto3
from botocore.exceptions import ClientError
from passlib.context import CryptContext

# Load environment variables from .env file (override=True reloads changed values)
load_dotenv(override=True)

# Get AWS RDS connection details from environment variables
master_username = os.environ.get("AWS_RDS_MASTER_USERNAME")
password = os.environ.get("AWS_RDS_PASSWORD")
rds_endpoint = os.environ.get('AWS_RDS_ENDPOINT')
rds_port = os.environ.get("AWS_RDS_PORT")
rds_database = os.environ.get("AWS_RDS_DATABASE")

# Get AWS S3 configuration
aws_bucket_name = os.environ.get("AWS_BUCKET_NAME")

# Construct PostgreSQL connection URL for RDS
URL_database = f"postgresql://{master_username}:{password}@{rds_endpoint}:{rds_port}/{rds_database}"

# Initialize DatabaseHandler with the constructed URL
engine = DatabaseHandler(URL_database)

# Initialize S3 client
s3 = boto3.client('s3')

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def upload_images_to_s3():
    """Upload product images to S3 and return a mapping of product names to S3 URLs"""
    image_urls = {}
    images_path = os.path.join(project_root, 'data', 'images')
    
    # Validate AWS bucket name
    if not aws_bucket_name:
        print("ERROR: AWS bucket name is not configured. Skipping S3 upload.")
        return image_urls
    
    # List of image files that correspond to our products
    image_files = [
        'bell pepper.png', 'carrot.png', 'cilantro.png', 'corn.png', 'cucumber.png',
        'eggs.png', 'fennel.png', 'granny smith apple.png', 'grape tomato.png',
        'jalapeno.png', 'kale.png', 'mango.png', 'potato.png', 'purple onion.png',
        'radish.png', 'shallot.png', 'tomato.png'
    ]
    
    for image_file in image_files:
        try:
            # Convert filename to product name (remove .png and handle spaces)
            product_name = image_file.replace('.png', '').replace(' ', ' ').title()
            
            # Handle special cases for product name matching
            if product_name == 'Bell Pepper':
                product_key = 'Bell Pepper'
            elif product_name == 'Granny Smith Apple':
                product_key = 'Granny Smith Apple'
            elif product_name == 'Grape Tomato':
                product_key = 'Grape Tomato'
            elif product_name == 'Purple Onion':
                product_key = 'Purple Onion'
            else:
                product_key = product_name
            
            # S3 key (filename in bucket)
            s3_key = f"product-images/{image_file}"
            
            # Full local file path
            local_file_path = os.path.join(images_path, image_file)
            
            # Check if file exists
            if os.path.exists(local_file_path):
                print(f"Uploading {image_file}...")
                
                # Upload to S3
                s3.upload_file(local_file_path, aws_bucket_name, s3_key)
                
                # Generate S3 URL
                s3_url = f"https://{aws_bucket_name}.s3.amazonaws.com/{s3_key}"
                image_urls[product_key] = s3_url
                
                print(f"✓ Uploaded {image_file} to S3: {s3_url}")
            else:
                print(f"Warning: Image file {image_file} not found at {local_file_path}")
                
        except ClientError as e:
            print(f"AWS Client Error uploading {image_file}: {e}")
        except Exception as e:
            print(f"Unexpected error uploading {image_file}: {e}")
            print(f"Error type: {type(e).__name__}")
            print(f"AWS bucket name type: {type(aws_bucket_name)}, value: {repr(aws_bucket_name)}")
    
    return image_urls

# loading csv files into pandas dataframes
# Get the project root by going up from this file's location
current_file_dir = os.path.dirname(os.path.abspath(__file__))  # /back_end/src
back_end_dir = os.path.dirname(current_file_dir)  # /back_end
project_root = os.path.dirname(back_end_dir)  # /project_root

users = pd.read_csv(os.path.join(project_root, 'data', 'users.csv'))
products = pd.read_csv(os.path.join(project_root, 'data', 'products.csv'))
producer_consumer_matches = pd.read_csv(os.path.join(project_root, 'data', 'producer_consumer_matches.csv'))
ratings = pd.read_csv(os.path.join(project_root, 'data', 'ratings.csv'))
events = pd.read_csv(os.path.join(project_root, 'data', 'events.csv'))
event_vendor = pd.read_csv(os.path.join(project_root, 'data', 'event_vendor.csv'))

# Defining queries to create tables
users_table_creation_query = """CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    location VARCHAR(255)
    )
    """

products_table_creation_query = """CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    product_id VARCHAR(255) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    user_id UUID
    )
    """

producer_consumer_matching_table_creation_query = """CREATE TABLE IF NOT EXISTS producer_consumer_matches (
    id UUID PRIMARY KEY,
    producer_id VARCHAR(255) NOT NULL,
    consumer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """

events_table_creation_query = """CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    date VARCHAR(255) NOT NULL,
    time VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    coordinates VARCHAR(255) NOT NULL
    )
    """

event_vendor_table_creation_query = """CREATE TABLE IF NOT EXISTS event_vendor (
    id UUID PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    consumer_id VARCHAR(255) NOT NULL
    )
    """

ratings_table_creation_query = """CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY,
    producer_id VARCHAR(255) NOT NULL,
    consumer_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """

# Deleting tables if they already exist
engine.delete_table('users')
engine.delete_table('products')
engine.delete_table('producer_consumer_matches')
engine.delete_table('events')
engine.delete_table('event_vendor')
engine.delete_table('ratings')

# Create tables
engine.create_table(users_table_creation_query)
engine.create_table(products_table_creation_query)
engine.create_table(producer_consumer_matching_table_creation_query)
engine.create_table(events_table_creation_query)
engine.create_table(event_vendor_table_creation_query)
engine.create_table(ratings_table_creation_query)


# Ensuring each row of each dataframe has a unique ID
if 'id' not in users.columns:
    users['id'] = [str(uuid.uuid4())[:8] for _ in range(len(users))]
if 'id' not in products.columns:
    products['id'] = [str(uuid.uuid4()) for _ in range(len(products))]
if 'id' not in producer_consumer_matches.columns:
    producer_consumer_matches['id'] = [str(uuid.uuid4()) for _ in range(len(producer_consumer_matches))]

# Add unique IDs for events and event_vendor
if 'id' not in events.columns:
    events['id'] = [str(uuid.uuid4()) for _ in range(len(events))]
if 'id' not in event_vendor.columns:
    event_vendor['id'] = [str(uuid.uuid4()) for _ in range(len(event_vendor))]

# Add unique IDs for ratings
if 'id' not in ratings.columns:
    ratings['id'] = [str(uuid.uuid4()) for _ in range(len(ratings))]

# Upload images to S3 and get URLs
print("Uploading product images to S3...")
image_urls = upload_images_to_s3()

# Add image_url column to products dataframe with S3 URLs
if 'image_url' not in products.columns:
    products['image_url'] = None

# Map S3 URLs to products based on product names
for index, row in products.iterrows():
    product_name = row['product_name']
    if product_name in image_urls:
        products.at[index, 'image_url'] = image_urls[product_name]
        print(f"Mapped {product_name} to S3 URL: {image_urls[product_name]}")
    else:
        print(f"Warning: No image found for product: {product_name}")

# The user_id column is now properly included from the CSV file

# Hash user passwords before storing them in the database
print("Hashing user passwords...")
for index, row in users.iterrows():
    plain_password = row['password']
    hashed_password = pwd_context.hash(plain_password)
    users.at[index, 'password'] = hashed_password
    print(f"Hashed password for user: {row['username']}")


# Populates the tables with data from the dataframes
engine.populate_table_dynamic(users, 'users')
engine.populate_table_dynamic(products, 'products')
engine.populate_table_dynamic(producer_consumer_matches, 'producer_consumer_matches')
engine.populate_table_dynamic(events, 'events')
engine.populate_table_dynamic(event_vendor, 'event_vendor')
engine.populate_table_dynamic(ratings, 'ratings')

# Testing if the tables were created and populated correctly
print(engine.test_table('users'))
print(engine.test_table('products'))
print(engine.test_table('producer_consumer_matches'))
print(engine.test_table('events'))
print(engine.test_table('event_vendor'))
print(engine.test_table('ratings'))