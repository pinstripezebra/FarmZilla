"""
Complete deployment script for FarmZilla
Sets up infrastructure and CI/CD pipelines with cost optimization
"""

import sys
import os
import argparse
from deploy_fargate import FarmZillaFargateDeployer
from deploy_frontend_fargate import FarmZillaFrontendDeployer
from setup_codepipeline import FarmZillaPipelineSetup

def main():
    parser = argparse.ArgumentParser(description='Deploy FarmZilla complete infrastructure')
    parser.add_argument('--setup-pipeline', action='store_true',
                       help='Set up CI/CD pipelines only')
    parser.add_argument('--deploy-apps', action='store_true',
                       help='Deploy applications only')
    parser.add_argument('--deploy-backend', action='store_true',
                       help='Deploy backend only')
    parser.add_argument('--deploy-frontend', action='store_true',
                       help='Deploy frontend only')
    parser.add_argument('--full-setup', action='store_true',
                       help='Deploy applications and set up CI/CD pipelines')
    parser.add_argument('--cost-report', action='store_true',
                       help='Show cost optimization report')
    
    args = parser.parse_args()
    
    if args.cost_report:
        show_cost_report()
    elif args.setup_pipeline:
        setup_pipelines()
    elif args.deploy_apps:
        deploy_applications()
    elif args.deploy_backend:
        deploy_backend()
    elif args.deploy_frontend:
        deploy_frontend()
    elif args.full_setup or not any(vars(args).values()):
        deploy_applications()
        setup_pipelines()
    else:
        parser.print_help()

def deploy_backend():
    """Deploy backend application only"""
    print("📦 Deploying Backend Application...")
    try:
        backend_deployer = FarmZillaFargateDeployer()
        backend_deployer.deploy()
        print("✅ Backend deployment complete!")
    except Exception as e:
        print(f"❌ Backend deployment failed: {e}")
        raise

def deploy_frontend():
    """Deploy frontend application only"""
    print("🌐 Deploying Frontend Application...")
    try:
        frontend_deployer = FarmZillaFrontendDeployer()
        frontend_deployer.deploy()
        print("✅ Frontend deployment complete!")
    except Exception as e:
        print(f"❌ Frontend deployment failed: {e}")
        raise

def deploy_applications():
    """Deploy both backend and frontend applications"""
    print("🚀 Deploying FarmZilla Applications...")
    print("=" * 60)
    
    try:
        # Deploy backend first
        deploy_backend()
        
        # Deploy frontend
        deploy_frontend()
        
        print("\n" + "=" * 60)
        print("🎉 ALL APPLICATIONS DEPLOYED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Application deployment failed: {e}")
        raise

def setup_pipelines():
    """Set up CI/CD pipelines"""
    print("🔧 Setting up CI/CD Pipelines...")
    print("=" * 60)
    
    try:
        pipeline_setup = FarmZillaPipelineSetup()
        pipeline_setup.setup_all_pipelines()
        
        print("\n✅ CI/CD pipelines set up successfully!")
        
    except Exception as e:
        print(f"❌ Pipeline setup failed: {e}")
        raise

def show_cost_report():
    """Show cost optimization report"""
    print("💰 FarmZilla AWS Cost Optimization Report")
    print("=" * 60)
    
    print("\n🏗️ Infrastructure Costs:")
    print("• Backend Fargate: 512 CPU, 1024 MB Memory (~$12-15/month)")
    print("• Frontend Fargate: 256 CPU, 512 MB Memory (~$6-8/month)")
    print("• ECR Repositories: ~$0.10/GB/month")
    print("• CloudWatch Logs: ~$0.50/GB ingested")
    print("• S3 Artifacts: ~$0.023/GB/month (with lifecycle)")
    
    print("\n🔄 CI/CD Costs:")
    print("• CodePipeline: $1/active pipeline/month")
    print("• CodeBuild: $0.005/build minute (small instance)")
    print("• Typical build time: 3-5 minutes per deployment")
    
    print("\n💡 Cost Optimizations Implemented:")
    print("• Smallest Fargate configurations for low traffic")
    print("• S3 lifecycle policies to clean old artifacts")
    print("• Small CodeBuild instances")
    print("• Minimal IAM permissions")
    print("• ECR image scanning on push only")
    print("• Log retention policies")
    
    print("\n📊 Estimated Monthly Cost:")
    print("• Total Infrastructure: $20-25/month")
    print("• CI/CD Operations: $3-5/month")
    print("• Grand Total: ~$25-30/month")
    
    print("\n⚡ Scaling Options:")
    print("• Use SPOT pricing for Fargate (70% cost reduction)")
    print("• Scale to zero during non-business hours")
    print("• Use CloudWatch alarms for auto-scaling")
    
    print("=" * 60)

if __name__ == "__main__":
    # Check if running in correct directory
    if not os.path.exists('deploy_fargate.py'):
        print("❌ Please run this script from the back_end/src directory")
        sys.exit(1)
    
    main()