#!/bin/bash
set -e

BUCKET="sarfrance-website"
REGION="us-west-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== Building Hugo site ==="
hugo --source . --gc --cleanDestinationDir

echo "=== Creating S3 bucket (if needed) ==="
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || echo "Bucket already exists"

echo "=== Creating CloudFront OAC ==="
OAC_ID=$(aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='$BUCKET-oac'].Id" --output text 2>/dev/null)
if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "None" ]; then
  OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config '{
    "Name": "'"$BUCKET"'-oac",
    "Description": "OAC for sarfrance website",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }' --query 'OriginAccessControl.Id' --output text)
  echo "Created OAC: $OAC_ID"
else
  echo "OAC already exists: $OAC_ID"
fi

echo "=== Creating CloudFront distribution ==="
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$BUCKET.s3.$REGION.amazonaws.com'].Id" --output text 2>/dev/null)
if [ -z "$DIST_ID" ] || [ "$DIST_ID" = "None" ]; then
  CALLER_REF="sarfrance-$(date +%s)"
  DIST_ID=$(aws cloudfront create-distribution --distribution-config '{
    "CallerReference": "'"$CALLER_REF"'",
    "Comment": "SAR France website",
    "DefaultCacheBehavior": {
      "TargetOriginId": "'"$BUCKET"'-s3",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "Compress": true
    },
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "'"$BUCKET"'-s3",
        "DomainName": "'"$BUCKET"'.s3.'"$REGION"'.amazonaws.com",
        "OriginAccessControlId": "'"$OAC_ID"'",
        "S3OriginConfig": {"OriginAccessIdentity": ""}
      }]
    },
    "Enabled": true,
    "DefaultRootObject": "index.html",
    "CustomErrorResponses": {
      "Quantity": 1,
      "Items": [{
        "ErrorCode": 404,
        "ResponsePagePath": "/404.html",
        "ResponseCode": "404",
        "ErrorCachingMinTTL": 60
      }]
    },
    "PriceClass": "PriceClass_100"
  }' --query 'Distribution.Id' --output text)
  echo "Created distribution: $DIST_ID"
else
  echo "Distribution already exists: $DIST_ID"
fi

echo "=== Setting S3 bucket policy for CloudFront ==="
aws s3api put-bucket-policy --bucket "$BUCKET" --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipal",
    "Effect": "Allow",
    "Principal": {"Service": "cloudfront.amazonaws.com"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::'"$BUCKET"'/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::'"$ACCOUNT_ID"':distribution/'"$DIST_ID"'"
      }
    }
  }]
}'

echo "=== Syncing public/ to S3 ==="
aws s3 sync public/ "s3://$BUCKET" --delete

DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)
echo ""
echo "=== Deployed ==="
echo "CloudFront URL: https://$DOMAIN"
echo "Distribution ID: $DIST_ID"
echo "(It may take a few minutes for CloudFront to fully deploy)"
