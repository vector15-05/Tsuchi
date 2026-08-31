# Tsuchi — Real-Time Anime Release Tracking & Notification Platform

<p align="center">
  <img src="client/public/android-chrome-512x512.png" width="120" alt="Tsuchi Logo" />
</p>

<p align="center">
  <b>Automated, real-time anime episode release tracking and instant notification system.</b>
</p>

---

## Overview

Tsuchi is an end-to-end full-stack application that tracks currently airing anime series via the Jikan (MyAnimeList) API and notifies subscribed users when new episodes are released. It combines a WebGL-enhanced Next.js frontend with an event-driven Express backend powered by Prisma ORM, Neon PostgreSQL, Upstash Redis, and BullMQ background processing queues.

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Vanilla CSS and Tailwind CSS v4
- **Visual Effects**: OGL WebGL dynamic shader canvas (`GhostFibers`)
- **Authentication**: Better Auth Client (`@better-auth/react`)
- **Iconography**: Lucide React

### Backend
- **Runtime**: Node.js / Bun
- **API Server**: Express.js
- **Database & ORM**: PostgreSQL (Neon) with Prisma ORM 7 (`@prisma/adapter-pg`)
- **Authentication**: Better Auth Server with Prisma Adapter
- **Background Jobs & Queues**: BullMQ with Upstash Redis
- **Notification Services**: Nodemailer (SMTP) with master administrative carbon-copying
- **External Integration**: Jikan API v4 (MyAnimeList REST API)

---

## System Capabilities

- **Real-Time Airing Radar**: Aggregates and displays currently airing seasonal anime with live episode counts.
- **Glassmorphism & WebGL Canvas UI**: Modern dark theme backed by a dynamic GPU-rendered shader canvas (`GhostFibers`).
- **Better Auth Integration**: Secure password-based authentication with session management and user state persistence.
- **Interactive Subscription Management**: Allows users to subscribe or unsubscribe directly from the homepage or manage their active watchlist via the dashboard.
- **Automated Jikan Sync**: Scheduled background worker queries the Jikan API, detects episode increments, and updates state in the PostgreSQL database.
- **Queued Email Dispatch**: Asynchronous notification workers compile and send HTML release notifications to subscribers.
- **Master Administrator Audit Copy**: Automatically routes complete sync execution reports and carbon-copies subscriber notifications to the configured administrator email.
- **End-to-End Verification Pipeline**: Includes a CLI verification script (`src/scripts/testPipeline.ts`) to validate database connectivity, Jikan API parsing, email rendering, and BullMQ queue execution.

---

## Architecture Sequence Diagram

```mermaid
graph TD
    User["User / Browser"] -->|Next.js 15 + Better Auth| ClientApp["Frontend App"]
    ClientApp -->|REST API| Backend["Express Backend API (:6767)"]
    Backend -->|Prisma ORM| Postgres[("Neon PostgreSQL DB")]
    Backend -->|Upstash Redis| SyncQueue["BullMQ Sync Queue"]
    Backend -->|Upstash Redis| NotificationQueue["BullMQ Notification Queue"]

    subgraph BackgroundServices ["Background Processing Services"]
        Cron["Hourly Cron Scheduler"] -->|Trigger| SyncQueue
        SyncQueue --> SyncWorker["Sync Worker"]
        SyncWorker -->|HTTP REST| JikanAPI["Jikan API v4"]
        SyncWorker -->|Update State| Postgres
        SyncWorker -->|Enqueue Alert Jobs| NotificationQueue
        NotificationQueue --> NotificationWorker["Notification Worker"]
        NotificationWorker -->|SMTP Email| EmailService["Subscriber & Master Email"]
    end
```

---

## Environment Configuration

### Backend Environment Configuration (`.env`)

Create a `.env` file in the project root directory:

```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
REDIS_URL="rediss://default:token@host.upstash.io:6379"
PORT="6767"

# Master Administrator Email
ADMIN_EMAIL="admin@yourdomain.com"
MASTER_EMAIL="admin@yourdomain.com"

# SMTP Email Dispatcher
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="admin@yourdomain.com"
SMTP_PASS="your-16-char-app-password"

FRONTEND_URL="http://localhost:3000"
LOG_LEVEL="info"
```

### Frontend Environment Configuration (`client/.env.local`)

Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:6767/api"
BETTER_AUTH_URL="http://localhost:6767"
```

---

## Installation & Setup

### 1. Repository Setup & Dependency Installation

```bash
git clone https://github.com/vector15-05/Tsuchi.git
cd Tsuchi

# Install root dependencies
bun install

# Install frontend dependencies
cd client
bun install
cd ..
```

---

### 2. Database Schema Generation & Migration

```bash
# Generate Prisma Client (Prisma 7 with pg adapter)
npx prisma generate

# Apply database migrations
npx prisma migrate dev
```

---

### 3. Execution

#### Backend API Server & Worker Process

```bash
# Starts Express HTTP server and BullMQ background workers
bun run src/index.ts
```

The Express API will listen on `http://localhost:6767` and BullMQ workers will initialize listening for queue jobs.

#### Next.js Development Server

In a separate terminal session:

```bash
cd client
bun run dev
```

The user interface will be available at `http://localhost:3000`.

---

## Verification & Automated Testing

Tsuchi provides a comprehensive verification pipeline script to test database persistence, API ingestion, email rendering, and queue processing end-to-end:

```bash
bun run src/scripts/testPipeline.ts
```

---

## License

This software is licensed under the [MIT License](LICENSE).
