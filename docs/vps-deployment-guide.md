# Bloomora Backend VPS Deployment Guide

This guide describes how to deploy the Bloomora Python FastAPI backend onto a Hostinger KVM VPS (running Ubuntu 22.04 or 24.04 LTS).

We have created an automation script [setup_vps.sh](file:///g:/Projects/Capstone/bloomora-official/apps/backend/setup_vps.sh) that automates the installation of packages, virtual environments, dependencies, systemd services, Nginx reverse proxy configuration, and SSL (HTTPS) setup.

---

## Prerequisites

Before starting, ensure you have:
1. **Hostinger KVM VPS Instance:** Running clean Ubuntu (version 22.04 or 24.04).
2. **Domain/Subdomain DNS Configuration:**
   * Log in to your Hostinger dashboard.
   * Go to **DNS Zone Editor** for your domain.
   * Add an **A Record** pointing to your VPS public IP Address:
     * **Type:** `A`
     * **Name:** `api` (or `@` if using root domain)
     * **Points to:** `YOUR_VPS_IP_ADDRESS`
     * **TTL:** Default (e.g., 14400)
   * *Note: Wait a few minutes for the DNS changes to propagate before running the SSL setup.*

---

## Step 1: SSH into your VPS

Open your terminal or command prompt and connect to your VPS:

```bash
ssh root@YOUR_VPS_IP_ADDRESS
```

*(Enter the root password you configured in your Hostinger Panel).*

---

## Step 2: Clone the Project Repository

From the root home directory of your VPS:

1. Clone your GitHub repository:
   ```bash
   git clone https://github.com/Gabrrpr/bloomora-official.git
   ```
2. Navigate to the backend directory:
   ```bash
   cd bloomora-official/apps/backend
   ```

---

## Step 3: Run the Auto-Setup Script

1. Make the script executable:
   ```bash
   chmod +x setup_vps.sh
   ```
2. Run the script with root/sudo privileges:
   ```bash
   sudo ./setup_vps.sh
   ```
3. The script will ask you to enter:
   * **Domain Name:** Enter your configured domain (e.g., `api.yourdomain.com`).
   * **SSL Request:** Enter `y` to request a Let's Encrypt certificate automatically.

---

## Step 4: Configure Your Environment Variables

The script creates a `.env` template file in `apps/backend/`. You must populate it with your production keys:

1. Open the `.env` file using a terminal text editor:
   ```bash
   nano .env
   ```
2. Fill in the values (especially `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `SECRET_KEY`, and API keys).
3. Save the file (press `CTRL+O` then `Enter` in nano) and exit (press `CTRL+X`).
4. **Restart the backend service** to apply the configuration:
   ```bash
   sudo systemctl restart bloomora-backend
   ```

---

## Service Management Commands

Use these commands on your VPS to manage your backend service:

| Action | Command |
| :--- | :--- |
| **Check service status** | `sudo systemctl status bloomora-backend` |
| **Restart backend** | `sudo systemctl restart bloomora-backend` |
| **Stop backend** | `sudo systemctl stop bloomora-backend` |
| **Start backend** | `sudo systemctl start bloomora-backend` |
| **View real-time application logs** | `sudo journalctl -u bloomora-backend -f` |
| **View Nginx error logs** | `sudo tail -f /var/log/nginx/error.log` |

---

## Frontend Integration

Once your backend is running at `https://api.yourdomain.com`:

1. Update the frontend environment variables in your Hostinger Client configuration:
   ```text
   VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
   VITE_WS_BASE_URL=wss://api.yourdomain.com/api/v1
   ```
2. Rebuild the frontend on Hostinger.
