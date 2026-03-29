# EduPlatform - Premium Learning Platform

A full-stack educational platform where teachers conduct live lectures with real-time Q&A and students access courses through a course-based payment system.

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js v5 (Credentials)
- **Payments:** Stripe Checkout
- **Live Video:** LiveKit (open-source, self-hosted)
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Calendar:** FullCalendar

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for PostgreSQL and LiveKit)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the database and LiveKit server:
```bash
docker compose up -d
```

3. Copy the environment file and fill in your values:
```bash
cp .env.example .env
```

4. Generate the Prisma client and push the schema:
```bash
npx prisma generate
npx prisma db push
```

5. Seed the database with sample data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

### Seed Accounts

| Role    | Email                      | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@eduplatform.com     | admin123    |
| Teacher | teacher1@eduplatform.com  | teacher123  |
| Teacher | teacher2@eduplatform.com  | teacher123  |
| Student | student1@eduplatform.com  | student123  |
| Student | student2@eduplatform.com  | student123  |

## Features

### For Students
- Browse and search course catalog with filters
- Cart-based checkout via Stripe
- Watch recorded lectures with custom video player
- Join live lectures with real-time video, chat, and raise-hand
- Track learning progress
- Calendar view of upcoming lectures
- In-app notifications

### For Teachers
- Create and manage courses with pricing
- Upload videos and resources
- Schedule and conduct live lectures
- Screen sharing during live sessions
- Approve/deny student speaking requests
- View earnings dashboard and transaction history
- Auto-recording of live sessions

### For Admins
- Approve/reject teacher registrations
- Monitor platform-wide statistics
- View financial reports and revenue charts
- Manage courses and transactions

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── (platform)/      # Main app with sidebar layout
│   │   ├── admin/       # Admin panel pages
│   │   ├── calendar/    # Calendar view
│   │   ├── cart/        # Shopping cart + checkout
│   │   ├── courses/     # Catalog, detail, watch pages
│   │   ├── dashboard/   # Role-based dashboard
│   │   ├── earnings/    # Teacher earnings
│   │   ├── live/        # Live lecture room
│   │   └── ...
│   └── api/             # API route handlers
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── course/          # Course-related components
│   ├── dashboard/       # Dashboard charts/stats
│   ├── layout/          # Sidebar, header, notifications
│   └── live/            # Live room, chat, raise hand
└── lib/                 # Utilities, auth, DB, storage
```

## Revenue Model

- Platform takes 15% commission on each course sale
- Teachers receive 85% of the course price
- Monthly automated payouts (minimum $50 threshold)
