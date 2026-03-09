# EC2 Deployment

This project can run on a single Ubuntu EC2 instance with:

- React frontend built into static files
- Express backend serving the API and built frontend
- MySQL on the same server
- Optional Nginx reverse proxy on port 80

## 1. Install system packages

```bash
sudo apt update
sudo apt install -y nginx mysql-server nodejs npm
node -v
npm -v
```

If your Ubuntu image has an older Node.js version, install Node.js 20 or newer before continuing.

## 2. Copy the project to the instance

Clone the repo or upload the project, then go to the project directory:

```bash
cd /home/ubuntu/loan
```

## 3. Install app dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 4. Configure MySQL

Create the database and required tables on the EC2 instance:

```sql
CREATE DATABASE payment_app_db;
```

Then import your schema/data for `customers` and `payments`.

Create the backend environment file:

```bash
cd /home/ubuntu/loan/backend
cp .env.example .env
```

Edit `.env` with your real MySQL credentials.

## 5. Build the frontend

```bash
cd /home/ubuntu/loan/frontend
npm run build
```

The Express app serves `frontend/dist`, so the frontend and backend will run from one Node process.

## 6. Run the backend

```bash
cd /home/ubuntu/loan/backend
PORT=5000 node server.js
```

Test:

```bash
curl http://127.0.0.1:5000/customers
```

## 7. Run with systemd

Create a service file:

```bash
sudo nano /etc/systemd/system/loan-app.service
```

Use this content:

```ini
[Unit]
Description=Loan App Node Server
After=network.target mysql.service

[Service]
Type=simple
WorkingDirectory=/home/ubuntu/loan/backend
EnvironmentFile=/home/ubuntu/loan/backend/.env
ExecStart=/usr/bin/node /home/ubuntu/loan/backend/server.js
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable loan-app
sudo systemctl start loan-app
sudo systemctl status loan-app
```

## 8. Configure Nginx

Create an Nginx site:

```bash
sudo nano /etc/nginx/sites-available/loan-app
```

Use this config:

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

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/loan-app /etc/nginx/sites-enabled/loan-app
sudo nginx -t
sudo systemctl restart nginx
```

## 9. Open EC2 security group ports

Allow:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS if you add SSL later

You do not need to expose `5000` publicly if Nginx is used.

## 10. Optional SSL

If you point a domain to the EC2 public IP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
