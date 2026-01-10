"""
Simple Route 53 Domain Deployment for FarmZilla Frontend
Points custom domain directly to current Fargate task IP
Note: IP will change when task restarts
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

class FarmZillaSimpleDomainDeployer:
    def __init__(self):
        # Load AWS configuration from environment variables
        self.region = os.getenv('AWS_REGION')
        self.account_id = os.getenv('AWS_ACCOUNT_ID')
        
        if not self.region or not self.account_id:
            raise ValueError("AWS_REGION and AWS_ACCOUNT_ID must be set in .env file")
        
        # Domain configuration
        self.domain_name = os.getenv('DOMAIN_NAME', 'farmzilla.xyz')
        self.hosted_zone_id = os.getenv('HOSTED_ZONE_ID')
        
        if not self.hosted_zone_id:
            raise ValueError("HOSTED_ZONE_ID must be set in .env file")
        
        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2', region_name=self.region)
        self.ecs_client = boto3.client('ecs', region_name=self.region)
        self.route53_client = boto3.client('route53', region_name=self.region)
        
        # ECS service configuration
        self.cluster_name = os.getenv('FRONTEND_CLUSTER_NAME', 'farmzilla-frontend-cluster')
        self.service_name = os.getenv('FRONTEND_SERVICE_NAME', 'farmzilla-frontend-service')

    def get_current_frontend_ip(self):
        """Get the current public IP of the frontend task"""
        try:
            print("🔍 Finding current frontend task IP...")
            
            # Get running tasks
            response = self.ecs_client.list_tasks(
                cluster=self.cluster_name,
                serviceName=self.service_name,
                desiredStatus='RUNNING'
            )
            
            if not response['taskArns']:
                raise Exception(f"No running tasks found for service {self.service_name}")
            
            # Get task details
            task_arn = response['taskArns'][0]
            response = self.ecs_client.describe_tasks(
                cluster=self.cluster_name,
                tasks=[task_arn]
            )
            
            task = response['tasks'][0]
            
            # Extract network interface ID from task attachments
            eni_id = None
            for attachment in task.get('attachments', []):
                if attachment['type'] == 'ElasticNetworkInterface':
                    for detail in attachment['details']:
                        if detail['name'] == 'networkInterfaceId':
                            eni_id = detail['value']
                            break
                    break
            
            if not eni_id:
                raise Exception("Network interface not found in task details")
            
            # Get the public IP of the network interface
            response = self.ec2_client.describe_network_interfaces(
                NetworkInterfaceIds=[eni_id]
            )
            
            eni = response['NetworkInterfaces'][0]
            if 'Association' in eni and 'PublicIp' in eni['Association']:
                public_ip = eni['Association']['PublicIp']
                print(f"✅ Found frontend IP: {public_ip}")
                return public_ip
            else:
                raise Exception("No public IP found for the task")
            
        except ClientError as e:
            print(f"❌ Error getting frontend IP: {e}")
            raise

    def update_route53_record(self, public_ip):
        """Update Route 53 A record to point to the frontend IP"""
        try:
            print(f"🌐 Updating Route 53 record for {self.domain_name} → {public_ip}")
            
            self.route53_client.change_resource_record_sets(
                HostedZoneId=self.hosted_zone_id,
                ChangeBatch={
                    'Changes': [
                        {
                            'Action': 'UPSERT',
                            'ResourceRecordSet': {
                                'Name': self.domain_name,
                                'Type': 'A',
                                'TTL': 60,  # Low TTL since IP may change
                                'ResourceRecords': [{'Value': public_ip}]
                            }
                        }
                    ]
                }
            )
            
            print(f"✅ DNS record updated: {self.domain_name} → {public_ip}")
            
        except ClientError as e:
            print(f"❌ Error updating Route 53 record: {e}")
            raise

    def verify_service_running(self):
        """Verify that the frontend service is running"""
        try:
            response = self.ecs_client.describe_services(
                cluster=self.cluster_name,
                services=[self.service_name]
            )
            
            if not response['services']:
                raise Exception(f"Service {self.service_name} not found")
            
            service = response['services'][0]
            
            if service['runningCount'] == 0:
                raise Exception(f"Service {self.service_name} has no running tasks")
            
            print(f"✅ Service {self.service_name} is running ({service['runningCount']} tasks)")
            return True
            
        except ClientError as e:
            print(f"❌ Error verifying service: {e}")
            raise

    def test_connectivity(self, public_ip):
        """Test connectivity to the frontend service"""
        try:
            import socket
            
            print(f"🔌 Testing connectivity to {public_ip}:80...")
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((public_ip, 80))
            sock.close()
            
            if result == 0:
                print(f"✅ Port 80 is accessible on {public_ip}")
                return True
            else:
                print(f"⚠️  Port 80 is not accessible on {public_ip}")
                return False
                
        except Exception as e:
            print(f"⚠️  Could not test connectivity: {e}")
            return False

    def deploy_simple_domain(self):
        """Deploy domain using current task IP"""
        print("🚀 Starting Simple Route 53 Domain Deployment...")
        print("=" * 60)
        
        try:
            # Step 1: Verify service is running
            self.verify_service_running()
            
            # Step 2: Get current frontend IP
            current_ip = self.get_current_frontend_ip()
            
            # Step 3: Test connectivity
            self.test_connectivity(current_ip)
            
            # Step 4: Update Route 53 record
            self.update_route53_record(current_ip)
            
            # Step 5: Wait for DNS propagation to start
            print("⏳ Waiting for DNS propagation to begin...")
            time.sleep(10)
            
            print("=" * 60)
            print("🎉 SIMPLE DOMAIN DEPLOYMENT COMPLETE!")
            print("=" * 60)
            print(f"🌐 Your FarmZilla Frontend is now available at:")
            print(f"   http://{self.domain_name}")
            print(f"📍 Current IP Address: {current_ip}")
            print(f"💰 Monthly Cost: $0.50 (Route 53 only)")
            print("=" * 60)
            print("⏰ DNS propagation: 2-5 minutes")
            print("⚠️  IMPORTANT: IP will change when task restarts")
            print("🔄 Re-run this script after service restarts to update DNS")
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ Simple domain deployment failed: {e}")
            raise

    def get_current_dns_record(self):
        """Get the current DNS record for the domain"""
        try:
            response = self.route53_client.list_resource_record_sets(
                HostedZoneId=self.hosted_zone_id
            )
            
            for record in response['ResourceRecordSets']:
                if record['Name'].rstrip('.') == self.domain_name and record['Type'] == 'A':
                    if 'ResourceRecords' in record:
                        current_ip = record['ResourceRecords'][0]['Value']
                        print(f"📋 Current DNS record: {self.domain_name} → {current_ip}")
                        return current_ip
            
            print(f"📋 No A record found for {self.domain_name}")
            return None
            
        except ClientError as e:
            print(f"❌ Error getting DNS record: {e}")
            return None

    def status_check(self):
        """Check current status of domain and service"""
        print("🔍 FARMZILLA DOMAIN STATUS CHECK")
        print("=" * 50)
        
        try:
            # Check service status
            self.verify_service_running()
            
            # Get current task IP
            current_ip = self.get_current_frontend_ip()
            
            # Get current DNS record
            dns_ip = self.get_current_dns_record()
            
            # Compare IPs
            if dns_ip and dns_ip == current_ip:
                print("✅ DNS record matches current task IP")
            elif dns_ip:
                print(f"⚠️  DNS record ({dns_ip}) differs from current task IP ({current_ip})")
                print("🔄 Run 'python deploy_domain_simple.py' to update")
            else:
                print("⚠️  No DNS record found")
                print("🔄 Run 'python deploy_domain_simple.py' to create")
            
            # Test connectivity
            if current_ip:
                self.test_connectivity(current_ip)
                
        except Exception as e:
            print(f"❌ Status check failed: {e}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Deploy FarmZilla frontend with simple domain')
    parser.add_argument('--deploy', action='store_true', default=False,
                       help='Deploy/update domain DNS record')
    parser.add_argument('--status', action='store_true', default=False,
                       help='Check current domain and service status')
    
    args = parser.parse_args()
    
    # If no arguments, default to deploy
    if not args.deploy and not args.status:
        args.deploy = True
    
    deployer = FarmZillaSimpleDomainDeployer()
    
    if args.status:
        deployer.status_check()
    elif args.deploy:
        deployer.deploy_simple_domain()

if __name__ == "__main__":
    main()