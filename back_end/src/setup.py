from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv
from utils.db_handler import DatabaseHandler
import pandas as pd
import uuid
import sys
from sqlalchemy.exc import OperationalError
import psycopg2

# Load environment variables from .env file (override=True reloads changed values)
load_dotenv(override=True)

# Get AWS RDS connection details from environment variables
db_identifier = os.environ.get("db_instance_identifier")
master_username = os.environ.get("master_username")
password = os.environ.get("password")
rds_endpoint = os.environ.get("RDS_ENDPOINT")
rds_port = os.environ.get("RDS_PORT", "5432")
rds_database = os.environ.get("RDS_DATABASE", "postgres")


# Construct PostgreSQL connection URL for RDS
URL_database = f"postgresql://{master_username}:{password}@{rds_endpoint}:{rds_port}/{rds_database}"

# Initialize DatabaseHandler with the constructed URL
engine = DatabaseHandler(URL_database)

# Loading csv files to populate to database
consumers = pd.read_csv('data/consumers.csv')
producers = pd.read_csv('data/producers.csv')
products = pd.read_csv('data/products.csv')
producer_consumer_matches = pd.read_csv('data/producer_consumer_matches.csv')