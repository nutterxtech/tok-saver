# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### TikTok Downloader (`artifacts/tiktok-downloader`)
- **Preview path**: `/`
- **Purpose**: TikTok watermark-free video downloader with subscription paywall
- **Features**:
  - User registration (name, email, phone, password) — phone enforces uniqueness to prevent account farming
  - JWT authentication (stored in localStorage)
  - 1 free download per user (configurable by admin)
  - KSH 49/month subscription via Paylor payment gateway (https://paylor.webnixke.com/)
  - Admin dashboard at `/?admin=true` protected by admin key
  - Admin can configure: subscription price, Paylor API key/URL, admin key, free download limit
  - TikTok video fetching via tikwm.com API (no watermark)

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- **Routes**:
  - `POST /api/auth/register` — register with name/email/phone/password
  - `POST /api/auth/login` — login with email/password
  - `POST /api/auth/logout` — logout
  - `GET /api/auth/me` — get current user (requires auth)
  - `POST /api/download` — download TikTok video (requires auth, enforces quota)
  - `GET /api/downloads/history` — download history (requires auth)
  - `GET /api/subscription/status` — subscription status (requires auth)
  - `POST /api/subscription/subscribe` — initiate Paylor payment (requires auth)
  - `POST /api/subscription/callback` — Paylor webhook callback
  - `GET /api/admin/users` — list all users (requires admin key)
  - `GET /api/admin/settings` — get admin settings (requires admin key)
  - `PUT /api/admin/settings` — update admin settings (requires admin key)
  - `GET /api/admin/stats` — dashboard stats (requires admin key)

## Database Schema

- `users` — id, name, email (unique), phone (unique), password_hash, created_at
- `subscriptions` — id, user_id, status, amount_paid, currency, payment_reference, expires_at, created_at
- `downloads` — id, user_id, url, downloaded_at
- `app_settings` — id, key (unique), value, updated_at

## Default Admin Settings

- **Admin key**: `admin123` (change via admin dashboard)
- **Subscription price**: KSH 49/month
- **Free downloads**: 1 per user
- **Paylor URL**: https://paylor.webnixke.com/

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
