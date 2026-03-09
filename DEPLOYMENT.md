# EC2 Deployment

This project runs on one Ubuntu EC2 instance with:

- React frontend built to static files
- Express backend serving API plus frontend
- SQLite database file stored on the EC2 instance
- Nginx reverse proxy on port 80
- GitHub Actions CI/CD deploying to EC2 over SSH

## 1. Launch EC2

Use Ubuntu 24.04 or 22.04.

Allow these inbound ports in the EC2 security group:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS if you add SSL later

## 2. Connect and install packages

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
sudo apt update
sudo apt install -y nginx curl git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

You should see Node.js 22.x.

## 3. Clone the repo

```bash
cd /home/ubuntu
git clone https://github.com/saisuresh0666-beep/Payment_loan_app.git
cd /home/ubuntu/Payment_loan_app
```

## 4. Install dependencies and build

```bash
cd /home/ubuntu/Payment_loan_app/backend
npm ci
cp .env.example .env

cd /home/ubuntu/Payment_loan_app/frontend
npm ci
npm run build
```

## 5. Configure backend env

Edit the backend environment file:

```bash
nano /home/ubuntu/Payment_loan_app/backend/.env
```

Use:

```env
PORT=5000
DB_FILE=./data/payment_app.db
```

## 6. Start once and verify

```bash
cd /home/ubuntu/Payment_loan_app/backend
node server.js
```

Open a second SSH terminal and test:

```bash
curl http://127.0.0.1:5000/health
```

You should get:

```json
{"status":"ok"}
```

Press `Ctrl+C` in the first terminal after that check.

## 7. Create systemd service

```bash
sudo nano /etc/systemd/system/loan-app.service
```

Paste:

```ini
[Unit]
Description=Loan App Node Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Payment_loan_app/backend
EnvironmentFile=/home/ubuntu/Payment_loan_app/backend/.env
ExecStart=/usr/bin/node /home/ubuntu/Payment_loan_app/backend/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable loan-app
sudo systemctl start loan-app
sudo systemctl status loan-app
```

## 8. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/loan-app
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/loan-app /etc/nginx/sites-enabled/loan-app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Open app in browser

Visit:

```text
http://your-ec2-public-ip
```

## 10. GitHub Actions secrets

Add these repository secrets in GitHub:

- `EC2_HOST` = your EC2 public IP or DNS
- `EC2_USER` = `ubuntu`
- `EC2_SSH_KEY` = full private key content from your `.pem` file
- `EC2_PORT` = `22`

## 11. CI/CD behavior

The workflow file is `.github/workflows/ci-cd.yml`.

On every push to `main` or `master`, GitHub Actions will:

1. Install backend dependencies
2. Verify backend syntax
3. Install frontend dependencies
4. Build the frontend
5. SSH into EC2
6. Run `git pull`
7. Run `npm ci` in backend and frontend
8. Rebuild the frontend
9. Restart the `loan-app` systemd service

## 12. Useful EC2 commands

Check app status:

```bash
sudo systemctl status loan-app
```

Restart app:

```bash
sudo systemctl restart loan-app
```

Check logs:

```bash
journalctl -u loan-app -n 100 --no-pager
```

Check Nginx:

```bash
sudo systemctl status nginx
sudo nginx -t
```

Manual deploy after git push:

```bash
cd /home/ubuntu/Payment_loan_app
bash scripts/deploy.sh
```
