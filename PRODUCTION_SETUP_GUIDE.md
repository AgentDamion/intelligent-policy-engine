# 🚀 Production Setup Guide

## **Overview**

This guide will help you set up the AICOMPLYR.IO system for production deployment with real cloud services.

## **Prerequisites**

- Google Cloud Platform account with billing enabled
- AWS account with appropriate permissions
- Database (PostgreSQL) access
- Domain and SSL certificates

## **Step 1: Google Cloud Setup**

### **1.1 Create Google Cloud Project**

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Login and create project
gcloud auth login
gcloud projects create aicomplyr-production --name="AICOMPLYR Production"
gcloud config set project aicomplyr-production
```

### **1.2 Enable Document AI API**

```bash
# Enable required APIs
gcloud services enable documentai.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### **1.3 Create Document AI Processor**

```bash
# Create a Document AI processor
gcloud ai document-processors create \
  --location=us \
  --display-name="AICOMPLYR Document Processor" \
  --type=FORM_PARSER_PROCESSOR

# Get the processor ID
gcloud ai document-processors list --location=us
```

### **1.4 Create Service Account**

```bash
# Create service account
gcloud iam service-accounts create aicomplyr-service-account \
  --display-name="AICOMPLYR Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding aicomplyr-production \
  --member="serviceAccount:aicomplyr-service-account@aicomplyr-production.iam.gserviceaccount.com" \
  --role="roles/documentai.apiUser"

gcloud projects add-iam-policy-binding aicomplyr-production \
  --member="serviceAccount:aicomplyr-service-account@aicomplyr-production.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Create and download key
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=aicomplyr-service-account@aicomplyr-production.iam.gserviceaccount.com
```

## **Step 2: AWS Setup**

### **2.1 Create IAM User**

```bash
# Create IAM user for Textract access
aws iam create-user --user-name aicomplyr-textract-user

# Create access policy
cat > textract-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "textract:DetectDocumentText",
                "textract:AnalyzeDocument",
                "textract:StartDocumentTextDetection",
                "textract:GetDocumentTextDetection"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Attach policy to user
aws iam put-user-policy \
  --user-name aicomplyr-textract-user \
  --policy-name TextractAccessPolicy \
  --policy-document file://textract-policy.json

# Create access keys
aws iam create-access-key --user-name aicomplyr-textract-user
```

### **2.2 Create S3 Bucket (Optional)**

```bash
# Create S3 bucket for document storage
aws s3 mb s3://aicomplyr-documents-production

# Set up CORS configuration
cat > cors-config.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["https://aicomplyr.io"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors \
  --bucket aicomplyr-documents-production \
  --cors-configuration file://cors-config.json
```

## **Step 3: Environment Configuration**

### **3.1 Create Production Environment File**

```bash
# Copy example environment file
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

### **3.2 Required Environment Variables**

```bash
# Authentication
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=your-auth0-audience

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/aicomplyr_production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=aicomplyr-production
GOOGLE_CLOUD_LOCATION=us
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Production settings
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://aicomplyr.io
```

## **Step 4: Database Setup**

### **4.1 Run Database Migrations**

```bash
# Install dependencies
npm install

# Run migrations
node scripts/run-migrations.js

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

### **4.2 Set up Database Monitoring**

```bash
# Install monitoring tools
npm install --save-dev pg-monitor

# Set up connection pooling
npm install --save pg-pool
```

## **Step 5: Security Configuration**

### **5.1 SSL/TLS Setup**

```bash
# Install SSL certificates
sudo certbot --nginx -d aicomplyr.io -d www.aicomplyr.io

# Configure security headers
npm install --save helmet
```

### **5.2 Rate Limiting**

```bash
# Configure rate limiting
npm install --save express-rate-limit
```

### **5.3 Secrets Management**

```bash
# Install secrets management
npm install --save @google-cloud/secret-manager
npm install --save aws-sdk
```

## **Step 6: Monitoring Setup**

### **6.1 Application Monitoring**

```bash
# Install monitoring tools
npm install --save @google-cloud/monitoring
npm install --save @google-cloud/logging
npm install --save express-prometheus-middleware
```

### **6.2 Set up Alerts**

```bash
# Configure alerting policies
gcloud alpha monitoring policies create --policy-from-file=alert-policy.yaml
```

## **Step 7: Deployment**

### **7.1 Run Deployment Script**

```bash
# Run production deployment validation
node scripts/deploy-production.js

# If validation passes, deploy
npm run build
npm start
```

### **7.2 Verify Deployment**

```bash
# Test health endpoint
curl https://aicomplyr.io/api/enhanced-orchestrator/health

# Test document processing
curl -X POST https://aicomplyr.io/api/enhanced-document-processing/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"enterpriseId":"test","mimeType":"application/pdf","checksumSha256":"test","sizeBytes":1024}'
```

## **Step 8: Post-Deployment**

### **8.1 Set up Monitoring Dashboards**

- Configure Grafana dashboards for SLO metrics
- Set up alerting for SLO violations
- Configure log aggregation and analysis

### **8.2 Load Testing**

```bash
# Install load testing tools
npm install -g artillery

# Run load tests
artillery run load-test-config.yml
```

### **8.3 Backup Strategy**

```bash
# Set up automated backups
crontab -e

# Add backup job
0 2 * * * /usr/local/bin/pg_dump $DATABASE_URL > /backups/aicomplyr_$(date +\%Y\%m\%d).sql
```

## **Troubleshooting**

### **Common Issues**

1. **Google Cloud Authentication**
   ```bash
   # Re-authenticate
   gcloud auth application-default login
   ```

2. **AWS Credentials**
   ```bash
   # Check credentials
   aws sts get-caller-identity
   ```

3. **Database Connection**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### **Health Checks**

```bash
# Check system health
curl https://aicomplyr.io/api/enhanced-orchestrator/health

# Check SLO metrics
curl https://aicomplyr.io/api/enhanced-orchestrator/slo-metrics

# Check system stats
curl https://aicomplyr.io/api/enhanced-orchestrator/stats
```

## **Security Checklist**

- [ ] SSL/TLS certificates installed and configured
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] API keys and secrets managed securely
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented

## **Performance Checklist**

- [ ] Database connection pooling configured
- [ ] Caching enabled and configured
- [ ] CDN set up for static assets
- [ ] Load balancing configured
- [ ] Auto-scaling policies set
- [ ] Performance monitoring enabled
- [ ] SLO targets defined and monitored
- [ ] Load testing completed

---

## **🎉 Production Ready!**

Once you've completed all steps, your AICOMPLYR.IO system will be running in production with:

- ✅ Real Google Document AI integration
- ✅ Real AWS Textract integration
- ✅ Production-grade security
- ✅ Comprehensive monitoring
- ✅ Automated backups
- ✅ SLO monitoring and alerting

**Your system is now ready for production use! 🚀**