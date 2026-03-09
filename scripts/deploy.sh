#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/Payment_loan_app}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"
git pull origin "$BRANCH"

cd backend
npm ci
[ -f .env ] || cp .env.example .env

cd ../frontend
npm ci
npm run build

sudo systemctl restart loan-app
sudo systemctl reload nginx

curl -f http://127.0.0.1:5000/health
