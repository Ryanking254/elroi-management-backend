# Elroi Inventory Backend (Express + Prisma)

Pure JavaScript API for the Elroi Shop inventory management system.

## Features

- Categories CRUD
- Items CRUD + stock adjustments + sales (with automatic profit calculation)
- Stock movements history
- Daily & summary reports (revenue, cost, profit)
- Team invitations
- Simple auth middleware (auto-creates a default shop + owner for development)

## Tech

- Express
- Prisma + MySQL
- JWT ready (currently has a development fallback)

## Setup

1. Copy environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and set your `DATABASE_URL` (PlanetScale, Railway MySQL, local MySQL, etc.)

3. Install dependencies:
```bash
npm install
```

4. Generate Prisma client & push schema:
```bash
npx prisma generate
npx prisma db push
```

5. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`.

## API Endpoints

All routes are under `/api` and currently use a development auth fallback (no token required).

### Categories
- `GET    /api/categories`
- `POST   /api/categories`          body: `{ "name": "Groceries" }`
- `PUT    /api/categories/:id`
- `DELETE /api/categories/:id`

### Items
- `GET    /api/items`
- `GET    /api/items/:id`
- `POST   /api/items`              body: `{ name, categoryId, costPrice, sellingPrice?, currentStock? }`
- `PUT    /api/items/:id`
- `POST   /api/items/:id/adjust`   body: `{ type: "IN"|"OUT", quantity, note? }`
- `POST   /api/items/:id/sale`     body: `{ quantity, saleAmount, note? }`

### Movements
- `GET /api/movements?type=SALE&start=2026-08-01&end=2026-08-10&limit=50`

### Reports
- `GET /api/reports/daily?start=2026-08-01&end=2026-08-10`
- `GET /api/reports/summary?start=2026-08-01&end=2026-08-10`

### Invitations / Team
- `POST /api/invitations`          body: `{ email, role? }`
- `GET  /api/team`

## Connecting the Expo frontend

In your Expo project `.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4000/api
```

(Use your computer’s local IP so the phone can reach it, e.g. `http://192.168.1.10:4000/api`)

## Production notes

- Replace the development auth fallback in `src/middleware/auth.js` with real JWT validation.
- Set a strong `JWT_SECRET`.
- Deploy to Railway, Render, or Vercel (with a serverless adapter if needed).
