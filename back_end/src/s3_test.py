import boto3
from dotenv import load_dotenv
import os

load_dotenv()
aws_bucket_name = os.getenv("AWS_BUCKET_NAME")

# creating s3 connection and uploading a test file
s3 = boto3.client('s3')
s3.upload_file('data/test_upload.txt', aws_bucket_name, 'test_upload1.txt')