# External Services - Ajoti Frontend

Configuration and setup for every external service and environment dependency across the two active frontend apps.

**Status legend:** ✅ Integrated · 🔲 Planned · ⚠️ Dev/staging only

---

## Table of Contents

1. [Backend API](#1-backend-api)
2. [Google OAuth](#2-google-oauth)
3. [Mono Prove Widget](#3-mono-prove-widget)
4. [Hosting - Dokploy / Static](#4-hosting--dokploy--static)
5. [Environment Configuration](#5-environment-configuration)
6. [Build & Deployment Checklist](#6-build--deployment-checklist)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Backend API

### Both Apps ✅

**Purpose**: Both frontend apps talk exclusively to the Ajoti backend REST API. No app calls third-party services directly (payments, KYC, etc. are all mediated by the backend).

**Environment variable** (all apps):

```bash
VITE_API_BASE_URL=https://api.ajoti.com   # production
VITE_API_BASE_URL=http://localhost:3001   # local dev
```

**Notes**:
- All API calls are centralised in `src/utils/api.ts` in each app
- JWT tokens are stored in `localStorage` and attached as `Authorization: Bearer <token>` headers
- Token refresh is handled automatically in the API utility

---

## 2. Google OAuth

### Retired pending secure integration

The retired `apps/user` UI exposed a Google button, but its implementation decoded the
Google credential locally without exchanging it for an Ajoti access/refresh-token session.
It is intentionally not present in the canonical customer app. Reintroducing it requires a
server-validated `POST /api/auth/google` exchange and the normal Ajoti role checks.

---

## 3. Mono Prove Widget

### Customer App ✅

**Purpose**: In-app KYC identity verification (BVN/NIN). The Mono Prove widget is loaded via a `<script>` tag and opened with a session token obtained from the backend.

**Setup**: No frontend API key needed - the backend initiates the session and returns a `sessionToken`. The frontend opens the widget with that token.

**How it works**:
1. User taps "Verify Identity" → frontend calls `POST /api/kyc/prove/session`
2. Backend returns `{ sessionToken, monoPublicKey }`
3. Frontend opens the Mono Prove widget with those values
4. User completes verification → Mono sends a webhook to the backend
5. Backend updates KYC status → frontend polls or receives a notification

**Notes**:
- The Mono Prove script is loaded lazily when the KYC page mounts
- No `VITE_MONO_*` env vars are needed in the frontend

---

## 4. Hosting - Dokploy / Static

### Production ✅

**Purpose**: Each app's `dist/` folder is served as a static site on its subdomain.

| App | Domain |
|-----|--------|
| Customer | `admin.ajoti.com` |
| Super Admin | `super-admin.ajoti.com` |

**Deployment**: Each active app is built with `pnpm --filter <app> build` and the output
(`dist/`) is served by Nginx (configured in Dokploy). Configure `user.ajoti.com` as an
HTTP redirect to `https://admin.ajoti.com` before removing it from backend CORS.

---

## 5. Environment Configuration

### Development

Create `.env.local` in each app directory (these are gitignored):

**`apps/admin/.env.local`**:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

**`apps/super-admin/.env.local`**:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### Staging

```bash
VITE_API_BASE_URL=https://api-staging.ajoti.com
```

### Production

```bash
VITE_API_BASE_URL=https://api.ajoti.com
```

---

## 6. Build & Deployment Checklist

### Before building

- [ ] `VITE_API_BASE_URL` points to the correct environment's API
- [ ] No hardcoded `localhost` URLs in `api.ts` files
- [ ] No `console.log` statements with sensitive data

### Build

```bash
pnpm --filter ajoti-admin build
pnpm --filter ajoti-super-admin build
```

### After deploying

- [ ] `user.ajoti.com` redirects to `admin.ajoti.com`
- [ ] `admin.ajoti.com` accepts MEMBER and CIRCLE_ADMIN accounts
- [ ] `super-admin.ajoti.com` loads and can log in as superadmin
- [ ] `VITE_API_BASE_URL` is reachable from the browser (no CORS errors)
- [ ] KYC widget opens correctly

---

## 7. Troubleshooting

### CORS error on API calls

- During the domain transition, keep both customer origins in backend `CORS_ORIGIN`:
  ```
  CORS_ORIGIN=https://user.ajoti.com,https://admin.ajoti.com,https://super-admin.ajoti.com
  ```

### API calls failing in production but working locally

- Confirm `VITE_API_BASE_URL` is set to the production backend URL in Dokploy's environment variable settings
- Vite bakes env vars in at build time - rebuilding after changing the variable is required

### KYC widget doesn't open

- The Mono Prove script requires a valid session token from the backend
- Check that the backend's `MONO_SECRET_KEY` is a live key (not a test key) in production
- Check browser console for script load errors

### White screen after deploy

- Run `pnpm --filter <app> build` locally to confirm the build succeeds
- Check Dokploy build logs for TypeScript or import errors
