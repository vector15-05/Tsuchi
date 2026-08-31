# ⚡ Tsuchi — Real-Time Anime Release Tracking & Notification Platform

<p align="center">
  <img src="client/public/android-chrome-512x512.png" width="120" alt="Tsuchi Logo" />
</p>

<p align="center">
  <b>Cinematic, automated, real-time anime episode release tracking & instant email notification platform.</b>
</p>

---

## 🌟 Overview

**Tsuchi** is a full-stack platform that monitors airing anime series in real-time using the Jikan (MyAnimeList) API and notifies users instantly whenever a new episode airs. It pairs an immersive, dark glassmorphism WebGL-powered Next.js frontend with an event-driven Express backend backed by Prisma ORM, Neon PostgreSQL, Upstash Redis, and BullMQ queues.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **Styling**: Vanilla CSS & [Tailwind CSS v4](https://tailwindcss.com/)
- **Visual Effects**: OGL WebGL dynamic `GhostFibers` animated background canvas
- **Authentication**: [Better Auth](https://www.better-auth.com/) Client (`@better-auth/react`)
- **Icons**: Lucide React

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/) / [Bun](https://bun.sh/)
- **API Framework**: Express.js
- **Database & ORM**: PostgreSQL (Neon) with [Prisma ORM 7](https://www.prisma.io/) & `@prisma/adapter-pg`
- **Authentication**: Better Auth Server with Prisma Adapter
- **Background Jobs & Queues**: BullMQ with Upstash Redis
- **Notifications**: Nodemailer (SMTP) with master email carbon-copying
- **External Integration**: Jikan API v4 (MyAnimeList REST API)

---

## ⚡ Key Features

- **🌐 Dynamic Airing Anime Radar**: Fetches and renders currently airing seasonal anime with live episode counts.
- **🎨 Glassmorphism & WebGL Canvas UI**: Deep dark aesthetic with an animated flowing shader background (`GhostFibers`).
- **🔐 Better Auth Authentication**: Secure credential login/signup with session management and user state persistence.
- **📌 Interactive Subscription Radar**: Toggle subscriptions directly from the homepage or manage your watchlist on the dashboard.
- **🔄 Hourly Automated Jikan Sync**: Background worker queries the Jikan API, detects episode increments, and updates the database.
- **📩 Real-Time Email Alerts**: Queued notification workers dispatch HTML release alert emails to subscribers.
- **👑 Master Administrator Copy**: Automatically routes complete sync reports and carbon-copies subscriber notifications to the master admin email.
- **🧪 E2E Test Pipeline**: Built-in verification CLI (`src/scripts/testPipeline.ts`) to validate database connectivity, Jikan fetching, and BullMQ queue execution.

---

## 🏗️ Architecture Flow

```mermaid
flowchart TD
    User([User / Browser]) <-->|Next.js 15 + Better Auth| ClientApp[Frontend App]
    ClientApp <-->|REST API| Backend[Express Backend API :6767]
    Backend <-->|Prisma ORM| Postgres[(Neon PostgreSQL DB)]
    
    subgraph Background Services
        Cron[Hourly Cron Scheduler] -->|Trigger| SyncQueue[BullMQ Sync Queue]
        SyncQueue --> SyncWorker[Sync Worker]
        SyncWorker <-->|HTTP| JikanAPI[Jikan API v4]
        SyncWorker -->|Detect New Ep| DBUpdate[(Database Update)]
        SyncWorker -->|Enqueue Alerts| NotificationQueue[BullMQ Notification Queue]
        NotificationQueue --> NotificationWorker[Notification Worker]
        NotificationWorker -->|SMTP| EmailService[Subscriber & Master Email]
    end
    
    Backend <-->|Upstash Redis| SyncQueue
    Backend <-->|Upstash Redis| NotificationQueue
```

---

## ⚙️ Environment Configuration

### **Backend (`.env`)**

Create a `.env` file in the root directory:

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

### **Frontend (`client/.env.local`)**

Create a `.env.local` file in the `client/` directory:

```env
NEXT_PUBLIC_API_URL="http://localhost:6767/api"
BETTER_AUTH_URL="http://localhost:6767"
```

---

## 🚀 Getting Started

### **1. Clone the Repository & Install Dependencies**

```bash
git clone https://github.com/vector15-05/Tsuchi.git
cd Tsuchi

# Install root dependencies
bun install   # or npm install

# Install frontend dependencies
cd client
bun install   # or npm install
cd ..
```

---

### **2. Database Setup & Migrations**

```bash
# Generate Prisma Client (Prisma 7 with pg adapter)
npx prisma generate

# Run migrations
npx prisma migrate dev
```

---

### **3. Start the Backend API & Queue Worker**

```bash
# Development server (API + BullMQ workers)
bun run src/index.ts
```

The Express API will listen on `http://localhost:6767` and BullMQ workers will begin listening for queue jobs.

---

### **4. Start the Next.js Frontend**

In a separate terminal window:

```bash
cd client
bun run dev
```

The application UI will be accessible at `http://localhost:3000`.

---

## 🧪 Running the E2E Verification Test Pipeline

Tsuchi includes an automated end-to-end verification script to test DB connectivity, Jikan API integration, subscription seeding, email generation, and BullMQ queue execution:

```bash
bun run src/scripts/testPipeline.ts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
