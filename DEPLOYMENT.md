# 🚀 Deploying Yaruki to AWS EC2 - Step-by-Step Guide

This guide walks you through deploying the Yaruki backend (Node.js + Express + file uploads) and frontend (Next.js) to an AWS EC2 instance.

---

## Part 1: Launch an EC2 Instance

### Step 1: Create an EC2 Instance
1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Go to **EC2 → Launch Instance**
3. Configure:
   - **Name**: `yaruki-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free Tier)
   - **Instance type**: `t2.micro` (Free Tier) or `t2.small` for better performance
   - **Key pair**: Create a new key pair (download the `.pem` file — keep it safe!)
   - **Security Group**: Create with these rules:

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom TCP | 5000 | 0.0.0.0/0 |
| Custom TCP | 3000 | 0.0.0.0/0 |

4. **Storage**: 20 GB gp3
5. Click **Launch Instance**

### Step 2: Connect to Your Instance

```bash
# Make your key file secure
chmod 400 yaruki-key.pem

# Connect via SSH
ssh -i yaruki-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

## Part 2: Server Setup

### Step 3: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v    # Should show v20.x
npm -v     # Should show 10.x

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 4: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In the PostgreSQL prompt, run:
CREATE USER yaruki_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE yaruki OWNER yaruki_user;
GRANT ALL PRIVILEGES ON DATABASE yaruki TO yaruki_user;
\q
```

### Step 5: Upload Your Code

**Option A: Using Git (Recommended)**
```bash
cd /home/ubuntu
git clone <YOUR_REPO_URL> yaruki
```

**Option B: Using SCP (from your local machine)**
```bash
# Run this from your LOCAL machine
scp -i yaruki-key.pem -r ./backend ubuntu@<YOUR_EC2_PUBLIC_IP>:/home/ubuntu/yaruki/backend
scp -i yaruki-key.pem -r ./frontend ubuntu@<YOUR_EC2_PUBLIC_IP>:/home/ubuntu/yaruki/frontend
```

---

## Part 3: Deploy the Backend

### Step 6: Configure Backend

```bash
cd /home/ubuntu/yaruki/backend

# Install dependencies
npm install --production

# Create environment file
nano .env
```

Add this to `.env`:
```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=yaruki
DB_USER=yaruki_user
DB_PASSWORD=your_secure_password_here

JWT_SECRET=generate_a_very_long_random_string_here

UPLOAD_DIR=./uploads
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 7: Setup Database Tables & Seed Data

```bash
cd /home/ubuntu/yaruki/backend

# Create tables
npm run db:setup

# Seed test data
npm run db:seed
```

### Step 8: Create Upload Directory

```bash
mkdir -p /home/ubuntu/yaruki/backend/uploads
chmod 755 /home/ubuntu/yaruki/backend/uploads
```

### Step 9: Start Backend with PM2

```bash
cd /home/ubuntu/yaruki/backend

# Start the app
pm2 start src/server.js --name yaruki-api

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup
# Run the command it outputs (starts with sudo)

# Check status
pm2 status
pm2 logs yaruki-api
```

### Step 10: Test Backend

```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","message":"Yaruki API is running 🎌"}
```

---

## Part 4: Deploy the Frontend

### Step 11: Configure & Build Frontend

```bash
cd /home/ubuntu/yaruki/frontend

# Install dependencies
npm install

# Create environment file
nano .env.local
```

Add this to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://<YOUR_EC2_PUBLIC_IP>/api
```

> **Note**: Replace `<YOUR_EC2_PUBLIC_IP>` with your actual EC2 public IP. If you set up a domain later, use `https://yourdomain.com/api`.

```bash
# Build the production app
npm run build

# Start with PM2
pm2 start npm --name yaruki-frontend -- start

pm2 save
```

---

## Part 5: Configure Nginx Reverse Proxy

### Step 12: Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/yaruki
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # File upload size limit (10MB)
        client_max_body_size 10M;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}
```

Enable the site:

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable yaruki
sudo ln -s /etc/nginx/sites-available/yaruki /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Part 6: SSL with Let's Encrypt (Optional but Recommended)

If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

After SSL, update your frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

Then rebuild: `cd /home/ubuntu/yaruki/frontend && npm run build && pm2 restart yaruki-frontend`

---

## Part 7: Maintenance Commands

```bash
# Check running processes
pm2 status

# View logs
pm2 logs yaruki-api
pm2 logs yaruki-frontend

# Restart services
pm2 restart yaruki-api
pm2 restart yaruki-frontend

# Update code (if using Git)
cd /home/ubuntu/yaruki
git pull
cd backend && npm install && pm2 restart yaruki-api
cd ../frontend && npm install && npm run build && pm2 restart yaruki-frontend

# Database backup
pg_dump -U yaruki_user yaruki > backup_$(date +%Y%m%d).sql

# Check disk space (important for uploads!)
df -h

# Check nginx status
sudo systemctl status nginx
```

---

## 📋 Deployment Checklist

- [ ] EC2 instance launched with correct security groups
- [ ] SSH access working
- [ ] Node.js, PostgreSQL, Nginx, PM2 installed
- [ ] PostgreSQL database and user created
- [ ] Code uploaded to server
- [ ] Backend `.env` configured with production values
- [ ] Database tables created and seeded
- [ ] Upload directory created with correct permissions
- [ ] Backend running via PM2 and health check passes
- [ ] Frontend `.env.local` configured with correct API URL
- [ ] Frontend built and running via PM2
- [ ] Nginx configured as reverse proxy
- [ ] Site accessible via browser at EC2 public IP
- [ ] (Optional) Domain configured with SSL

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to site | Check security group allows port 80 |
| 502 Bad Gateway | Check PM2 processes are running: `pm2 status` |
| File upload fails | Check `client_max_body_size` in nginx, check `uploads/` permissions |
| Database connection error | Verify `.env` credentials match PostgreSQL user |
| CORS errors | Update `cors origin` in `backend/src/server.js` to your domain |
| PM2 not restarting on reboot | Run `pm2 startup` and execute the printed command |

---

**Your Yaruki platform is now live! 🎌 がんばって！**
