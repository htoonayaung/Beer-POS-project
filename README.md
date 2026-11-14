# Beer POS Project

Myanmar beer shop, bar, and restaurant POS system with inventory management.

## Architecture & Project Structure
- `frontend` — React, TypeScript, TailwindCSS responsive POS application (Port `3000` internal)
- `backend/beer-pos-api` — Express, Prisma ORM, SQLite enterprise API (Port `8080` internal)
- `nginx.docker.conf` — Reverse proxy routing `/` to frontend and `/api/` to backend
- `docker-compose.yml` — Multi-container orchestration with persistent SQLite volume
- `database/beer_pos_schema.sql` — Legacy/reference SQL schema
- `deploy/linux` — Sample bare-metal systemd service and Nginx configs

## Default Login Accounts
- **Admin:** username `admin`, PIN `1111`
- **Cashier:** username `cashier`, PIN `3333`

> **Security Warning:** Change `JWT_SECRET` and all default credentials before deploying to a live production environment.

---

## Method 1: Docker Compose Deployment (Recommended)

### Step 1: Check Prerequisites
Ensure `git`, `docker`, and `docker compose` are installed on your Linux server:

    git --version && docker --version && docker compose version

### Step 2: Clone the Repository

    mkdir -p ~/Projects && cd ~/Projects
    git clone https://github.com/htoonayaung/Beer-POS-project.git
    cd Beer-POS-project

### Step 3: Build and Start Containers

    sudo docker compose up -d --build

### Step 4: Verify Deployment

    sudo docker compose ps
    sudo docker logs beer-pos-backend
    curl -I http://localhost:8080

Open your browser and access: **`http://<SERVER_IP>:8080`**

### Step 5: Daily Operations & Maintenance
| Action | Command |
| :--- | :--- |
| **Stop services (keep data)** | `sudo docker compose down` |
| **Start services** | `sudo docker compose up -d` |
| **Rebuild after code changes** | `sudo docker compose up -d --build` |
| **View live backend logs** | `sudo docker logs -f beer-pos-backend` |
| **Backup SQLite database** | `sudo docker cp beer-pos-backend:/app/data/beer_pos.db ./backup_beer_pos.db` |
| **Full reset (delete data & images)** | `sudo docker compose down -v --rmi all` |

---

## Method 2: Manual Development Setup (Windows & Linux)

### Windows Quick Start
1. Start Backend (PowerShell Terminal 1): `.\start-backend.ps1` (API runs at `http://localhost:8080/api`)
2. Start Frontend (PowerShell Terminal 2): `.\start-frontend.ps1` (UI runs at `http://localhost:5173`)

### Linux Manual Quick Start
Requires Node.js `20.19+` or `22.12+`:

    cd ~/Projects/Beer-POS-project
    chmod +x install-linux.sh start-frontend.sh start-backend.sh
    ./install-linux.sh

Run `./start-backend.sh` in Terminal 1 and `./start-frontend.sh` in Terminal 2, then open `http://<SERVER_IP>:5173`.

---

## Method 3: Bare-Metal Linux Production (Without Docker)
1. Copy project files to `/opt/beer-pos/frontend` and `/opt/beer-pos/backend/beer-pos-api`.
2. Run `./install-linux.sh`.
3. Configure `backend/beer-pos-api/.env` with a strong `JWT_SECRET` and `CORS_ORIGIN`.
4. Install the systemd service from `deploy/linux/beer-pos-api.service.example` to `/etc/systemd/system/beer-pos-api.service`:

    sudo systemctl daemon-reload
    sudo systemctl enable --now beer-pos-api
    sudo systemctl status beer-pos-api

5. Configure Nginx using `deploy/linux/nginx-beer-pos.conf.example` (place in `/etc/nginx/sites-available/` on Ubuntu/Debian or `/etc/nginx/conf.d/` on Rocky Linux/RHEL), test, and reload:

    sudo nginx -t
    sudo systemctl reload nginx
