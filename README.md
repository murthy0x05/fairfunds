# FairSplit — Shared Expense Management

> Transparent, explainable shared expense tracking with CSV import, multi-currency support, and temporal membership management.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma
- **Auth**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui-inspired custom components
- **Charts**: Recharts

## Features

- 📊 **Explainable Balances** — Click "Why do I owe ₹2,347?" and see every expense, split calculation, and conversion
- 📁 **Smart CSV Import** — 14 anomaly detectors catch duplicates, missing data, and format issues
- 💱 **Multi-Currency** — USD and INR with historical daily exchange rates from ECB
- 👥 **Temporal Memberships** — Sam joined mid-April? He's only charged after his join date
- 🧮 **4 Split Types** — Equal, unequal, percentage, and share (ratio) splits
- 📝 **Full Audit Trail** — Every change logged with before/after diffs
- 🔒 **Authentication** — JWT-based auth with bcrypt password hashing
- 💰 **Debt Simplification** — Minimize the number of transfers to settle all debts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (recommend [Neon](https://neon.tech) free tier)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# 3. Push schema to database
npm run db:push

# 4. Generate Prisma client
npm run db:generate

# 5. Seed the database (creates 6 users + group + memberships)
npm run db:seed

# 6. Start development server
npm run dev
```

### Login Credentials (after seeding)

| User  | Email               | Password     |
|-------|---------------------|--------------|
| Aisha | aisha@fairsplit.app | password123  |
| Rohan | rohan@fairsplit.app | password123  |
| Priya | priya@fairsplit.app | password123  |
| Sam   | sam@fairsplit.app   | password123  |
| Meera | meera@fairsplit.app | password123  |
| Dev   | dev@fairsplit.app   | password123  |

### Importing the CSV

1. Log in as any user
2. Navigate to **Import CSV** in the sidebar
3. Enter the Group ID (shown in URL when viewing the group)
4. Upload `expenses_export.csv`
5. Review anomalies (24 detected)
6. Click **Confirm Import**
7. View expenses and balances in the group page

## Architecture

```
src/
├── actions/          # Server Actions (API layer)
│   ├── auth.ts       # Sign up, sign in, sign out
│   ├── groups.ts     # Group CRUD, membership
│   ├── expenses.ts   # Expense CRUD
│   ├── balances.ts   # Balance calculation, settlements
│   └── import.ts     # CSV import pipeline
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login, register (route group)
│   ├── dashboard/    # Protected dashboard pages
│   └── api/auth/     # NextAuth API route
├── components/       # React components
│   ├── ui/           # Base components (Button, Card, etc.)
│   ├── dashboard/    # Sidebar, TopBar
│   └── groups/       # GroupTabs, expense/balance views
├── lib/
│   ├── services/     # Business logic
│   │   ├── audit.service.ts
│   │   ├── balance.service.ts
│   │   ├── currency.service.ts
│   │   ├── expense.service.ts
│   │   ├── group.service.ts
│   │   └── settlement.service.ts
│   ├── utils/        # Pure utilities
│   │   ├── currency.ts
│   │   ├── debt-simplifier.ts
│   │   └── split-calculator.ts
│   ├── validators/   # Zod schemas
│   ├── auth.ts       # NextAuth config
│   └── db.ts         # Prisma singleton
└── middleware.ts     # Auth middleware
```

## Schema Overview

- **Users** — 6 flatmates + guest support
- **Groups** — Expense sharing groups with default currency
- **GroupMemberships** — Temporal (joinedAt/leftAt) for pro-rated expenses
- **Expenses** — Integer amounts in smallest unit (paise/cents)
- **ExpenseSplits** — Pre-computed share amounts
- **Settlements** — Person-to-person payments (separate from expenses)
- **ExchangeRates** — Immutable DB cache from ECB via Frankfurter API
- **ImportBatches** — Import job tracking with lifecycle
- **ImportAnomalies** — Per-anomaly records with resolution tracking
- **AuditLogs** — Append-only change log with JSONB diffs

## Design Decisions

See [DECISIONS.md](./DECISIONS.md) for 15 documented engineering decisions covering:
- Integer money storage (why not floats)
- Temporal membership model
- Settlement as separate entity
- Duplicate detection algorithm
- Currency conversion strategy
- And more...
