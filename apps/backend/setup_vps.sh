#!/bin/bash

# ==============================================================================
# Hostinger KVM VPS Auto-Setup Script for Bloomora FastAPI Backend
# Target OS: Ubuntu 22.04 / 24.04 LTS
# Run this script inside the /apps/backend folder on the VPS
# ==============================================================================

# Ensure script is run with sudo privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo:"
  echo "sudo ./setup_vps.sh"
  exit 1
fi

echo "======================================================================"
echo "Starting Bloomora Backend Setup on Hostinger KVM VPS..."
echo "======================================================================"

# 1. Ask for configuration parameters
read -p "Enter your backend domain/subdomain (e.g. api.yourdomain.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    echo "Domain name is required to set up Nginx. Exiting."
    exit 1
fi

# Get the directory of the script
BACKEND_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$BACKEND_DIR")")"
USER_NAME=$(logname || echo "root")

echo "Detected paths:"
echo "  Backend directory: $BACKEND_DIR"
echo "  Project root: $PROJECT_ROOT"
echo "  Running as user: $USER_NAME"
echo "======================================================================"

# 2. Update system packages
echo "--> Updating system package lists..."
apt update && apt upgrade -y

# 3. Install required system dependencies
echo "--> Installing Git, Python3, virtualenv, Nginx, and Certbot..."
apt install -y python3-pip python3-venv python3-dev nginx git curl certbot python3-certbot-nginx

# 4. Set up Python Virtual Environment
echo "--> Setting up virtual environment in $BACKEND_DIR/venv..."
cd "$BACKEND_DIR"
python3 -m venv venv
chown -R $USER_NAME:$USER_NAME venv

# Upgrade pip and install requirements
echo "--> Installing backend dependencies from requirements.txt..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# 5. Check/Create .env file
if [ ! -f .env ]; then
    echo "--> .env file not found. Creating a template..."
    cp .env.example .env 2>/dev/null || touch .env
    echo "--> A blank or template .env file was created at $BACKEND_DIR/.env."
    echo "    Make sure to open and update this file with your production environment keys."
    chown $USER_NAME:$USER_NAME .env
fi

# 6. Create systemd service for FastAPI
echo "--> Configuring systemd service for FastAPI/Uvicorn daemon..."
SERVICE_FILE="/etc/systemd/system/bloomora-backend.service"

cat <<EOT > $SERVICE_FILE
[Unit]
Description=Bloomora FastAPI Backend Service
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
EOT

# Reload systemd, enable and start the backend service
echo "--> Enabling and starting bloomora-backend service..."
systemctl daemon-reload
systemctl enable bloomora-backend
systemctl start bloomora-backend

# Check if running
if systemctl is-active --quiet bloomora-backend; then
    echo "  [OK] bloomora-backend service is running successfully!"
else
    echo "  [ERROR] bloomora-backend service failed to start. Check logs using: journalctl -u bloomora-backend"
fi

# 7. Configure Nginx Reverse Proxy
echo "--> Configuring Nginx reverse proxy..."
NGINX_CONF="/etc/nginx/sites-available/bloomora"

cat <<EOT > $NGINX_CONF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Backend API requests
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOT

# Enable site and remove default config if it exists
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx and reload
nginx -t
if [ $? -eq 0 ]; then
    echo "--> Reloading Nginx server..."
    systemctl reload nginx
    echo "  [OK] Nginx reload successful!"
else
    echo "  [ERROR] Nginx configuration test failed. Reverting default site status."
fi

# 8. Setup SSL / HTTPS via Let's Encrypt Certbot
echo "======================================================================"
echo "Configure HTTPS (SSL) with Let's Encrypt"
echo "======================================================================"
echo "Note: To set up SSL successfully, your domain ($DOMAIN_NAME)"
echo "must already be pointed to this VPS IP address."
read -p "Would you like to run Certbot to configure SSL now? (y/n): " RUN_CERTBOT

if [[ "$RUN_CERTBOT" =~ ^[Yy]$ ]]; then
    echo "--> Running Certbot for domain $DOMAIN_NAME..."
    certbot --nginx -d $DOMAIN_NAME --agree-tos --no-eff-email -m email@example.com --redirect
    if [ $? -eq 0 ]; then
        echo "  [OK] SSL certificate configured successfully!"
    else
        echo "  [ERROR] Certbot configuration failed. Please verify DNS propagation."
    fi
else
    echo "Skipping SSL setup. You can run it manually later using:"
    echo "sudo certbot --nginx -d $DOMAIN_NAME"
fi

echo "======================================================================"
echo "Setup Complete!"
echo "Please make sure to:"
echo "1. Verify and fill in the values in: $BACKEND_DIR/.env"
echo "2. Restart the backend service after editing .env: sudo systemctl restart bloomora-backend"
echo "======================================================================"
