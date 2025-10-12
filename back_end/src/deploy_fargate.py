"""
AWS ECS Fargate Deployment Automation Script for FarmZilla
Automates the deployment of FastAPI application to AWS Fargate with S3 and RDS access
"""

import boto3
import json
import time
import os
from dotenv import load_dotenv
from botocore.exceptions import ClientError

# Load environment variables from project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, '.env'))

class FarmZillaFargateDeployer:
    def __init__(self):
        # Load AWS configuration from environment variables
        self.region = os.getenv('AWS_REGION')
        self.account_id = os.getenv('AWS_ACCOUNT_ID')
        
        if not self.region or not self.account_id:
            raise ValueError("AWS_REGION and AWS_ACCOUNT_ID must be set in .env file")
        
        # Initialize AWS clients
        self.ecs_client = boto3.client('ecs', region_name=self.region)
        self.ec2_client = boto3.client('ec2', region_name=self.region)
        self.logs_client = boto3.client('logs', region_name=self.region)
        self.iam_client = boto3.client('iam', region_name=self.region)
        
        # Configuration from environment variables
        self.cluster_name = os.getenv('CLUSTER_NAME')
        self.service_name = os.getenv('SERVICE_NAME')
        self.task_family = os.getenv('TASK_DEFINITION_FAMILY')
        self.container_name = os.getenv('CONTAINER_NAME')
        self.log_group_name = os.getenv('LOG_GROUP_NAME')
        self.execution_role_name = os.getenv('EXECUTION_ROLE_NAME')
        self.task_role_name = os.getenv('TASK_ROLE_NAME')
        self.security_group_name = os.getenv('SECURITY_GROUP_NAME')

        # Application config from environment variables
        self.container_port = int(os.getenv('CONTAINER_PORT'))
        self.cpu = os.getenv('CPU')
        self.memory = os.getenv('MEMORY')
        self.desired_count = int(os.getenv('DESIRED_COUNT'))

        # Image config from environment variables
        self.image_uri = f"{self.account_id}.dkr.ecr.{self.region}.amazonaws.com/farmzilla:back-end"
        
        # Get VPC and subnet info
        self.vpc_id = self.get_default_vpc()
        self.subnet_ids = self.get_public_subnets()

    def get_default_vpc(self):
        """Get default VPC"""
        response = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'is-default', 'Values': ['true']}]
        )
        if response['Vpcs']:
            return response['Vpcs'][0]['VpcId']
        else:
            # If no default VPC, get the first available VPC
            response = self.ec2_client.describe_vpcs()
            return response['Vpcs'][0]['VpcId']

    def get_public_subnets(self):
        """Get public subnets in the VPC"""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
            ]
        )
        return [subnet['SubnetId'] for subnet in response['Subnets']]

    def create_cluster(self):
        """Create ECS cluster if it doesn't exist"""
        try:
            print(f"Creating ECS cluster: {self.cluster_name}")
            response = self.ecs_client.create_cluster(clusterName=self.cluster_name)
            print(f"✅ Cluster created: {response['cluster']['clusterArn']}")
            return response['cluster']['clusterArn']
        except ClientError as e:
            if 'ClusterAlreadyExistsException' in str(e):
                print(f"✅ Cluster {self.cluster_name} already exists")
                return self.get_cluster_arn()
            else:
                print(f"❌ Error creating cluster: {e}")
                raise

    def get_cluster_arn(self):
        """Get existing cluster ARN"""
        response = self.ecs_client.describe_clusters(clusters=[self.cluster_name])
        return response['clusters'][0]['clusterArn']

    def create_log_group(self):
        """Create CloudWatch log group if it doesn't exist"""
        try:
            print(f"Creating log group: {self.log_group_name}")
            self.logs_client.create_log_group(logGroupName=self.log_group_name)
            print(f"✅ Log group created: {self.log_group_name}")
        except ClientError as e:
            if 'ResourceAlreadyExistsException' in str(e):
                print(f"✅ Log group {self.log_group_name} already exists")
            else:
                print(f"❌ Error creating log group: {e}")
                raise

    def create_execution_role(self):
        """Create ECS task execution role"""
        try:
            # Check if role exists
            response = self.iam_client.get_role(RoleName=self.execution_role_name)
            print(f"✅ Execution role already exists: {response['Role']['Arn']}")
            return response['Role']['Arn']
        except ClientError as e:
            if 'NoSuchEntity' not in str(e):
                raise

        print(f"Creating execution role: {self.execution_role_name}")
        
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        # Create role
        response = self.iam_client.create_role(
            RoleName=self.execution_role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        
        # Attach policy
        self.iam_client.attach_role_policy(
            RoleName=self.execution_role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        )
        
        role_arn = response['Role']['Arn']
        print(f"✅ Created execution role: {role_arn}")
        return role_arn

    def create_task_role(self):
        """Create ECS task role with S3 and RDS permissions"""
        try:
            # Check if role exists
            response = self.iam_client.get_role(RoleName=self.task_role_name)
            print(f"✅ Task role already exists: {response['Role']['Arn']}")
            return response['Role']['Arn']
        except ClientError as e:
            if 'NoSuchEntity' not in str(e):
                raise

        print(f"Creating task role: {self.task_role_name}")
        
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        # Create role
        response = self.iam_client.create_role(
            RoleName=self.task_role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        
        # Create custom policy for S3 and RDS access with minimal permissions
        bucket_name = os.getenv('AWS_BUCKET_NAME')
        rds_endpoint = os.getenv('AWS_RDS_ENDPOINT')
        
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "S3BucketAccess",
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}/*"
                    ]
                },
                {
                    "Sid": "S3BucketList",
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}"
                    ],
                    "Condition": {
                        "StringLike": {
                            "s3:prefix": ["*"]
                        }
                    }
                },
                {
                    "Sid": "RDSConnectOnly",
                    "Effect": "Allow",
                    "Action": [
                        "rds-db:connect"
                    ],
                    "Resource": [
                        f"arn:aws:rds-db:{self.region}:{self.account_id}:dbuser:*"
                    ]
                },
                {
                    "Sid": "CloudWatchLogs",
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": [
                        f"arn:aws:logs:{self.region}:{self.account_id}:log-group:{self.log_group_name}:*"
                    ]
                }
            ]
        }
        
        # Create and attach custom policy
        policy_name = f"{self.task_role_name}Policy"
        try:
            self.iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document)
            )
        except ClientError as e:
            if 'EntityAlreadyExists' not in str(e):
                raise
        
        policy_arn = f"arn:aws:iam::{self.account_id}:policy/{policy_name}"
        self.iam_client.attach_role_policy(
            RoleName=self.task_role_name,
            PolicyArn=policy_arn
        )
        
        role_arn = response['Role']['Arn']
        print(f"✅ Created task role with S3/RDS permissions: {role_arn}")
        return role_arn

    def create_security_group(self):
        """Create security group for Fargate task"""
        
        try:
            # Check if security group exists
            response = self.ec2_client.describe_security_groups(
                Filters=[
                    {'Name': 'group-name', 'Values': [self.security_group_name]},
                    {'Name': 'vpc-id', 'Values': [self.vpc_id]}
                ]
            )
            
            if response['SecurityGroups']:
                sg_id = response['SecurityGroups'][0]['GroupId']
                print(f"✅ Security group already exists: {sg_id}")
                return sg_id
            
            # Create security group
            print(f"Creating security group: {self.security_group_name}")
            response = self.ec2_client.create_security_group(
                GroupName=self.security_group_name,
                Description='Security group for FarmZilla FastAPI application',
                VpcId=self.vpc_id
            )
            
            sg_id = response['GroupId']
            
            # Add inbound rule for container port
            self.ec2_client.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': self.container_port,
                        'ToPort': self.container_port,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    }
                ]
            )
            
            print(f"✅ Security group created: {sg_id}")
            return sg_id
            
        except ClientError as e:
            print(f"❌ Error with security group: {e}")
            raise

    def register_task_definition(self):
        """Register ECS task definition with environment variables"""
        execution_role_arn = self.create_execution_role()
        task_role_arn = self.create_task_role()
        
        # Environment variables from .env file
        environment_vars = [
            {"name": "AWS_RDS_PASSWORD", "value": os.getenv("AWS_RDS_PASSWORD")},
            {"name": "AWS_RDS_ENDPOINT", "value": os.getenv("AWS_RDS_ENDPOINT")},
            {"name": "AWS_RDS_MASTER_USERNAME", "value": os.getenv("AWS_RDS_MASTER_USERNAME")},
            {"name": "AWS_RDS_PORT", "value": os.getenv("AWS_RDS_PORT")},
            {"name": "AWS_RDS_DATABASE", "value": os.getenv("AWS_RDS_DATABASE")},
            {"name": "AWS_BUCKET_NAME", "value": os.getenv("AWS_BUCKET_NAME")},
            {"name": "AWS_RDS_URL", "value": os.getenv("AWS_RDS_URL")},
            {"name": "AUTH_SECRET_KEY", "value": os.getenv("AUTH_SECRET_KEY")},
            {"name": "ALGORITHM", "value": os.getenv("ALGORITHM")},
            {"name": "ACCESS_TOKEN_EXPIRE_MINUTES", "value": os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")},
            {"name": "AWS_DEFAULT_REGION", "value": self.region}
        ]
        
        task_definition = {
            'family': self.task_family,
            'networkMode': 'awsvpc',
            'requiresCompatibilities': ['FARGATE'],
            'cpu': self.cpu,
            'memory': self.memory,
            'executionRoleArn': execution_role_arn,
            'taskRoleArn': task_role_arn,
            'containerDefinitions': [
                {
                    'name': self.container_name,
                    'image': self.image_uri,
                    'portMappings': [
                        {
                            'containerPort': self.container_port,
                            'protocol': 'tcp'
                        }
                    ],
                    'essential': True,
                    'environment': environment_vars,
                    'logConfiguration': {
                        'logDriver': 'awslogs',
                        'options': {
                            'awslogs-group': self.log_group_name,
                            'awslogs-region': self.region,
                            'awslogs-stream-prefix': 'ecs'
                        }
                    }
                }
            ]
        }
        
        print(f"Registering task definition: {self.task_family}")
        response = self.ecs_client.register_task_definition(**task_definition)
        
        task_def_arn = response['taskDefinition']['taskDefinitionArn']
        revision = response['taskDefinition']['revision']
        print(f"✅ Task definition registered: {self.task_family}:{revision}")
        return task_def_arn

    def create_service(self, security_group_id):
        """Create or update ECS service"""
        try:
            # Check if service exists
            response = self.ecs_client.describe_services(
                cluster=self.cluster_name,
                services=[self.service_name]
            )
            
            if response['services'] and response['services'][0]['status'] != 'INACTIVE':
                print(f"Service {self.service_name} already exists, updating...")
                return self.update_service()
            
            # Create new service
            print(f"Creating ECS service: {self.service_name}")
            response = self.ecs_client.create_service(
                cluster=self.cluster_name,
                serviceName=self.service_name,
                taskDefinition=self.task_family,
                desiredCount=self.desired_count,
                launchType='FARGATE',
                networkConfiguration={
                    'awsvpcConfiguration': {
                        'subnets': self.subnet_ids,
                        'securityGroups': [security_group_id],
                        'assignPublicIp': 'ENABLED'
                    }
                }
            )
            
            service_arn = response['service']['serviceArn']
            print(f"✅ Service created: {service_arn}")
            return service_arn
            
        except ClientError as e:
            print(f"❌ Error creating service: {e}")
            raise

    def update_service(self):
        """Update existing service with new task definition"""
        print(f"Updating service {self.service_name} with latest task definition")
        response = self.ecs_client.update_service(
            cluster=self.cluster_name,
            service=self.service_name,
            taskDefinition=self.task_family,
            forceNewDeployment=True
        )
        
        service_arn = response['service']['serviceArn']
        print(f"✅ Service updated: {service_arn}")
        return service_arn

    def wait_for_service_stable(self):
        """Wait for service to reach stable state"""
        print("Waiting for service to stabilize...")
        waiter = self.ecs_client.get_waiter('services_stable')
        waiter.wait(
            cluster=self.cluster_name,
            services=[self.service_name],
            WaiterConfig={'maxAttempts': 30}
        )
        print("✅ Service is stable!")

    def get_public_ip(self):
        """Get public IP of running task"""
        try:
            # Get running tasks
            response = self.ecs_client.list_tasks(
                cluster=self.cluster_name,
                serviceName=self.service_name
            )
            
            if not response['taskArns']:
                print("❌ No running tasks found")
                return None
            
            task_arn = response['taskArns'][0]
            
            # Get task details
            response = self.ecs_client.describe_tasks(
                cluster=self.cluster_name,
                tasks=[task_arn]
            )
            
            # Extract network interface ID
            task = response['tasks'][0]
            for attachment in task['attachments']:
                for detail in attachment['details']:
                    if detail['name'] == 'networkInterfaceId':
                        eni_id = detail['value']
                        
                        # Get public IP from network interface
                        response = self.ec2_client.describe_network_interfaces(
                            NetworkInterfaceIds=[eni_id]
                        )
                        
                        ni = response['NetworkInterfaces'][0]
                        if 'Association' in ni and 'PublicIp' in ni['Association']:
                            return ni['Association']['PublicIp']
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting public IP: {e}")
            return None

    def deploy(self):
        """Main deployment method"""
        print("🚀 Starting FarmZilla Fargate deployment...")
        print("=" * 60)
        
        try:
            # Step 1: Create cluster
            self.create_cluster()
            
            # Step 2: Create log group
            self.create_log_group()
            
            # Step 3: Create security group
            security_group_id = self.create_security_group()
            
            # Step 4: Register task definition
            self.register_task_definition()
            
            # Step 5: Create/update service
            self.create_service(security_group_id)
            
            # Step 6: Wait for service to stabilize
            self.wait_for_service_stable()
            
            # Step 7: Get public IP
            public_ip = self.get_public_ip()
            
            print("=" * 60)
            print("🎉 FARMZILLA DEPLOYMENT COMPLETE!")
            print("=" * 60)
            
            if public_ip:
                print(f"🌐 Your FarmZilla API is running at:")
                print(f"   Main endpoint: http://{public_ip}:{self.container_port}/")
                print(f"   API docs:      http://{public_ip}:{self.container_port}/docs")
                print(f"   OpenAPI spec:  http://{public_ip}:{self.container_port}/openapi.json")
            else:
                print("⚠️  Could not retrieve public IP. Check AWS console for task details.")
            
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ Deployment failed: {e}")
            raise

if __name__ == "__main__":
    deployer = FarmZillaFargateDeployer()
    deployer.deploy()