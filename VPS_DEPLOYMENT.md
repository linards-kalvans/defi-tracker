# VPS Deployment Guide

This guide describes how to deploy the DeFi Tracker on a VPS (Virtual Private Server).

## 1. Prerequisites

*   A VPS running Linux (Ubuntu 22.04 LTS recommended).
*   Docker and Docker Compose installed on the VPS.
*   A domain name pointing to your VPS IP address (optional but recommended).

## 2. Environment Setup

Create a `.env` file in the same directory as your `docker-compose.prod.yml` file on the VPS. This file will store your sensitive configuration.

```bash
# .env
# Database URL (Example for a hosted Postgres or local one if added to compose)
DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname

# Kraken API Credentials
KRAKEN_API_KEY=your_kraken_api_key
KRAKEN_SECRET=your_kraken_secret_key

# Frontend Configuration
# Replace 'your-vps-ip' with your actual IP or domain name
NEXT_PUBLIC_API_URL=http://your-vps-ip:8000
NEXT_PUBLIC_WS_URL=ws://your-vps-ip:8000
```

## 3. Deployment

1.  **Copy Files**: Copy `docker-compose.prod.yml` and your `.env` file to the VPS.
2.  **Authenticate**: Log in to the container registry if your images are private.
    ```bash
    docker login ghcr.io
    ```
3.  **Start Services**:
    ```bash
    docker compose -f docker-compose.prod.yml up -d
    ```

## 4. Firewall & Ports

Ensure your VPS firewall allows traffic on the following ports:

*   **3000**: Frontend (HTTP)
*   **8000**: Backend API & WebSocket

If you use `ufw` (Ubuntu Firewall):
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

## 5. Updates

Watchtower is configured to automatically check for new image versions every 5 minutes and update the containers. Just push a new image to the registry, and your VPS will update automatically.

