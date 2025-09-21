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
consumers = pd.read_csv(os.getcwd() + '/data/consumers.csv')
producers = pd.read_csv(os.getcwd() + '/data/producers.csv')
products = pd.read_csv(os.getcwd() + '/data/products.csv')
producer_consumer_matches = pd.read_csv(os.getcwd() + '/data/producer_consumer_matches.csv')

# Defining queries to create tables
consumer_table_creation_query = """CREATE TABLE IF NOT EXISTS consumers (
    id UUID PRIMARY KEY,
    consumer_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
    )
    """

producers_table_creation_query = """CREATE TABLE IF NOT EXISTS producers (
    id UUID PRIMARY KEY,
    producer_id VARCHAR(255) UNIQUE NOT NULL,
    product_id VARCHAR(255) NOT NULL
    )
    """

products_table_creation_query = """CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    product_id VARCHAR(255) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL
    )
    """

producer_consumer_matching_table_creation_query = """CREATE TABLE IF NOT EXISTS producer_consumer_matches (
    id UUID PRIMARY KEY,
    producer_id VARCHAR(255) NOT NULL,
    consumer_id VARCHAR(255) NOT NULL
    )
    """

# Deleting tables if they already exist
engine.delete_table('consumers')
engine.delete_table('producers')
engine.delete_table('products')
engine.delete_table('producer_consumer_matches')

# Create tables
engine.create_table(consumer_table_creation_query)
engine.create_table(producers_table_creation_query)
engine.create_table(products_table_creation_query)
engine.create_table(producer_consumer_matching_table_creation_query)


# Ensuring each row of each dataframe has a unique ID
if 'id' not in consumers.columns:
    consumers['id'] = [str(uuid.uuid4()) for _ in range(len(consumers))]
if 'id' not in producers.columns:
    producers['id'] = [str(uuid.uuid4()) for _ in range(len(producers))]
if 'id' not in products.columns:
    products['id'] = [str(uuid.uuid4()) for _ in range(len(products))]
if 'id' not in producer_consumer_matches.columns:
    producer_consumer_matches['id'] = [str(uuid.uuid4()) for _ in range(len(producer_consumer_matches))]


# Populates the 4 tables with data from the dataframes
engine.populate_table_dynamic(consumers, 'consumers')
engine.populate_table_dynamic(producers, 'producers')
engine.populate_table_dynamic(products, 'products')
engine.populate_table_dynamic(producer_consumer_matches, 'producer_consumer_matches')

# Testing if the tables were created and populated correctly
print(engine.test_table('consumers'))
print(engine.test_table('producers'))
print(engine.test_table('products'))
print(engine.test_table('producer_consumer_matches'))