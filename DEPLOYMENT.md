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

## 2. One-command automatic setup on EC2

```bash
ssh -i your-key.pem ubuntu@54.206.94.142
git clone https://github.com/saisuresh0666-beep/Payment_loan_app.git
cd Payment_loan_app
bash scripts/bootstrap-ec2.sh
```

That script installs Node.js 22, Nginx, clones or updates the app, installs backend and frontend dependencies, builds the frontend, installs systemd and Nginx configs, starts the services, and verifies `http://127.0.0.1:5000/health`.

If you want to override the public IP inside the generated Nginx config:

```bash
EC2_PUBLIC_IP=54.206.94.142 bash scripts/bootstrap-ec2.sh
```

## 3. Backend env

```bash
cd /home/ubuntu/Payment_loan_app/backend
nano .env
```

Use:

```env
PORT=5000
DB_FILE=./data/payment_app.db
```

## 4. Open app in browser

Visit:

```text
http://54.206.94.142
```

## 5. GitHub Actions secrets

Add these repository secrets in GitHub:

- `EC2_USER` = `ubuntu`
- `EC2_SSH_KEY` = full private key content from your `.pem` file
- `EC2_PORT` = `22`

`EC2_HOST` is already set in the workflow to `54.206.94.142`.

## 6. CI/CD behavior

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

## 7. Useful EC2 commands

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
