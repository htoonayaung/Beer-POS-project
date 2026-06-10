# Golden Tap Enterprise POS API

Production-oriented REST API for Myanmar beer shops, bars, restaurants, BBQ shops, cafes, and entertainment venues.

## Included

- Prisma normalized relational schema
- SQLite development database
- JWT authentication with bcrypt password/PIN hashing
- Role and custom permission mapping
- Branch-scoped access
- Rate-limited login
- Zod request validation
- Transactional sale creation
- Negative-stock prevention
- Automatic inventory deduction
- Automatic KOT/BOT creation
- Low-stock notifications
- Audit logging
- Graceful shutdown

## Local Setup

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm start
```

API: `http://localhost:8080/api`

Seed accounts:

- Admin: username `admin`, PIN `1111`
- Cashier: username `cashier`, PIN `3333`

Change all seed credentials and `JWT_SECRET` before deployment.

## PostgreSQL Production Mode

Use the same normalized models in `prisma/schema.prisma`, change the datasource provider to `postgresql`, and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/golden_tap?schema=public"
```

Then create a reviewed migration:

```powershell
npx prisma migrate dev --name init
npx prisma migrate deploy
```

Production should run behind TLS termination and a reverse proxy. Set a strict `CORS_ORIGIN`, use a generated JWT secret, rotate credentials, enable database backups, and keep the API unavailable from the public internet unless protected by a gateway or firewall.
