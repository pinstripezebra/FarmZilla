"""
Frontend deployment script for FarmZilla React application
"""

import sys
import os
from deploy_frontend_fargate import FarmZillaFrontendDeployer
import argparse

def main():
    parser = argparse.ArgumentParser(description='Deploy FarmZilla frontend to AWS Fargate')
    parser.add_argument('--update-only', action='store_true', 
                       help='Only update existing service with new task definition')
    parser.add_argument('--scale', type=int, 
                       help='Scale service to specified number of tasks')
    parser.add_argument('--stop', action='store_true',
                       help='Stop the service (scale to 0)')
    parser.add_argument('--delete', action='store_true',
                       help='Delete the service')
    
    args = parser.parse_args()
    
    deployer = FarmZillaFrontendDeployer()
    
    if args.delete:
        delete_service(deployer)
    elif args.stop:
        scale_service(deployer, 0)
    elif args.scale:
        scale_service(deployer, args.scale)
    elif args.update_only:
        update_only(deployer)
    else:
        deployer.deploy()

def update_only(deployer):
    """Update existing service with new task definition"""
    print("🔄 Updating frontend service...")
    try:
        deployer.build_and_push_image()
        deployer.register_task_definition()
        deployer.update_service()
        deployer.wait_for_service_stable()
        
        public_ip = deployer.get_public_ip()
        if public_ip:
            # Update domain DNS automatically
            dns_updated = deployer.update_domain_dns(public_ip)
            print(f"✅ Update complete! Frontend available at: http://{public_ip}")
            
            if dns_updated:
                domain_name = os.getenv('DOMAIN_NAME', 'your-domain.com')
                print(f"🌐 Domain updated: http://{domain_name} (2-5 min for DNS propagation)")
        else:
            print("✅ Update complete!")
    except Exception as e:
        print(f"❌ Update failed: {e}")

def scale_service(deployer, desired_count):
    """Scale service to specified number of tasks"""
    print(f"📊 Scaling frontend service to {desired_count} tasks...")
    try:
        deployer.ecs_client.update_service(
            cluster=deployer.cluster_name,
            service=deployer.service_name,
            desiredCount=desired_count
        )
        
        if desired_count > 0:
            deployer.wait_for_service_stable()
            print(f"✅ Frontend service scaled to {desired_count} tasks")
        else:
            print("✅ Frontend service stopped (scaled to 0)")
            
    except Exception as e:
        print(f"❌ Scaling failed: {e}")

def delete_service(deployer):
    """Delete the service"""
    print("🗑️  Deleting frontend service...")
    try:
        deployer.ecs_client.update_service(
            cluster=deployer.cluster_name,
            service=deployer.service_name,
            desiredCount=0
        )
        
        print("Waiting for tasks to stop...")
        deployer.wait_for_service_stable()
        
        deployer.ecs_client.delete_service(
            cluster=deployer.cluster_name,
            service=deployer.service_name
        )
        
        print("✅ Frontend service deleted successfully")
        
    except Exception as e:
        print(f"❌ Service deletion failed: {e}")

if __name__ == "__main__":
    main()