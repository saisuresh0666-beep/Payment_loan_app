#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/Payment_loan_app}"
EC2_PUBLIC_IP="${EC2_PUBLIC_IP:-54.206.94.142}"

sudo apt update
sudo apt install -y nginx curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

if [ ! -d "$APP_DIR/.git" ]; then
  git clone https://github.com/saisuresh0666-beep/Payment_loan_app.git "$APP_DIR"
fi

cd "$APP_DIR/backend"
npm ci
[ -f .env ] || cp .env.example .env

if ! grep -q "^PORT=" .env; then
  printf "\nPORT=5000\n" >> .env
fi

if ! grep -q "^DB_FILE=" .env; then
  printf "DB_FILE=./data/payment_app.db\n" >> .env
fi

cd "$APP_DIR/frontend"
npm ci
npm run build

sudo cp "$APP_DIR/deploy/loan-app.service" /etc/systemd/system/loan-app.service
sudo cp "$APP_DIR/deploy/nginx-loan-app.conf" /etc/nginx/sites-available/loan-app
sudo sed -i "s/54.206.94.142/${EC2_PUBLIC_IP}/g" /etc/nginx/sites-available/loan-app

if [ ! -L /etc/nginx/sites-enabled/loan-app ]; then
  sudo ln -s /etc/nginx/sites-available/loan-app /etc/nginx/sites-enabled/loan-app
fi

sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable loan-app
sudo systemctl restart loan-app
sudo systemctl enable nginx
sudo systemctl restart nginx

curl -f http://127.0.0.1:5000/health
echo "Deployment complete: http://${EC2_PUBLIC_IP}"
