# WTF LivePulse — AWS Deployment Guide

## Prerequisites
- AWS CLI installed and configured (`aws configure`)
- Docker installed and running
- `openssl` (for generating the DB password — pre-installed on macOS)

---

## Step 1 — Configure AWS credentials (one-time)

```bash
aws configure
# AWS Access Key ID:     <your key>
# AWS Secret Access Key: <your secret>
# Default region name:   ap-south-1     ← use your preferred region
# Default output format: json
```

Verify:
```bash
aws sts get-caller-identity
```

---

## Step 2 — Provision infrastructure (one-time, ~10 min)

```bash
cd /Users/sansmac/Desktop/wtf-livepulse-sanjana
AWS_REGION=ap-south-1 bash deploy/infra.sh
```

This creates:
- VPC + subnets + internet gateway
- Security groups (ALB → ECS → RDS)
- RDS PostgreSQL 15 (t3.micro)
- ECR repositories for backend + frontend
- ECS cluster
- ALB + target groups + routing rules (`/api/*` → backend, `/` → frontend)
- IAM role for ECS tasks
- CloudWatch log groups
- Saves config to `deploy/.env.deploy`

---

## Step 3 — Build & deploy (every release)

```bash
AWS_REGION=ap-south-1 bash deploy/deploy.sh
```

This:
1. Logs in to ECR
2. Builds and pushes backend + frontend images (tagged by git SHA)
3. Registers new ECS task definitions
4. Creates or updates ECS services
5. Waits for services to stabilize

**Your app will be live at the ALB URL printed at the end.**

---

## Updating the app

Just re-run `deploy/deploy.sh` after code changes. Zero downtime — ECS performs a rolling update.

---

## Logs

```bash
# Backend logs
aws logs tail /ecs/wtf-livepulse/backend --follow --region ap-south-1

# Frontend logs
aws logs tail /ecs/wtf-livepulse/frontend --follow --region ap-south-1
```

---

## Cost estimate

| Resource | ~Monthly cost |
|---|---|
| ECS Fargate (backend 0.5 vCPU, 1 GB) | ~$15 |
| ECS Fargate (frontend 0.25 vCPU, 0.5 GB) | ~$8 |
| RDS PostgreSQL t3.micro | ~$15 |
| ALB | ~$18 |
| ECR storage | ~$1 |
| **Total** | **~$57/month** |

---

## Teardown (to stop billing)

```bash
aws ecs update-service --cluster wtf-livepulse --service wtf-livepulse-backend  --desired-count 0 --region ap-south-1
aws ecs update-service --cluster wtf-livepulse --service wtf-livepulse-frontend --desired-count 0 --region ap-south-1
aws rds stop-db-instance --db-instance-identifier wtf-livepulse-db --region ap-south-1
```
