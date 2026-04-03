#!/usr/bin/env bash
# =============================================================================
# WTF LivePulse — AWS Infrastructure Setup (run ONCE)
# Usage: ./deploy/infra.sh
# =============================================================================
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
APP="wtf-livepulse"
REGION="${AWS_REGION:-us-east-1}"
DB_USER="wtf"
DB_NAME="wtf_livepulse"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"

echo "════════════════════════════════════════"
echo "  WTF LivePulse — Infrastructure Setup"
echo "  Region: $REGION"
echo "════════════════════════════════════════"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: $ACCOUNT_ID"

# ── 1. ECR Repositories ───────────────────────────────────────────────────────
echo ""
echo "[1/9] Creating ECR repositories..."
for svc in backend frontend; do
  aws ecr describe-repositories --repository-names "$APP/$svc" --region "$REGION" &>/dev/null \
    || aws ecr create-repository \
        --repository-name "$APP/$svc" \
        --region "$REGION" \
        --image-scanning-configuration scanOnPush=true \
        --output text --query 'repository.repositoryUri'
  echo "  ✓ ECR: $APP/$svc"
done

# ── 2. VPC + Subnets ──────────────────────────────────────────────────────────
echo ""
echo "[2/9] Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=$APP}]" \
    --region "$REGION" \
    --query 'Vpc.VpcId' --output text)
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id "$VPC_ID" --enable-dns-support
echo "  ✓ VPC: $VPC_ID"

# Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=$APP}]" \
    --region "$REGION" \
    --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id "$VPC_ID" --internet-gateway-id "$IGW_ID"
echo "  ✓ IGW: $IGW_ID"

# Public subnets (AZ a + b)
AZ_A="${REGION}a"
AZ_B="${REGION}b"

PUB_SUBNET_A=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 10.0.1.0/24 \
    --availability-zone "$AZ_A" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$APP-public-a}]" \
    --region "$REGION" \
    --query 'Subnet.SubnetId' --output text)

PUB_SUBNET_B=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 10.0.2.0/24 \
    --availability-zone "$AZ_B" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$APP-public-b}]" \
    --region "$REGION" \
    --query 'Subnet.SubnetId' --output text)

# Private subnets (for RDS)
PRIV_SUBNET_A=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 10.0.10.0/24 \
    --availability-zone "$AZ_A" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$APP-private-a}]" \
    --region "$REGION" \
    --query 'Subnet.SubnetId' --output text)

PRIV_SUBNET_B=$(aws ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 10.0.11.0/24 \
    --availability-zone "$AZ_B" \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=$APP-private-b}]" \
    --region "$REGION" \
    --query 'Subnet.SubnetId' --output text)

echo "  ✓ Public subnets: $PUB_SUBNET_A, $PUB_SUBNET_B"
echo "  ✓ Private subnets: $PRIV_SUBNET_A, $PRIV_SUBNET_B"

# Route table for public subnets
RTB=$(aws ec2 create-route-table \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id "$RTB" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW_ID"
for subnet in $PUB_SUBNET_A $PUB_SUBNET_B; do
  aws ec2 associate-route-table --route-table-id "$RTB" --subnet-id "$subnet"
  aws ec2 modify-subnet-attribute --subnet-id "$subnet" --map-public-ip-on-launch
done

# ── 3. Security Groups ────────────────────────────────────────────────────────
echo ""
echo "[3/9] Creating security groups..."

# ALB SG — open 80 + 443 from internet
ALB_SG=$(aws ec2 create-security-group \
    --group-name "$APP-alb-sg" \
    --description "ALB security group" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG" --protocol tcp --port 443 --cidr 0.0.0.0/0
echo "  ✓ ALB SG: $ALB_SG"

# ECS SG — allow traffic from ALB only
ECS_SG=$(aws ec2 create-security-group \
    --group-name "$APP-ecs-sg" \
    --description "ECS tasks security group" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "$ECS_SG" --protocol tcp --port 80   --source-group "$ALB_SG"
aws ec2 authorize-security-group-ingress --group-id "$ECS_SG" --protocol tcp --port 3001 --source-group "$ALB_SG"
echo "  ✓ ECS SG: $ECS_SG"

# RDS SG — allow from ECS only
RDS_SG=$(aws ec2 create-security-group \
    --group-name "$APP-rds-sg" \
    --description "RDS security group" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --group-id "$RDS_SG" --protocol tcp --port 5432 --source-group "$ECS_SG"
echo "  ✓ RDS SG: $RDS_SG"

# ── 4. Secrets Manager ────────────────────────────────────────────────────────
echo ""
echo "[4/9] Storing secrets..."
aws secretsmanager create-secret \
    --name "$APP/db-password" \
    --description "WTF LivePulse DB password" \
    --secret-string "$DB_PASSWORD" \
    --region "$REGION" &>/dev/null || \
  aws secretsmanager put-secret-value \
    --secret-id "$APP/db-password" \
    --secret-string "$DB_PASSWORD" \
    --region "$REGION"
echo "  ✓ Secret stored: $APP/db-password"

# ── 5. RDS PostgreSQL ─────────────────────────────────────────────────────────
echo ""
echo "[5/9] Creating RDS subnet group + PostgreSQL instance (this takes ~5 min)..."

aws rds create-db-subnet-group \
    --db-subnet-group-name "$APP-db-subnet-group" \
    --db-subnet-group-description "WTF LivePulse DB subnet group" \
    --subnet-ids "$PRIV_SUBNET_A" "$PRIV_SUBNET_B" \
    --region "$REGION" &>/dev/null || true

RDS_ID="$APP-db"
aws rds create-db-instance \
    --db-instance-identifier "$RDS_ID" \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version "15" \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASSWORD" \
    --db-name "$DB_NAME" \
    --vpc-security-group-ids "$RDS_SG" \
    --db-subnet-group-name "$APP-db-subnet-group" \
    --no-publicly-accessible \
    --allocated-storage 20 \
    --storage-type gp2 \
    --backup-retention-period 7 \
    --region "$REGION" \
    --no-multi-az \
    --deletion-protection \
    --tags "Key=App,Value=$APP" \
    --output text --query 'DBInstance.DBInstanceStatus'

echo "  ✓ RDS creating (identifier: $RDS_ID)..."
echo "    Waiting for RDS to be available (may take 5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier "$RDS_ID" --region "$REGION"

RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_ID" \
    --region "$REGION" \
    --query 'DBInstances[0].Endpoint.Address' --output text)
echo "  ✓ RDS endpoint: $RDS_ENDPOINT"

DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$RDS_ENDPOINT:5432/$DB_NAME"
aws secretsmanager put-secret-value \
    --secret-id "$APP/db-password" \
    --secret-string "$DATABASE_URL" \
    --region "$REGION"

# ── 6. ECS Cluster ────────────────────────────────────────────────────────────
echo ""
echo "[6/9] Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name "$APP" \
    --capacity-providers FARGATE FARGATE_SPOT \
    --region "$REGION" &>/dev/null || true
echo "  ✓ ECS cluster: $APP"

# ── 7. IAM Role for ECS tasks ─────────────────────────────────────────────────
echo ""
echo "[7/9] Creating ECS task execution role..."
TRUST_POLICY='{
  "Version":"2012-10-17",
  "Statement":[{
    "Effect":"Allow",
    "Principal":{"Service":"ecs-tasks.amazonaws.com"},
    "Action":"sts:AssumeRole"
  }]
}'
ROLE_ARN=$(aws iam create-role \
    --role-name "$APP-ecs-task-role" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --query 'Role.Arn' --output text 2>/dev/null || \
  aws iam get-role --role-name "$APP-ecs-task-role" --query 'Role.Arn' --output text)
aws iam attach-role-policy \
    --role-name "$APP-ecs-task-role" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy || true
aws iam attach-role-policy \
    --role-name "$APP-ecs-task-role" \
    --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite || true
echo "  ✓ IAM role: $ROLE_ARN"

# ── 8. CloudWatch Log Groups ──────────────────────────────────────────────────
echo ""
echo "[8/9] Creating CloudWatch log groups..."
aws logs create-log-group --log-group-name "/ecs/$APP/backend"  --region "$REGION" 2>/dev/null || true
aws logs create-log-group --log-group-name "/ecs/$APP/frontend" --region "$REGION" 2>/dev/null || true
echo "  ✓ Log groups created"

# ── 9. ALB ────────────────────────────────────────────────────────────────────
echo ""
echo "[9/9] Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "$APP-alb" \
    --subnets "$PUB_SUBNET_A" "$PUB_SUBNET_B" \
    --security-groups "$ALB_SG" \
    --scheme internet-facing \
    --type application \
    --region "$REGION" \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns "$ALB_ARN" \
    --region "$REGION" \
    --query 'LoadBalancers[0].DNSName' --output text)
echo "  ✓ ALB DNS: $ALB_DNS"

# Target group — frontend (port 80)
TG_FRONTEND=$(aws elbv2 create-target-group \
    --name "$APP-frontend-tg" \
    --protocol HTTP --port 80 \
    --vpc-id "$VPC_ID" \
    --target-type ip \
    --health-check-path "/" \
    --health-check-interval-seconds 30 \
    --region "$REGION" \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

# Target group — backend (port 3001)
TG_BACKEND=$(aws elbv2 create-target-group \
    --name "$APP-backend-tg" \
    --protocol HTTP --port 3001 \
    --vpc-id "$VPC_ID" \
    --target-type ip \
    --health-check-path "/health" \
    --health-check-interval-seconds 30 \
    --region "$REGION" \
    --query 'TargetGroups[0].TargetGroupArn' --output text)
echo "  ✓ Target groups created"

# Listener — port 80, default → frontend; /api/* → backend
LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTP --port 80 \
    --default-actions "Type=forward,TargetGroupArn=$TG_FRONTEND" \
    --region "$REGION" \
    --query 'Listeners[0].ListenerArn' --output text)

# Route /api/* to backend
aws elbv2 create-rule \
    --listener-arn "$LISTENER_ARN" \
    --priority 10 \
    --conditions 'Field=path-pattern,Values=["/api/*"]' \
    --actions "Type=forward,TargetGroupArn=$TG_BACKEND" \
    --region "$REGION" &>/dev/null
echo "  ✓ ALB listener + routing rules created"

# ── Save config for deploy.sh ─────────────────────────────────────────────────
cat > "$(dirname "$0")/.env.deploy" <<EOF
ACCOUNT_ID=$ACCOUNT_ID
REGION=$REGION
APP=$APP
VPC_ID=$VPC_ID
PUB_SUBNET_A=$PUB_SUBNET_A
PUB_SUBNET_B=$PUB_SUBNET_B
ECS_SG=$ECS_SG
ALB_ARN=$ALB_ARN
ALB_DNS=$ALB_DNS
TG_FRONTEND=$TG_FRONTEND
TG_BACKEND=$TG_BACKEND
ROLE_ARN=$ROLE_ARN
RDS_ENDPOINT=$RDS_ENDPOINT
DATABASE_URL_SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$APP/db-password" --region "$REGION" --query 'ARN' --output text)
EOF

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Infrastructure ready!"
echo ""
echo "  ALB URL: http://$ALB_DNS"
echo ""
echo "  Next step: run ./deploy/deploy.sh"
echo "════════════════════════════════════════"
