from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv
from utils.db_handler import DatabaseHandler
import pandas as pd
import uuid

# Load environment variables from .env file (override=True reloads changed values)
load_dotenv(override=True)

# Get AWS RDS connection details from environment variables
master_username = os.environ.get("AWS_RDS_MASTER_USERNAME")
password = os.environ.get("AWS_RDS_PASSWORD")
rds_endpoint = os.environ.get('AWS_RDS_ENDPOINT')
rds_port = os.environ.get("AWS_RDS_PORT")
rds_database = os.environ.get("AWS_RDS_DATABASE")

# Construct PostgreSQL connection URL for RDS
URL_database = f"postgresql://{master_username}:{password}@{rds_endpoint}:{rds_port}/{rds_database}"

# Initialize DatabaseHandler with the constructed URL
engine = DatabaseHandler(URL_database)

# loading csv files into pandas dataframes
project_root = os.path.dirname(os.path.dirname(os.getcwd()))  # Go up two directories to project root
users = pd.read_csv(os.path.join(project_root, 'data', 'users.csv'))
products = pd.read_csv(os.path.join(project_root, 'data', 'products.csv'))
producer_consumer_matches = pd.read_csv(os.path.join(project_root, 'data', 'producer_consumer_matches.csv'))

# Create sample events data based on EventsMap.tsx
events_data = [
    {
        'event_id': str(uuid.uuid4()),
        'name': 'Farmers Market Downtown',
        'date': '2025-11-01',
        'time': '8:00 AM - 2:00 PM',
        'location': 'Downtown Seattle',
        'description': 'Weekly farmers market featuring local produce',
        'coordinates': '47.6062, -122.3321'
    },
    {
        'event_id': str(uuid.uuid4()),
        'name': 'Agricultural Fair',
        'date': '2025-11-15',
        'time': '9:00 AM - 6:00 PM',
        'location': 'Seattle Center',
        'description': 'Annual agricultural fair and exhibition',
        'coordinates': '47.6205, -122.3493'
    },
    {
        'event_id': str(uuid.uuid4()),
        'name': 'Farm to Table Event',
        'date': '2025-12-01',
        'time': '5:00 PM - 9:00 PM',
        'location': 'Capitol Hill',
        'description': 'Farm to table dining experience',
        'coordinates': '47.5952, -122.3316'
    }
]

# Create sample event vendor data
event_vendor_data = [
    {'event_id': events_data[0]['event_id'], 'consumer_id': 'consumer1'},
    {'event_id': events_data[0]['event_id'], 'consumer_id': 'consumer2'},
    {'event_id': events_data[1]['event_id'], 'consumer_id': 'consumer1'},
    {'event_id': events_data[2]['event_id'], 'consumer_id': 'consumer3'},
]

# Convert to DataFrames
events = pd.DataFrame(events_data)
event_vendor = pd.DataFrame(event_vendor_data)

# Defining queries to create tables
users_table_creation_query = """CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
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
    consumer_id VARCHAR(255) NOT NULL
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

# Deleting tables if they already exist
engine.delete_table('users')
engine.delete_table('products')
engine.delete_table('producer_consumer_matches')
engine.delete_table('events')
engine.delete_table('event_vendor')

# Create tables
engine.create_table(users_table_creation_query)
engine.create_table(products_table_creation_query)
engine.create_table(producer_consumer_matching_table_creation_query)
engine.create_table(events_table_creation_query)
engine.create_table(event_vendor_table_creation_query)


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

# Add image_url column to products dataframe with empty values for initial data
if 'image_url' not in products.columns:
    products['image_url'] = None  # or empty string '' if preferred

# Add user_id column to products dataframe with empty values for initial data  
if 'user_id' not in products.columns:
    products['user_id'] = None  # Will be None for existing products


# Populates the tables with data from the dataframes
engine.populate_table_dynamic(users, 'users')
engine.populate_table_dynamic(products, 'products')
engine.populate_table_dynamic(producer_consumer_matches, 'producer_consumer_matches')
engine.populate_table_dynamic(events, 'events')
engine.populate_table_dynamic(event_vendor, 'event_vendor')

# Testing if the tables were created and populated correctly
print(engine.test_table('users'))
print(engine.test_table('products'))
print(engine.test_table('producer_consumer_matches'))
print(engine.test_table('events'))
print(engine.test_table('event_vendor'))