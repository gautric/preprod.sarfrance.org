#!/bin/bash

# Deployment script for CloudFormation stack

set -e

STACK_NAME="${1:-website-stack}"
DOMAIN_NAME="${2:-example.com}"
CERTIFICATE_ARN="${3:-}"
REGION="${4:-us-east-1}"

echo "Deploying CloudFormation stack..."
echo "Stack Name: $STACK_NAME"
echo "Domain: $DOMAIN_NAME"
echo "Region: $REGION"

# Deploy the stack
aws cloudformation deploy \
  --template-file cloudformation-stack.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides \
    DomainName="$DOMAIN_NAME" \
    CertificateArn="$CERTIFICATE_ARN" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION"

echo "Stack deployed successfully!"

# Get outputs
echo ""
echo "Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
