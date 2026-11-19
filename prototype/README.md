# SplitSmart prototype

A responsive Next.js app for managing shared group expenses. The Lab 9 flows let users create a group, add members, record equal-split expenses, browse group history, and view each member’s calculated net balance. Money is stored as integer cents in SQLite through server-side Prisma 6.19.3.

## Local setup

The existing prisma/dev.db is preserved. Setup adds the schema with Prisma db push and inserts or updates the fixed demo records without resetting the database.

    cp .env.example .env
    npm run db:setup
    npm run dev

Open http://localhost:3000. Rerun only the idempotent demo seed with npm run db:seed. Apply schema updates with npm run db:push.

New expenses are immediately included in balances. The app uses Alex Morgan as a demo group creator/admin identity; it does not implement user authentication. Recorded payments remain local prototype entries and do not process or transfer money. Notifications are UI-only.

## Checks

    npm run lint
    npm run build
