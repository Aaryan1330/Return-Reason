# Snitch Returns Review Tool

Internal tool for the production team to review and action SKUs with high size-related return rates.

---

## Tech Stack

- **Next.js 14** (App Router) — frontend + API routes
- **PostgreSQL** — database (hosted on Coolify)
- **NextAuth v4** — email/password authentication
- **Tailwind CSS** — styling

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=postgresql://user:password@host:5432/snitch_returns
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://your-coolify-domain.com
INTERNAL_API_KEY=<a strong secret for backend API calls>
```

---

## First-Time Setup

### 1. Initialise the database + create first user

After the app is deployed and running, call the init endpoint once:

```bash
curl -X POST https://your-app.com/api/init \
  -H "x-api-key: YOUR_INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@snitch.com","password":"yourpassword","name":"Your Name"}'
```

This creates the `users` and `sku_reviews` tables and the first admin user.

### 2. Add more team members

Any logged-in user can create new accounts:

```bash
curl -X POST https://your-app.com/api/users \
  -H "x-api-key: YOUR_INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"poovana@snitch.com","password":"pass123","name":"Poovana"}'
```

---

## How Your Backend Inserts Weekly SKU Data

Your backend (or a script) should call this endpoint every week to populate the review list:

```bash
# Insert a single SKU
curl -X POST https://your-app.com/api/skus \
  -H "x-api-key: YOUR_INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sku_group": "4MSR5194-03",
    "category": "Trousers",
    "return_pct": 20,
    "online_inventory": 4120,
    "image_url": "https://cdn.snitch.co.in/images/4MSR5194-03.jpg",
    "week_date": "2024-01-15"
  }'

# Or insert multiple at once (array)
curl -X POST https://your-app.com/api/skus \
  -H "x-api-key: YOUR_INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[
    {"sku_group": "4MSR5194-03", "category": "Trousers", ...},
    {"sku_group": "4JE039-02",   "category": "Jeans",    ...}
  ]'
```

**`week_date` tip:** Always set this to the **Monday** of the review week (e.g. `2024-01-15`). This keeps all SKUs in the same batch together in the week selector. If omitted, it defaults to the Monday of the current week automatically.

---

## Database Schema

See [`db/schema.sql`](db/schema.sql) for the full schema. Key fields:

| Column | Type | Description |
|--------|------|-------------|
| `sku_group` | text | SKU identifier |
| `category` | text | Product category |
| `return_pct` | decimal | Return percentage |
| `online_inventory` | int | Units currently online |
| `image_url` | text | Product image URL |
| `week_date` | date | Monday of review week |
| `size_check` | boolean | Was size labelling verified? |
| `size_issue_found` | boolean | Was a size discrepancy found? |
| `fit_trial_done` | boolean | Was garment physically tried on? |
| `debit_note_raised` | boolean | Was a debit note raised? |
| `remarks` | text | Free-text notes |
| `description_updated` | boolean | Was the product description updated? |
| `description_update_notes` | text | What was changed in the description |
| `review_status` | text | `pending` / `in_review` / `action_taken` / `resolved` / `escalated` |

---

## Coolify Deployment

1. Push this repo to GitHub.
2. In Coolify, create a new **Docker** service pointing to your GitHub repo.
3. Set all environment variables from `.env.example` in the Coolify dashboard.
4. Deploy. Coolify will build and run the Docker container.
5. Run the `/api/init` curl command above to set up the DB.

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in your local DB values
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
