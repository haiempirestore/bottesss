# Shop Hai1110# — Cyberpunk Telegram Shop / GitHub Pages + API + VietQR

Starter full-stack implementation: Telegram bot + Telegram Mini App + Admin dashboard + Express API + PostgreSQL/Prisma.

## Architecture
- `frontend/`: React + Vite + TypeScript. Same app serves `/` Mini App and `/admin` admin UI.
- `backend/`: Express API + Telegraf bot + VietQR deposit/webhook endpoints.
- `prisma/`: PostgreSQL schema.
- GitHub Pages hosts the frontend only. Backend, bot and database run on Render/Railway/VPS.

## Requirements
- Node.js 20+
- PostgreSQL 15+
- Telegram bot token from @BotFather
- Public HTTPS backend URL and frontend URL
- A bank/payment provider that sends authenticated payment webhooks (or a VietQR-compatible provider).

## Local setup
1. Copy `.env.example` to `.env` and fill every required value.
2. Start PostgreSQL: `docker compose up -d db`
3. Install packages: `npm install`
4. Generate Prisma client and migrate:
   `npm run db:generate && npm run db:migrate`
5. Create the first admin:
   `npm run admin:create -- --email admin@example.com --password 'ChangeThisPassword!'`
6. Run backend and frontend:
   `npm run dev`

Frontend: http://localhost:5173  
API health: http://localhost:4000/health  
Admin: http://localhost:5173/admin

## Telegram setup
1. Create a bot with @BotFather, set its username there, and set `BOT_TOKEN`. The backend sets the public display name to `Shop Hai1110#` on startup; the bot username (the @handle) must still be chosen in @BotFather.
2. Set `MINI_APP_URL` to the deployed HTTPS frontend URL.
3. Set the Mini App URL in BotFather (Menu Button / Web App).
4. For local testing, expose the frontend and backend through HTTPS tunnels and update URLs.
5. Bot uses long polling when `BOT_MODE=polling`. For production, use a single backend instance. Do not run multiple polling replicas.

## VietQR integration
`POST /api/payments/deposits` creates a pending deposit and returns a VietQR image URL generated using `VIETQR_BASE_URL` and bank/account configuration. The QR itself does **not** prove payment.
A payment is credited only by `POST /api/webhooks/bank`, after HMAC verification using `PAYMENT_WEBHOOK_SECRET`, unique provider event ID, exact amount and matching transfer description/reference.
Connect your bank/payment provider to this webhook. Do not expose webhook secret or bank credentials in the frontend. If your provider uses a different signature scheme, adapt `verifyBankWebhook()` to its official specification before going live.

## GitHub Pages deployment
1. Set GitHub repository variable `VITE_API_URL` to your public API URL (no trailing slash).
2. Enable Pages using GitHub Actions.
3. Push to `main`. Workflow builds and publishes `frontend/dist`.
4. Add the deployed Pages URL to `MINI_APP_URL` and configure it in BotFather.

## Important production checklist
- Use HTTPS everywhere.
- Configure CORS to the exact frontend origin.
- Use a strong random `JWT_SECRET` and `PAYMENT_WEBHOOK_SECRET`.
- Configure provider-authenticated webhooks; never credit based only on a screenshot or QR scan.
- Set up backups, monitoring, log retention and rate limits at the hosting layer.
- Review local legal/payment-provider requirements before accepting payments.
- Add a real email/password reset or managed admin identity provider before exposing admin login publicly.
- Run `npm test` and security review before production.
