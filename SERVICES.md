# External Services - Ajoti Frontend

Configuration and deployment dependencies for the two active frontend applications.

**Status legend:** ✅ Integrated · 🟡 Prepared/planned · ⚠️ Dev/staging only

## Active applications

- `apps/admin`: canonical customer app for both `MEMBER` and `CIRCLE_ADMIN`
- `apps/super-admin`: internal staff application

The retired `apps/user` application should not be deployed or reintroduced.

---

## 1. Backend API ✅

Both active apps communicate with the Ajoti backend REST API.

```bash
VITE_API_BASE_URL=http://localhost:3001
```

Use the environment-specific API domain for staging and production.

### API client organisation

API requests are no longer expected to live in one oversized `api.ts` file.

- both apps use a shared API-client/session-refresh foundation
- domain-specific request modules live under each app's `src/utils/api/` area
- compatibility barrel exports may remain in `src/utils/api.ts`
- member-safe customer screens must not call organiser/staff-only endpoints
- super-admin/staff APIs remain in the super-admin application

JWT access/refresh handling remains centralised through the shared client infrastructure.

---

## 2. Google OAuth

### Retired pending secure integration

The old browser-only Google credential decode was not retained during customer-app consolidation because it did not establish a valid Ajoti access/refresh-token session.

Future Google sign-in requires a server-validated Ajoti auth exchange and the normal role checks.

---

## 3. Mono Lookup / legacy Prove ✅

Purpose: customer KYC verification and staff review.

Current customer flow:

1. customer enters NIN + BVN for Level 1 or a supported government-ID type/number for Level 2
2. customer explicitly consents to the Lookup
3. frontend sends the request to the Ajoti backend
4. backend calls Mono Lookup with server-side credentials
5. backend validates the returned identity against canonical Ajoti account details
6. backend stores a safe verification summary and updates KYC status
7. frontend displays the resulting KYC state

The frontend never receives or stores the Mono Lookup secret.

Current Super Admin flow:

- opening a KYC review displays the evidence already stored by the backend and does not trigger another provider request
- Level 1 and Level 2 evidence are shown separately when available
- sensitive NIN/BVN/document values are masked in expandable evidence
- staff can choose **Run new Lookup** only when another verification is actually needed
- the re-verification modal warns that a provider charge may apply and requires an explicit confirmation
- Level 1 re-verification reuses the encrypted identity details already held by the backend; Level 2 requires staff to enter the government-ID type and number again

Historical Mono Prove records remain supported. The backend may fetch a legacy Prove record by its stored Prove reference, but new Lookup records must not be sent to the Prove customer endpoint.

No long-lived Mono secret should be placed in Vite environment variables.


---

## 4. Target Savings ✅

Target Savings uses the Ajoti backend only; there is no separate third-party frontend integration.

Current frontend behaviour includes:

- My Savings view
- Discover Groups for public group targets
- rule/review step before joining a public group
- shareable Ajoti links for private groups rather than raw invite tokens
- visible API/contribution errors
- manual contributions only; no auto-debit
- maturity/lock messaging

The invite token remains internal to the generated URL and should not be exposed as something the user needs to understand or manually enter.

---

## 5. Hosting / static deployment ✅

Each active app builds to static assets and must be configured with the correct API URL at build time.

Current intended domains:

| App         | Domain                  |
| ----------- | ----------------------- |
| Customer    | `admin.ajoti.com`       |
| Super Admin | `super-admin.ajoti.com` |

If `user.ajoti.com` remains reachable during the migration period, it should redirect to the canonical customer app rather than host a separate implementation.

Build commands:

```bash
pnpm build:admin
pnpm build:super-admin
```

### Netlify monorepo site configuration

The repository contains **two separate Netlify configurations**:

| Netlify site | Package directory (Netlify UI) | Build command | Publish directory |
| --- | --- | --- | --- |
| Customer | `apps/admin` | `pnpm build:admin` | `apps/admin/dist` |
| Super Admin | `apps/super-admin` | `pnpm build:super-admin` | `apps/super-admin/dist` |

For each Netlify site, leave **Base directory** unset (repository root). In **Project configuration → Developer settings → Continuous deployment → Build settings**, configure the matching **Package directory**. Netlify looks for `netlify.toml` inside that directory first, so the Super Admin site uses `apps/super-admin/netlify.toml`. The root `netlify.toml` remains a customer-app fallback for sites without a package-directory setting.

The package-directory selection is a **Netlify UI setting**, not a Git-tracked setting. A repo commit alone cannot correct a Netlify site whose package directory or custom domain points to the wrong app. Confirm that the actual Super Admin hostname (for example, `superadmin.ajoti.com` versus `super-admin.ajoti.com`) is attached to the intended Netlify site before deployment. Rebuild after setting `VITE_API_BASE_URL` for the site.

A real build should be run before promotion; see `AGENTS.md` for the `.tsbuildinfo`/incremental TypeScript caveat.

---

## 6. Environment configuration

### Local

`apps/admin/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

`apps/super-admin/.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:3001
```

### Staging

```bash
VITE_API_BASE_URL=https://staging-api.ajoti.com
```

### Production

```bash
VITE_API_BASE_URL=https://api.ajoti.com
```

Vite environment values are compiled into the build. Changing them requires a rebuild/redeploy.

---

## 7. Sentry / frontend observability 🟡

Frontend Sentry is not active yet.

When enabled, use separate projects/DSNs for:

- customer frontend
- super-admin frontend
- backend API (configured in the backend repository)

Keep staging and production environments distinguishable, start with conservative tracing, and verify a controlled test event before production activation.

Do not add Sentry dependencies without updating the workspace lockfile normally.

---

## 8. Build and deployment checklist

Before build:

- [ ] current branch is the intended deployment branch
- [ ] `VITE_API_BASE_URL` points to the correct environment
- [ ] no hardcoded localhost API URLs
- [ ] no sensitive debug logging
- [ ] customer member screens use member-safe endpoints
- [ ] organiser and staff routes retain their guards

Build:

```bash
pnpm build:admin
pnpm build:super-admin
```

After staging deployment:

- [ ] MEMBER can sign into the canonical customer app
- [ ] CIRCLE_ADMIN can sign in and receives organiser capabilities
- [ ] staff/super-admin can sign into the internal app
- [ ] wallet/transactions load without CORS errors
- [ ] Target Savings individual contribution works
- [ ] Target Savings public discovery/join works
- [ ] private Target Savings invite link works for another account
- [ ] Target Savings contribution errors are visible in the UI
- [ ] super-admin Target Savings oversight loads
- [ ] Level 1 and Level 2 customer Mono Lookup flows complete correctly
- [ ] Super Admin KYC review loads stored evidence without making a new Lookup
- [ ] Super Admin explicit re-verification shows a charge warning before calling Mono
- [ ] `user.ajoti.com` redirects to the canonical customer domain if still in use

---

## 9. Troubleshooting

### CORS errors

Confirm the backend `CORS_ORIGIN` includes the currently deployed customer and super-admin origins. During a domain migration, retain legacy origin support only as long as required.

### API works locally but not after deploy

Confirm `VITE_API_BASE_URL` was present during the actual Vite build. Updating an environment variable after build without rebuilding will not update the bundled URL.

### Private Target Savings invite does not survive authentication

The invite link carries its join context in the customer URL. If authentication redirects strip query state before the user reaches Target Savings, preserve/restore the pending redirect through login/signup before considering the invite flow complete.

### White screen after deployment

Run a clean production build locally and inspect the deployment logs for TypeScript/import failures. Clear stale `.tsbuildinfo` files when validating broad/shared utility changes.

### KYC Lookup fails

Confirm the backend has a valid `MONO_LOOKUP_SECRET_KEY`, the submitted identity data is valid, and the returned identity matches the canonical Ajoti account details. Provider secrets should never be moved into the frontend as a workaround.

For legacy Prove records only, confirm the backend still has the required Prove credentials/webhook configuration. Do not use Prove to re-fetch a new Lookup record.
