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
    image_url TEXT
    )
    """

producer_consumer_matching_table_creation_query = """CREATE TABLE IF NOT EXISTS producer_consumer_matches (
    id UUID PRIMARY KEY,
    producer_id VARCHAR(255) NOT NULL,
    consumer_id VARCHAR(255) NOT NULL
    )
    """

# Deleting tables if they already exist
engine.delete_table('users')
engine.delete_table('products')
engine.delete_table('producer_consumer_matches')

# Create tables
engine.create_table(users_table_creation_query)
engine.create_table(products_table_creation_query)
engine.create_table(producer_consumer_matching_table_creation_query)


# Ensuring each row of each dataframe has a unique ID
if 'id' not in users.columns:
    users['id'] = [str(uuid.uuid4())[:8] for _ in range(len(users))]
if 'id' not in products.columns:
    products['id'] = [str(uuid.uuid4()) for _ in range(len(products))]
if 'id' not in producer_consumer_matches.columns:
    producer_consumer_matches['id'] = [str(uuid.uuid4()) for _ in range(len(producer_consumer_matches))]

# Add image_url column to products dataframe with empty values for initial data
if 'image_url' not in products.columns:
    products['image_url'] = None  # or empty string '' if preferred


# Populates the 4 tables with data from the dataframes
engine.populate_table_dynamic(users, 'users')
engine.populate_table_dynamic(products, 'products')
engine.populate_table_dynamic(producer_consumer_matches, 'producer_consumer_matches')

# Testing if the tables were created and populated correctly
print(engine.test_table('users'))
print(engine.test_table('products'))
print(engine.test_table('producer_consumer_matches'))