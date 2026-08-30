# Tsuchi

Tsuchi is a backend service that tracks anime releases and notifies subscribed users when new episodes air. It uses Express for HTTP APIs, Prisma with PostgreSQL for persistence, BullMQ with Redis for background processing, and nodemailer for sending notification emails.

## Key Features

- Track anime by external MAL (MyAnimeList) ID
- Background sync worker that polls the Jikan API for current-season information
- Notification queue that emails subscribers when new episodes are detected
- Authentication routes mounted under `/api/auth` with middleware-protected endpoints

## Requirements

- Node.js (or Bun) and a compatible package manager
- PostgreSQL database (set `DATABASE_URL`)
- Redis instance (set `REDIS_URL`)
- SMTP credentials for sending email notifications

## Environment Variables

Set the following environment variables for local development or in your deployment environment:

- `DATABASE_URL` — PostgreSQL connection string used by Prisma
- `REDIS_URL` — Redis connection string used by BullMQ
- `PORT` — Port for the Express server (default: 3000)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` — SMTP settings for `nodemailer`
- `FRONTEND_URL` — Frontend base URL used in notification links

Security note: the `pg-connection-string` package may warn about deprecated SSL modes. To preserve current behavior, append `?sslmode=verify-full` to `DATABASE_URL`. To adopt libpq-compatible semantics, use `?uselibpqcompat=true&sslmode=require`.

## Setup

1. Install dependencies:

```bash
npm install
# or
bun install
```

2. Generate Prisma client (if `generated/` is not committed):

```bash
npx prisma generate
```

3. Apply database migrations (development):

```bash
npx prisma migrate dev
```

## Running the application

Start the server in development:

```bash
node --loader ts-node/esm src/index.ts
# or using Bun
bun src/index.ts
```

Workers are started as part of the same process in `src/index.ts`. The sync worker listens on the `tsuchi-sync-queue` queue and enqueues email jobs to `tsuchi-notifications`. Ensure Redis is reachable and the worker logs appear on startup.

## Seeding / Test pipeline

There is a test script at `src/scripts/testPipeline.ts` that:

- Fetches a current-season anime from the Jikan API
- Upserts an `Anime` record
- Upserts a test `User` and subscribes them to the anime
- Triggers the sync queue

Run it via:

```bash
npx ts-node-esm src/scripts/testPipeline.ts
# or
bun src/scripts/testPipeline.ts
```

## Generated client

Prisma generates a client into `generated/prisma`. It is recommended to keep `generated/` out of source control (it is already in `.gitignore`) and run `npx prisma generate` during CI or as a `postinstall` script. If your deployment environment cannot run generators, you may choose to commit the generated client and remove `generated/` from `.gitignore`.

## Troubleshooting

- Worker not processing jobs: verify queue names. The project uses `tsuchi-sync-queue` for sync jobs and `tsuchi-notifications` for email jobs. Producers and consumers must share the same queue name.
- SMTP issues: check `SMTP_*` credentials and whether your provider requires app passwords or OAuth. Ensure `SMTP_SECURE` is set appropriately.
- Deprecated SSL mode warning: update `DATABASE_URL` as noted above to avoid future behavior changes.

## Contributing

Open a pull request with a clear description of changes. When modifying the Prisma schema, include migration files and regenerate the Prisma client.

## License

No license is specified. Add a `LICENSE` file if you plan to open-source this repository.

If you want, I can add a `postinstall` script in `package.json` to run `prisma generate` automatically; tell me if you'd like that change.
