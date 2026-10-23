# Contribution App

A small Node.js + Express + PostgreSQL web app. A simple form captures a contributor's
**name, email, phone number and contribution amount** and saves each submission to Postgres.

## Project structure

```
contribution-app/
├── package.json
├── docker-compose.yml          # Local PostgreSQL
├── .env.example                # Copy to .env
├── public/                     # The user interface
│   ├── index.html
│   ├── styles.css
│   └── app.js                  # Form handling (fetch -> API)
├── src/
│   ├── server.js               # Starts the HTTP server
│   ├── app.js                  # Express setup, routes, error handler
│   ├── config/index.js         # Reads environment variables
│   ├── db/
│   │   ├── pool.js             # PostgreSQL connection pool
│   │   ├── migrate.js          # Runs SQL migrations
│   │   └── migrations/001_create_contributions.sql
│   ├── routes/contributions.routes.js
│   ├── controllers/contributions.controller.js
│   ├── services/contributions.service.js
│   ├── models/contributions.model.js   # SQL queries live here
│   └── middleware/
│       ├── validate.js         # Input validation
│       └── errorHandler.js
└── tests/
```

Request flow: **Form -> POST /api/contributions -> validate -> controller -> service -> model -> PostgreSQL**

## Setup

1. **Install Node.js 18+** and (optionally) Docker.
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start PostgreSQL** (pick one)
   - With Docker: `docker compose up -d`
   - Or use an existing Postgres and create a database, then edit `DATABASE_URL` in `.env`.
4. **Configure environment**
   ```bash
   cp .env.example .env     # already provided with Docker defaults
   ```
5. **Create the table**
   ```bash
   npm run migrate
   ```
6. **Run the app**
   ```bash
   npm start
   ```
   Open http://localhost:3000

## Run everything with Docker

The `Dockerfile` builds the app image and `docker-compose.yml` starts it together with PostgreSQL.
Migrations run automatically each time the app container starts.

```bash
docker compose up -d --build
```

Open http://localhost:3000. Useful commands:

```bash
docker compose logs -f app     # follow app logs
docker compose down            # stop (data is kept in the pgdata volume)
docker compose down -v         # stop and delete the database data
```

To deploy the image on its own (for example to a cloud host with a managed Postgres):

```bash
docker build -t contribution-app .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://user:password@your-db-host:5432/dbname" \
  -e DATABASE_SSL=true \
  contribution-app
```

Change the database password in `docker-compose.yml` before using it anywhere beyond your own machine.

## API

| Method | Path                         | Description                                   |
|--------|------------------------------|-----------------------------------------------|
| POST   | `/api/contributions`         | Save a contribution (JSON body)               |
| GET    | `/api/contributions/summary` | Count and total of contributions (no personal data) |
| GET    | `/api/health`                | Health check                                  |

Example:

```bash
curl -X POST http://localhost:3000/api/contributions \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Rao","email":"asha@example.com","phone":"+91 98765 43210","amount":"1500.50"}'
```

## Viewing the saved data

```bash
docker exec -it contributions-db psql -U contrib_user -d contributions \
  -c "SELECT * FROM contributions ORDER BY id DESC;"
```

## Database table

| Column     | Type           | Notes                       |
|------------|----------------|-----------------------------|
| id         | SERIAL         | Primary key                 |
| name       | VARCHAR(100)   | Required                    |
| email      | VARCHAR(255)   | Required, stored lowercase  |
| phone      | VARCHAR(20)    | Required                    |
| amount     | NUMERIC(12,2)  | Required, must be > 0       |
| created_at | TIMESTAMPTZ    | Defaults to now             |

## Tests

```bash
npm test
```

Tests run the full API against an in-memory PostgreSQL emulator (`pg-mem`), so no database is needed.

## Notes before going to production

- The data includes personal information. There is intentionally **no endpoint that lists contributors**.
  If you add an admin view, protect it with authentication.
- Serve the app over HTTPS and add rate limiting (e.g. `express-rate-limit`) and security headers (`helmet`).
- Never commit your real `.env`.
- This app records contributions only; it does not process payments.
