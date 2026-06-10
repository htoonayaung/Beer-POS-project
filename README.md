# Beer POS Project

Myanmar beer shop, bar, and restaurant POS with inventory management.

## Project folders

- `frontend` - React, TypeScript, TailwindCSS, responsive POS application
- `backend/beer-pos-api` - Express, Prisma, SQLite enterprise API
- `database/beer_pos_schema.sql` - Legacy/reference SQL schema

## Start frontend

```powershell
.\start-frontend.ps1
```

Frontend URL: `http://localhost:5173`

## Start backend

Open another PowerShell terminal:

```powershell
.\start-backend.ps1
```

Backend API: `http://localhost:8080/api`

## Default API accounts

- Admin: username `admin`, PIN `1111`
- Cashier: username `cashier`, PIN `3333`

Change the JWT secret and all default credentials before production use.

## Linux quick start

Requirements:

- Ubuntu/Debian or another modern Linux distribution
- Node.js 20.19+ or 22.12+
- npm

After copying this folder to Linux:

```bash
cd "/path/to/Beer POS Project"
chmod +x install-linux.sh start-frontend.sh start-backend.sh
./install-linux.sh
```

Start the backend:

```bash
./start-backend.sh
```

Open another terminal and start the frontend:

```bash
./start-frontend.sh
```

Open:

```text
http://SERVER_IP:5173
```

The copied Windows `node_modules` folders are not used as-is. `npm ci` installs
Linux-compatible packages from the lock files.

## Ubuntu/Debian Node.js example

Install Node.js 20.19+ or 22.12+ using your approved package source. Confirm:

```bash
node --version
npm --version
```

Do not continue with Node.js 20.18 or older. The included Vite version requires
Node.js `20.19+` or `22.12+`.

## Production deployment

Recommended locations:

```text
/opt/beer-pos/frontend
/opt/beer-pos/backend/beer-pos-api
```

1. Run `./install-linux.sh`.
2. Edit `backend/beer-pos-api/.env`.
3. Set a long random `JWT_SECRET`.
4. Set `CORS_ORIGIN` to the real frontend URL, for example
   `https://pos.example.com`.
5. Copy `deploy/linux/beer-pos-api.service.example` to
   `/etc/systemd/system/beer-pos-api.service`.
6. Adjust the service paths and Linux user if necessary.
7. Copy `deploy/linux/nginx-beer-pos.conf.example` to the Nginx sites folder.
8. Replace `pos.example.com` with the real domain.
9. Enable HTTPS before public use.

Example service commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now beer-pos-api
sudo systemctl status beer-pos-api
```

Example Nginx commands on Ubuntu/Debian:

```bash
sudo ln -s /etc/nginx/sites-available/beer-pos /etc/nginx/sites-enabled/beer-pos
sudo nginx -t
sudo systemctl reload nginx
```

Only ports `80` and `443` should normally be public. Keep backend port `8080`
bound behind Nginx/firewall where possible.
