#!/bin/bash
# AWS RDS PostgreSQL Setup Script for house.fun
# Run this after configuring AWS CLI with: aws configure

DB_INSTANCE_IDENTIFIER="house-fun-db"
DB_NAME="housefun"
DB_USERNAME="postgres"
DB_PASSWORD="YourStrongPassword123!"  # Change this!
AWS_REGION="us-east-1"  # Change to your preferred region

# Get your current IP
MY_IP=$(curl -s https://checkip.amazonaws.com)

echo "Creating RDS PostgreSQL instance..."
echo "Your IP: $MY_IP"

# Create security group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name house-fun-db-sg \
    --description "Security group for house.fun database" \
    --query 'GroupId' \
    --output text)

# Allow PostgreSQL access from your IP
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 5432 \
    --cidr $MY_IP/32

echo "Security group created: $SECURITY_GROUP_ID"

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --vpc-security-group-ids $SECURITY_GROUP_ID \
    --publicly-accessible \
    --database-name $DB_NAME \
    --region $AWS_REGION

echo ""
echo "RDS instance is being created..."
echo "This will take 5-10 minutes."
echo ""
echo "Check status with: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_IDENTIFIER"
echo ""
echo "Once available, your connection string will be:"
echo "postgresql://$DB_USERNAME:$DB_PASSWORD@<endpoint>/$DB_NAME"
