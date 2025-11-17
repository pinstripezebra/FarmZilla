"""
AWS ECS Fargate Deployment Script for FarmZilla React Frontend
Builds Docker image, pushes to ECR, and deploys to Fargate with cost optimization
"""

import boto3
import json
import time
import os
import subprocess
import sys
from dotenv import load_dotenv
from botocore.exceptions import ClientError

# Load environment variables from project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, '.env'))

class FarmZillaFrontendDeployer:
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
        self.ecr_client = boto3.client('ecr', region_name=self.region)
        
        # Frontend configuration from environment variables
        self.cluster_name = os.getenv('FRONTEND_CLUSTER_NAME')
        self.service_name = os.getenv('FRONTEND_SERVICE_NAME')
        self.task_family = os.getenv('FRONTEND_TASK_DEFINITION_FAMILY')
        self.container_name = os.getenv('FRONTEND_CONTAINER_NAME')
        self.log_group_name = os.getenv('FRONTEND_LOG_GROUP_NAME')
        self.execution_role_name = os.getenv('FRONTEND_EXECUTION_ROLE_NAME')
        self.task_role_name = os.getenv('FRONTEND_TASK_ROLE_NAME')
        self.security_group_name = os.getenv('FRONTEND_SECURITY_GROUP_NAME')
        
        # Application config (cost-optimized)
        self.container_port = int(os.getenv('FRONTEND_CONTAINER_PORT'))
        self.cpu = os.getenv('FRONTEND_CPU')
        self.memory = os.getenv('FRONTEND_MEMORY')
        self.desired_count = int(os.getenv('FRONTEND_DESIRED_COUNT'))
        
        # Paths and image config
        self.frontend_path = os.path.join(project_root, 'front_end')
        self.repository_name = os.getenv('FRONTEND_ECR_REPO')
        self.image_tag = 'latest'
        self.image_uri = f"{self.account_id}.dkr.ecr.{self.region}.amazonaws.com/{self.repository_name}:{self.image_tag}"
        
        # Network config - reuse existing VPC from backend
        self.vpc_id = self.get_default_vpc()
        self.subnet_ids = self.get_public_subnets()

    def get_default_vpc(self):
        """Get default VPC (same as backend)"""
        response = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'is-default', 'Values': ['true']}]
        )
        if response['Vpcs']:
            return response['Vpcs'][0]['VpcId']
        else:
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

    def create_ecr_repository(self):
        """Create ECR repository if it doesn't exist"""
        try:
            response = self.ecr_client.describe_repositories(
                repositoryNames=[self.repository_name]
            )
            print(f"✅ ECR repository {self.repository_name} already exists")
            return response['repositories'][0]['repositoryUri']
        except ClientError as e:
            if 'RepositoryNotFoundException' in str(e):
                print(f"Creating ECR repository: {self.repository_name}")
                response = self.ecr_client.create_repository(
                    repositoryName=self.repository_name,
                    imageScanningConfiguration={'scanOnPush': True}
                )
                
                # Set lifecycle policy separately
                lifecycle_policy = {
                    "rules": [
                        {
                            "rulePriority": 1,
                            "selection": {
                                "tagStatus": "untagged",
                                "countType": "sinceImagePushed",
                                "countUnit": "days",
                                "countNumber": 7
                            },
                            "action": {
                                "type": "expire"
                            }
                        }
                    ]
                }
                
                try:
                    self.ecr_client.put_lifecycle_policy(
                        repositoryName=self.repository_name,
                        lifecyclePolicyText=json.dumps(lifecycle_policy)
                    )
                    print(f"✅ ECR lifecycle policy applied")
                except ClientError as policy_error:
                    print(f"⚠️  Could not set lifecycle policy: {policy_error}")
                
                print(f"✅ ECR repository created: {response['repository']['repositoryUri']}")
                return response['repository']['repositoryUri']
            else:
                raise

    def build_and_push_image(self):
        """Build Docker image and push to ECR"""
        print("🔨 Building and pushing frontend Docker image...")
        
        # Create ECR repository
        self.create_ecr_repository()
        
        # Get ECR login token
        print("Getting ECR login token...")
        response = self.ecr_client.get_authorization_token()
        token = response['authorizationData'][0]['authorizationToken']
        endpoint = response['authorizationData'][0]['proxyEndpoint']
        
        # Decode token
        import base64
        username, password = base64.b64decode(token).decode().split(':')
        
        # Docker login to ECR
        login_cmd = f'echo {password} | docker login --username {username} --password-stdin {endpoint}'
        result = subprocess.run(login_cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"Docker login failed: {result.stderr}")
        print("✅ Logged in to ECR")
        
        # Change to frontend directory
        original_dir = os.getcwd()
        os.chdir(self.frontend_path)
        
        try:
            # Build Docker image
            print(f"Building Docker image: {self.image_uri}")
            build_cmd = f'docker build -t {self.image_uri} .'
            result = subprocess.run(build_cmd, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Docker build failed: {result.stderr}")
            print("✅ Docker image built successfully")
            
            # Push to ECR
            print(f"Pushing image to ECR...")
            push_cmd = f'docker push {self.image_uri}'
            result = subprocess.run(push_cmd, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                raise Exception(f"Docker push failed: {result.stderr}")
            print("✅ Image pushed to ECR successfully")
            
        finally:
            os.chdir(original_dir)

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
                raise

    def create_execution_role(self):
        """Create ECS task execution role"""
        try:
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
        
        response = self.iam_client.create_role(
            RoleName=self.execution_role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        
        self.iam_client.attach_role_policy(
            RoleName=self.execution_role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        )
        
        role_arn = response['Role']['Arn']
        print(f"✅ Created execution role: {role_arn}")
        return role_arn

    def create_task_role(self):
        """Create ECS task role (minimal permissions for frontend)"""
        try:
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
        
        response = self.iam_client.create_role(
            RoleName=self.task_role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        
        # Minimal policy for frontend (just CloudWatch logs)
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
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
        print(f"✅ Created task role: {role_arn}")
        return role_arn

    def create_security_group(self):
        """Create security group for frontend Fargate task"""
        try:
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
            
            print(f"Creating security group: {self.security_group_name}")
            response = self.ec2_client.create_security_group(
                GroupName=self.security_group_name,
                Description='Security group for FarmZilla React frontend',
                VpcId=self.vpc_id
            )
            
            sg_id = response['GroupId']
            
            # Add inbound rules for HTTP and HTTPS
            self.ec2_client.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 80,
                        'ToPort': 80,
                        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                    },
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 443,
                        'ToPort': 443,
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
        """Register ECS task definition for frontend"""
        execution_role_arn = self.create_execution_role()
        task_role_arn = self.create_task_role()
        
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
                    'logConfiguration': {
                        'logDriver': 'awslogs',
                        'options': {
                            'awslogs-group': self.log_group_name,
                            'awslogs-region': self.region,
                            'awslogs-stream-prefix': 'ecs'
                        }
                    },
                    # Cost optimization: resource limits
                    'memoryReservation': 256,
                    'cpu': 128
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
            response = self.ecs_client.describe_services(
                cluster=self.cluster_name,
                services=[self.service_name]
            )
            
            if response['services'] and response['services'][0]['status'] != 'INACTIVE':
                print(f"Service {self.service_name} already exists, updating...")
                return self.update_service()
            
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
                },
                # Cost optimization settings
                deploymentConfiguration={
                    'maximumPercent': 200,
                    'minimumHealthyPercent': 50
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
            response = self.ecs_client.list_tasks(
                cluster=self.cluster_name,
                serviceName=self.service_name
            )
            
            if not response['taskArns']:
                print("❌ No running tasks found")
                return None
            
            task_arn = response['taskArns'][0]
            
            response = self.ecs_client.describe_tasks(
                cluster=self.cluster_name,
                tasks=[task_arn]
            )
            
            task = response['tasks'][0]
            for attachment in task['attachments']:
                for detail in attachment['details']:
                    if detail['name'] == 'networkInterfaceId':
                        eni_id = detail['value']
                        
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
        print("🚀 Starting FarmZilla Frontend Fargate deployment...")
        print("=" * 60)
        
        try:
            # Step 1: Build and push Docker image
            self.build_and_push_image()
            
            # Step 2: Create cluster
            self.create_cluster()
            
            # Step 3: Create log group
            self.create_log_group()
            
            # Step 4: Create security group
            security_group_id = self.create_security_group()
            
            # Step 5: Register task definition
            self.register_task_definition()
            
            # Step 6: Create/update service
            self.create_service(security_group_id)
            
            # Step 7: Wait for service to stabilize
            self.wait_for_service_stable()
            
            # Step 8: Get public IP
            public_ip = self.get_public_ip()
            
            print("=" * 60)
            print("🎉 FARMZILLA FRONTEND DEPLOYMENT COMPLETE!")
            print("=" * 60)
            
            if public_ip:
                print(f"🌐 Your FarmZilla Frontend is running at:")
                print(f"   http://{public_ip}")
            else:
                print("⚠️  Could not retrieve public IP. Check AWS console for task details.")
            
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ Deployment failed: {e}")
            raise

if __name__ == "__main__":
    deployer = FarmZillaFrontendDeployer()
    deployer.deploy()