"""
Quick deployment script for FarmZilla FastAPI to AWS Fargate
"""

import sys
import os
from deploy_fargate import FarmZillaFargateDeployer
import argparse

def main():
    parser = argparse.ArgumentParser(description='Deploy FarmZilla application to AWS Fargate')
    parser.add_argument('--update-only', action='store_true', 
                       help='Only update existing service with new task definition')
    parser.add_argument('--scale', type=int, 
                       help='Scale service to specified number of tasks')
    parser.add_argument('--stop', action='store_true',
                       help='Stop the service (scale to 0)')
    parser.add_argument('--delete', action='store_true',
                       help='Delete the service')
    
    args = parser.parse_args()
    
    deployer = FarmZillaFargateDeployer()
    
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
    print("🔄 Updating service with latest task definition...")
    try:
        deployer.register_task_definition()
        deployer.update_service()
        deployer.wait_for_service_stable()
        
        public_ip = deployer.get_public_ip()
        if public_ip:
            print(f"✅ Update complete! App available at: http://{public_ip}:{deployer.container_port}/")
        else:
            print("✅ Update complete!")
    except Exception as e:
        print(f"❌ Update failed: {e}")

def scale_service(deployer, desired_count):
    """Scale service to specified number of tasks"""
    print(f"📊 Scaling service to {desired_count} tasks...")
    try:
        deployer.ecs_client.update_service(
            cluster=deployer.cluster_name,
            service=deployer.service_name,
            desiredCount=desired_count
        )
        
        if desired_count > 0:
            deployer.wait_for_service_stable()
            print(f"✅ Service scaled to {desired_count} tasks")
        else:
            print("✅ Service stopped (scaled to 0)")
            
    except Exception as e:
        print(f"❌ Scaling failed: {e}")

def delete_service(deployer):
    """Delete the service"""
    print("🗑️  Deleting service...")
    try:
        # Scale to 0 first
        deployer.ecs_client.update_service(
            cluster=deployer.cluster_name,
            service=deployer.service_name,
            desiredCount=0
        )
        
        # Wait for tasks to stop
        print("Waiting for tasks to stop...")
        deployer.wait_for_service_stable()
        
        # Delete service
        deployer.ecs_client.delete_service(
            cluster=deployer.cluster_name,
            service=deployer.service_name
        )
        
        print("✅ Service deleted successfully")
        
    except Exception as e:
        print(f"❌ Service deletion failed: {e}")

if __name__ == "__main__":
    main()