"""
AWS CodePipeline setup for FarmZilla CI/CD
Creates cost-optimized pipelines for both backend and frontend applications
"""

import boto3
import json
import os
import time
from dotenv import load_dotenv
from botocore.exceptions import ClientError

# Load environment variables from project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, '.env'))

class FarmZillaPipelineSetup:
    def __init__(self):
        self.region = os.getenv('AWS_REGION')
        self.account_id = os.getenv('AWS_ACCOUNT_ID')
        
        # Initialize AWS clients
        self.codepipeline_client = boto3.client('codepipeline', region_name=self.region)
        self.codebuild_client = boto3.client('codebuild', region_name=self.region)
        self.iam_client = boto3.client('iam', region_name=self.region)
        self.s3_client = boto3.client('s3', region_name=self.region)
        
        # Configuration from environment variables
        self.github_owner = os.getenv('GITHUB_OWNER')
        self.github_repo = os.getenv('GITHUB_REPO')
        self.github_token = os.getenv('GITHUB_TOKEN')
        
        # Backend configuration
        self.backend_pipeline_name = 'farmzilla-backend-pipeline'
        self.backend_build_project = 'farmzilla-backend-build'
        self.backend_cluster_name = os.getenv('CLUSTER_NAME')
        self.backend_service_name = os.getenv('SERVICE_NAME')
        self.backend_ecr_repo = os.getenv('BACKEND_ECR_REPO')
        self.container_name = os.getenv('CONTAINER_NAME')
        
        # Frontend configuration
        self.frontend_pipeline_name = 'farmzilla-frontend-pipeline'
        self.frontend_build_project = 'farmzilla-frontend-build'
        self.frontend_cluster_name = os.getenv('FRONTEND_CLUSTER_NAME')
        self.frontend_service_name = os.getenv('FRONTEND_SERVICE_NAME')
        self.frontend_ecr_repo = os.getenv('FRONTEND_ECR_REPO')
        self.frontend_container_name = os.getenv('FRONTEND_CONTAINER_NAME')
        
        # S3 bucket for artifacts
        self.artifacts_bucket = f"{os.getenv('ARTIFACTS_BUCKET')}-{self.account_id}"

    def create_s3_bucket(self):
        """Create S3 bucket for pipeline artifacts"""
        try:
            if self.region == 'us-east-1':
                self.s3_client.create_bucket(Bucket=self.artifacts_bucket)
            else:
                self.s3_client.create_bucket(
                    Bucket=self.artifacts_bucket,
                    CreateBucketConfiguration={'LocationConstraint': self.region}
                )
            
            # Enable versioning
            self.s3_client.put_bucket_versioning(
                Bucket=self.artifacts_bucket,
                VersioningConfiguration={'Status': 'Enabled'}
            )
            
            # Add lifecycle policy to manage costs
            lifecycle_policy = {
                'Rules': [
                    {
                        'ID': 'DeleteOldVersions',
                        'Status': 'Enabled',
                        'Filter': {'Prefix': ''},
                        'NoncurrentVersionExpiration': {'NoncurrentDays': 30}
                    },
                    {
                        'ID': 'DeleteIncompleteMultipartUploads',
                        'Status': 'Enabled',
                        'Filter': {'Prefix': ''},
                        'AbortIncompleteMultipartUpload': {'DaysAfterInitiation': 7}
                    }
                ]
            }
            
            self.s3_client.put_bucket_lifecycle_configuration(
                Bucket=self.artifacts_bucket,
                LifecycleConfiguration=lifecycle_policy
            )
            
            print(f"✅ Created S3 bucket with lifecycle policy: {self.artifacts_bucket}")
            
        except ClientError as e:
            if 'BucketAlreadyOwnedByYou' in str(e):
                print(f"✅ S3 bucket already exists: {self.artifacts_bucket}")
            else:
                raise

    def create_codebuild_service_role(self, role_name):
        """Create IAM role for CodeBuild with cost-optimized permissions"""
        try:
            response = self.iam_client.get_role(RoleName=role_name)
            print(f"✅ CodeBuild role already exists: {role_name}")
            return response['Role']['Arn']
        except ClientError as e:
            if 'NoSuchEntity' not in str(e):
                raise

        print(f"Creating CodeBuild service role: {role_name}")
        
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codebuild.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        response = self.iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        
        # Create custom policy with minimal required permissions
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{self.region}:{self.account_id}:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::{self.artifacts_bucket}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "ecr:GetAuthorizationToken",
                        "ecr:InitiateLayerUpload",
                        "ecr:UploadLayerPart",
                        "ecr:CompleteLayerUpload",
                        "ecr:PutImage"
                    ],
                    "Resource": "*"
                }
            ]
        }
        
        policy_name = f"{role_name}Policy"
        policy_arn = f"arn:aws:iam::{self.account_id}:policy/{policy_name}"
        
        try:
            self.iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document)
            )
        except ClientError as e:
            if 'EntityAlreadyExists' not in str(e):
                raise
        
        self.iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn=policy_arn
        )
        
        role_arn = response['Role']['Arn']
        print(f"✅ Created CodeBuild role: {role_arn}")
        return role_arn

    def create_codepipeline_service_role(self):
        """Create IAM role for CodePipeline"""
        role_name = 'farmzilla-codepipeline-role'
        
        try:
            response = self.iam_client.get_role(RoleName=role_name)
            print(f"✅ CodePipeline role already exists: {role_name}")
            return response['Role']['Arn']
        except ClientError as e:
            if 'NoSuchEntity' not in str(e):
                raise

        print(f"Creating CodePipeline service role: {role_name}")
        
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        response = self.iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy)
        )
        
        # Create custom policy
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketVersioning",
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.artifacts_bucket}",
                        f"arn:aws:s3:::{self.artifacts_bucket}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ecs:DescribeServices",
                        "ecs:DescribeTaskDefinition",
                        "ecs:DescribeTasks",
                        "ecs:ListTasks",
                        "ecs:RegisterTaskDefinition",
                        "ecs:UpdateService"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": ["iam:PassRole"],
                    "Resource": "*",
                    "Condition": {
                        "StringEqualsIfExists": {
                            "iam:PassedToService": [
                                "ecs-tasks.amazonaws.com"
                            ]
                        }
                    }
                }
            ]
        }
        
        policy_name = f"{role_name}Policy"
        policy_arn = f"arn:aws:iam::{self.account_id}:policy/{policy_name}"
        
        try:
            self.iam_client.create_policy(
                PolicyName=policy_name,
                PolicyDocument=json.dumps(policy_document)
            )
        except ClientError as e:
            if 'EntityAlreadyExists' not in str(e):
                raise
        
        self.iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn=policy_arn
        )
        
        role_arn = response['Role']['Arn']
        print(f"✅ Created CodePipeline role: {role_arn}")
        return role_arn

    def create_codebuild_project(self, project_name, buildspec_path, ecr_repo_name, container_name, is_frontend=False):
        """Create CodeBuild project with cost optimization"""
        try:
            response = self.codebuild_client.batch_get_projects(names=[project_name])
            if response['projects']:
                print(f"✅ CodeBuild project already exists: {project_name}")
                return
        except ClientError:
            pass

        role_arn = self.create_codebuild_service_role(f'{project_name}-role')
        
        # Wait for IAM role to be available (IAM eventual consistency)
        print(f"⏳ Waiting for IAM role to be ready...")
        time.sleep(10)
        
        print(f"Creating CodeBuild project: {project_name}")
        
        env_vars = [
            {'name': 'AWS_DEFAULT_REGION', 'value': self.region},
            {'name': 'AWS_ACCOUNT_ID', 'value': self.account_id},
            {'name': 'CONTAINER_NAME', 'value': container_name}
        ]
        
        if is_frontend:
            env_vars.extend([
                {'name': 'FRONTEND_ECR_REPO', 'value': ecr_repo_name},
                {'name': 'FRONTEND_CONTAINER_NAME', 'value': container_name}
            ])
        else:
            env_vars.extend([
                {'name': 'BACKEND_ECR_REPO', 'value': ecr_repo_name}
            ])
        
        project_config = {
            'name': project_name,
            'source': {
                'type': 'CODEPIPELINE',
                'buildspec': buildspec_path
            },
            'artifacts': {
                'type': 'CODEPIPELINE'
            },
            'environment': {
                'type': 'LINUX_CONTAINER',
                'image': 'aws/codebuild/standard:5.0',
                'computeType': 'BUILD_GENERAL1_SMALL',  # Cost optimization
                'privilegedMode': True,
                'environmentVariables': env_vars
            },
            'serviceRole': role_arn
        }
        
        # Retry mechanism for IAM role availability
        max_retries = 3
        for attempt in range(max_retries):
            try:
                self.codebuild_client.create_project(**project_config)
                print(f"✅ Created CodeBuild project: {project_name}")
                break
            except ClientError as e:
                if 'sts:AssumeRole' in str(e) and attempt < max_retries - 1:
                    print(f"⏳ IAM role not ready yet, retrying in 15 seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(15)
                else:
                    print(f"❌ Pipeline setup failed: {e}")
                    raise

    def create_pipeline(self, pipeline_name, build_project, cluster_name, service_name):
        """Create CodePipeline"""
        try:
            response = self.codepipeline_client.get_pipeline(name=pipeline_name)
            print(f"✅ Pipeline already exists: {pipeline_name}")
            return
        except ClientError as e:
            if 'PipelineNotFoundException' not in str(e):
                raise

        pipeline_role_arn = self.create_codepipeline_service_role()
        
        # Wait for IAM role to be available (IAM eventual consistency)
        print(f"⏳ Waiting for CodePipeline IAM role to be ready...")
        time.sleep(15)
        
        print(f"Creating pipeline: {pipeline_name}")
        
        pipeline_config = {
            'pipeline': {
                'name': pipeline_name,
                'roleArn': pipeline_role_arn,
                'artifactStore': {
                    'type': 'S3',
                    'location': self.artifacts_bucket
                },
                'stages': [
                    {
                        'name': 'Source',
                        'actions': [
                            {
                                'name': 'Source',
                                'actionTypeId': {
                                    'category': 'Source',
                                    'owner': 'ThirdParty',
                                    'provider': 'GitHub',
                                    'version': '1'
                                },
                                'configuration': {
                                    'Owner': self.github_owner,
                                    'Repo': self.github_repo,
                                    'Branch': 'main',
                                    'OAuthToken': self.github_token
                                },
                                'outputArtifacts': [
                                    {'name': 'SourceOutput'}
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'Build',
                        'actions': [
                            {
                                'name': 'Build',
                                'actionTypeId': {
                                    'category': 'Build',
                                    'owner': 'AWS',
                                    'provider': 'CodeBuild',
                                    'version': '1'
                                },
                                'configuration': {
                                    'ProjectName': build_project
                                },
                                'inputArtifacts': [
                                    {'name': 'SourceOutput'}
                                ],
                                'outputArtifacts': [
                                    {'name': 'BuildOutput'}
                                ]
                            }
                        ]
                    },
                    {
                        'name': 'Deploy',
                        'actions': [
                            {
                                'name': 'Deploy',
                                'actionTypeId': {
                                    'category': 'Deploy',
                                    'owner': 'AWS',
                                    'provider': 'ECS',
                                    'version': '1'
                                },
                                'configuration': {
                                    'ClusterName': cluster_name,
                                    'ServiceName': service_name,
                                    'FileName': 'imagedefinitions.json'
                                },
                                'inputArtifacts': [
                                    {'name': 'BuildOutput'}
                                ]
                            }
                        ]
                    }
                ]
            }
        }
        
        # Retry mechanism for IAM role availability
        max_retries = 3
        for attempt in range(max_retries):
            try:
                self.codepipeline_client.create_pipeline(**pipeline_config)
                print(f"✅ Created pipeline: {pipeline_name}")
                break
            except ClientError as e:
                if 'AssumeRole' in str(e) and attempt < max_retries - 1:
                    print(f"⏳ CodePipeline IAM role not ready yet, retrying in 20 seconds... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(20)
                else:
                    print(f"❌ Pipeline setup failed: {e}")
                    raise

    def setup_all_pipelines(self):
        """Set up both backend and frontend pipelines"""
        print("🚀 Setting up FarmZilla CI/CD Pipelines...")
        print("=" * 60)
        
        try:
            # Create S3 bucket for artifacts
            self.create_s3_bucket()
            
            # Create backend pipeline
            print("\n📦 Setting up Backend Pipeline...")
            self.create_codebuild_project(
                self.backend_build_project,
                'buildspec-backend.yml',
                self.backend_ecr_repo,
                self.container_name,
                is_frontend=False
            )
            
            self.create_pipeline(
                self.backend_pipeline_name,
                self.backend_build_project,
                self.backend_cluster_name,
                self.backend_service_name
            )
            
            # Create frontend pipeline
            print("\n🌐 Setting up Frontend Pipeline...")
            self.create_codebuild_project(
                self.frontend_build_project,
                'buildspec-frontend.yml',
                self.frontend_ecr_repo,
                self.frontend_container_name,
                is_frontend=True
            )
            
            self.create_pipeline(
                self.frontend_pipeline_name,
                self.frontend_build_project,
                self.frontend_cluster_name,
                self.frontend_service_name
            )
            
            print("\n" + "=" * 60)
            print("🎉 CI/CD PIPELINE SETUP COMPLETE!")
            print("=" * 60)
            print(f"Backend Pipeline: {self.backend_pipeline_name}")
            print(f"Frontend Pipeline: {self.frontend_pipeline_name}")
            print(f"Artifacts Bucket: {self.artifacts_bucket}")
            print("\n💰 Cost Optimization Features:")
            print("• Small build instances (BUILD_GENERAL1_SMALL)")
            print("• S3 lifecycle policies for artifact cleanup")
            print("• Minimal IAM permissions")
            print("• Fargate SPOT pricing compatible")
            print("\n📝 Next Steps:")
            print("1. Add your GitHub token to .env file")
            print("2. Push your code to the main branch")
            print("3. Monitor pipeline execution in AWS Console")
            print("4. Your applications will be automatically deployed!")
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ Pipeline setup failed: {e}")
            raise

if __name__ == "__main__":
    import sys
    
    # Check required environment variables
    required_vars = [
        'AWS_REGION', 'AWS_ACCOUNT_ID', 'GITHUB_OWNER', 
        'GITHUB_REPO', 'CLUSTER_NAME', 'SERVICE_NAME', 
        'FRONTEND_CLUSTER_NAME', 'FRONTEND_SERVICE_NAME',
        'BACKEND_ECR_REPO', 'FRONTEND_ECR_REPO'
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please update your .env file with the missing variables.")
        sys.exit(1)
    
    if not os.getenv('GITHUB_TOKEN'):
        print("⚠️  GITHUB_TOKEN not set in .env file.")
        print("Please create a GitHub Personal Access Token with repo permissions and add it to your .env file.")
        print("You can create one at: https://github.com/settings/tokens")
    
    setup = FarmZillaPipelineSetup()
    setup.setup_all_pipelines()