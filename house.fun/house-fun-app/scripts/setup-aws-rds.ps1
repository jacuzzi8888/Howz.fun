# AWS RDS PostgreSQL Setup Script for house.fun (PowerShell)
# Run this after configuring AWS CLI with: aws configure

$DB_INSTANCE_IDENTIFIER = "house-fun-db"
$DB_NAME = "housefun"
$DB_USERNAME = "postgres"
$DB_PASSWORD = "YourStrongPassword123!"  # Change this!
$AWS_REGION = "us-east-1"  # Change to your preferred region

# Get your current IP
$MY_IP = (Invoke-WebRequest -Uri "https://checkip.amazonaws.com" -UseBasicParsing).Content.Trim()

Write-Host "Creating RDS PostgreSQL instance..."
Write-Host "Your IP: $MY_IP"

# Create security group
$SECURITY_GROUP_ID = aws ec2 create-security-group `
    --group-name house-fun-db-sg `
    --description "Security group for house.fun database" `
    --query 'GroupId' `
    --output text

# Allow PostgreSQL access from your IP
aws ec2 authorize-security-group-ingress `
    --group-id $SECURITY_GROUP_ID `
    --protocol tcp `
    --port 5432 `
    --cidr "$MY_IP/32"

Write-Host "Security group created: $SECURITY_GROUP_ID"

# Create RDS instance
aws rds create-db-instance `
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER `
    --db-instance-class db.t3.micro `
    --engine postgres `
    --master-username $DB_USERNAME `
    --master-user-password $DB_PASSWORD `
    --allocated-storage 20 `
    --vpc-security-group-ids $SECURITY_GROUP_ID `
    --publicly-accessible `
    --database-name $DB_NAME `
    --region $AWS_REGION

Write-Host ""
Write-Host "RDS instance is being created..."
Write-Host "This will take 5-10 minutes."
Write-Host ""
Write-Host "Check status with: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_IDENTIFIER"
Write-Host ""
Write-Host "Once available, your connection string will be:"
Write-Host "postgresql://$DB_USERNAME:$DB_PASSWORD@<endpoint>/$DB_NAME"
