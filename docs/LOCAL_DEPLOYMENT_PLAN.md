# BetterLife Local Deployment Plan

## 1. Current architecture

BetterLife is an npm-workspaces monorepo with a React 19 / Vite 6 single-page application, an Express 5 / TypeScript API, shared TypeScript/Zod types, Prisma ORM, and PostgreSQL. The browser calls REST endpoints under `/api/v1`; the API uses Prisma to access PostgreSQL.

```text
Browser -> React/Vite SPA -> Express REST API -> Prisma -> PostgreSQL
```

The API uses JWT access tokens and an HTTP-only refresh-token cookie. Authorization is implemented in API middleware and route handlers, with inconsistent role enforcement across modules. There is no Supabase Auth, Storage, realtime, or Edge Function client in the application. Supabase is currently the managed PostgreSQL host only. Patient, financial, clinical, staff, and audit data live in PostgreSQL. The inspected application has no server-side patient-file upload or generated-file persistence path; browser exports are downloads. No active email, SMS, Redis, WebSocket, or scheduled-job integration was found. Google Fonts is currently the only external browser asset request.

## 2. Target architecture

Laptop 1 runs Docker Desktop and Compose. Nginx serves the compiled SPA over HTTPS and proxies `/api/` to the API on a private Docker network. The API reaches PostgreSQL on that network. Only Nginx is published to the MiFi LAN. PostgreSQL and the API have no host-published ports.

```text
Laptop 2 browser --HTTPS--> Airtel MiFi --> Laptop 1:443 / Nginx
                                              |-- SPA files
                                              |-- /api/* --> API:4000
                                                               |--> PostgreSQL:5432
                                              Docker private network
PostgreSQL data --> named Docker volume; dumps --> Laptop 1 host backup folder
```

The deployed SPA uses the same-origin `/api/v1` path, so normal operation does not require Internet access. A private/self-signed TLS certificate must include the stable server IP or local DNS name as a Subject Alternative Name; the certificate authority must be trusted by client browsers. Do not use plain HTTP for patient traffic or refresh-token cookies.

## 3. Required changes

1. Replace the frontend's hardcoded Vercel fallback with same-origin API routing in production while retaining localhost API access for Vite development.
2. Add multi-stage API and web/Nginx images, an internal Compose network, PostgreSQL persistence, health checks, and a migration one-shot service.
3. Require an operator-provided strong JWT secret in production; remove the weak source-code fallback.
4. Restrict CORS to explicitly configured origins and remove middleware that echoes arbitrary origins. Same-origin browser traffic through Nginx does not need cross-origin access.
5. Set refresh-cookie flags for the HTTPS local deployment and make clearing use matching flags.
6. Make the API health endpoint verify PostgreSQL connectivity.
7. Add environment and operational documentation plus PowerShell backup/restore commands.
8. Replace the tracked `.env.example` secret with placeholders. Its previous database credential must be rotated at its provider; removing it from the current file does not remove it from Git history.
9. Keep destructive seed scripts out of startup. They delete existing application rows and must never run against a real database.

## 4. Docker services

| Service | Build/image | Purpose | LAN port | Internal port | Data / dependencies | Health |
| --- | --- | --- | --- | --- | --- | --- |
| `db` | Official PostgreSQL 16 image | Relational persistence | None | 5432 | Named `postgres_data` volume; credentials from ignored `.env` | `pg_isready` |
| `migrate` | API Dockerfile migration target | Applies committed Prisma migrations once during Compose startup | None | None | Waits for healthy `db`; exits successfully before API starts | Exit status |
| `api` | Multi-stage API Dockerfile | Express API and Prisma client | None | 4000 | Waits for successful migration and healthy DB; no persistent local files found | Calls `/api/v1/health`, which checks DB |
| `web` | Vite build in Nginx image | Static SPA and HTTPS reverse proxy | 443 | 443 | TLS keypair mounted read-only from `deploy/tls` | Nginx request health check |

Compose publishes only TCP 443. No database or API port is exposed to the MiFi. A port 80 redirect is intentionally omitted; add it only if the deployment operator needs it and can ensure it redirects to HTTPS without serving application data over HTTP.

## 5. Persistent storage

* PostgreSQL data: Compose named volume `postgres_data`. Container recreation and image updates do not remove it. `docker compose down -v` would remove it and must not be used for routine operation.
* Backups: host directory `backups/` on Laptop 1, populated by `scripts/Backup-Database.ps1`; copy verified dumps to an encrypted external drive stored separately.
* TLS: host directory `deploy/tls/`, mounted read-only. Private keys are local deployment secrets and must not be committed or backed up in an unencrypted shared location.
* Uploaded files/generated documents: none are written by the inspected application. If server-side uploads are added later, they need a separate durable volume and backup coverage before enabling the feature.

## 6. Environment variables

Create `.env` from `.env.example` and fill it locally. Compose reads the file for interpolation; it is ignored by Git. Examples below are placeholders only.

| Variable | Purpose | Required | Example | Secret |
| --- | --- | --- | --- | --- |
| `POSTGRES_DB` | Local database name | Yes | `betterlife` | No |
| `POSTGRES_USER` | Database login | Yes | `betterlife_app` | No |
| `POSTGRES_PASSWORD` | PostgreSQL login password | Yes | Generated random value | Yes |
| `DATABASE_URL` | Prisma connection from API/migration container | Yes | `postgresql://betterlife_app:<password>@db:5432/betterlife?schema=public` | Yes |
| `JWT_PRIVATE_KEY` | HS256 signing and verification key | Yes | Generated random value of at least 32 bytes | Yes |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access-token lifetime | Yes | `15m` | No |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh-token lifetime | Yes | `7d` | No |
| `NODE_ENV` | API runtime mode | Yes | `production` | No |
| `PORT` | API container listener | Yes | `4000` | No |
| `HTTPS_PORT` | Laptop 1 host port for the HTTPS proxy | Optional | `443` | No |
| `LOG_LEVEL` | API logging threshold | Optional | `info` | No |
| `CORS_ORIGIN` | Comma-separated exact browser origins for cross-origin requests; trailing slashes are normalized | Optional for same-origin proxying | `https://192.168.0.10` | No |
| `VITE_API_URL` | Frontend API base URL, embedded during the Vite build | Optional for the same-origin Nginx proxy | `https://api.example.com/api/v1` | No |
| `DATABASE_CONNECTION_LIMIT` | Prisma client pool size per API instance | Optional | `5` locally, `1` on Vercel | No |

The API must fail to start if its production signing secret is missing or weak. Do not use demo seed credentials in a live clinic.

## 7. Network topology

1. Connect both laptops to the same Airtel MiFi Wi-Fi and disable client/AP isolation if enabled.
2. Prefer a DHCP reservation for Laptop 1 in the MiFi admin UI. If unavailable, inspect its subnet, gateway, and DHCP pool; assign Laptop 1 an unused static address outside that pool and verify there is no address conflict. Keep Laptop 2 on DHCP.
3. Generate the TLS certificate with Laptop 1's stable IP or local DNS name in its SAN. Trust the issuing certificate authority on Laptop 2.
4. Allow inbound TCP 443 in Windows Defender Firewall on the Private profile, scoped to the local subnet. Do not open 4000 or 5432.
5. Laptop 2 opens `https://<server-IP>/` (or the configured local DNS name). It needs only a supported browser.

The Docker published port binds to host interfaces, so the firewall is the LAN boundary. Restrict it to the MiFi subnet. Do not configure router port forwarding to the Internet.

## 8. Startup sequence

Start Docker Desktop with Linux containers, then run `docker compose up -d --build`. Compose waits for PostgreSQL health, applies `prisma migrate deploy` in the one-shot migration service, starts the API after migration success, and then starts Nginx. Do not run the demo seed or `prisma migrate reset` as part of startup.

## 9. Database migration and Supabase transition

Supabase is only the current PostgreSQL host; no Supabase application services need replacement. Local PostgreSQL is compatible with the Prisma datasource. For a new, empty local database, Compose applies the checked-in migration chain using `prisma migrate deploy` and does not seed or delete application data.

Moving existing clinic data is a separate controlled migration. First rotate the exposed Supabase credential, make and verify a provider-side backup, record the source `_prisma_migrations` state, and take a PostgreSQL dump using an appropriate direct/session connection. Restore the dump to a separate local staging database, inspect schema and migration-history differences, and reconcile every migration before switching any client. Several checked-in migrations can drop or require remapping existing visit, maternity, and invoice data, so the dump must not be blindly advanced through them. This repository audit did not connect to the remote database or inspect its live migration state; production data migration remains a release blocker until that dry run succeeds.

The current worktree also contains untracked source modules and Prisma migration directories. A local Docker build sees those files, but a Git clone or release archive will not. Track and review the exact tested source and every required migration before building from a clean checkout.

## 10. Backup and restore

Create a custom-format PostgreSQL dump with the supplied PowerShell script and verify that it is non-empty. Periodically test `pg_restore --list` and restore to a separate disposable database. Keep multiple dated copies on Laptop 1 and copy them to an encrypted external drive; a Docker volume alone is not a backup. The restore procedure stops application writes, restores a selected dump into a prepared database, verifies migrations and representative records, then brings the application back online. Never restore over the only copy of live data.

## 11. Upgrade strategy

1. Record the deployed image/source version and create/verify a database backup.
2. Review new Prisma migration SQL for destructive operations and test it against a restored staging copy.
3. Deploy the reviewed source and images; Compose runs `migrate deploy` before the API starts.
4. Verify health, login, and clinic workflows before returning the system to staff.
5. Keep the previous image and database dump until verification is complete. Do not remove the persistent volume when updating containers.

## 12. Audit findings and release limitations

The source includes permissive cross-origin behavior, weak JWT fallback keys, PHI in some debug logs, public module diagnostic routes, inconsistent route-level authorization, and seed scripts that delete records. The implementation addresses the deployment-specific CORS/JWT/health/cookie issues and removes development-only diagnostics from production. It does not constitute a full authorization or clinical privacy review; route-level access policy and PHI logging still need a separate security remediation before real patient data is served.

No automated Internet-dependent API integrations were found. The app's core API and database can run locally after the frontend uses the reverse proxy. Google Fonts is cosmetic and has CSS fallbacks; it can be unavailable offline without blocking core workflows. Docker Desktop/Compose must already be installed and running on Laptop 1. A live LAN client, actual clinic login, representative workflows, migration on a clean PostgreSQL instance, and backup/restore must be tested before any production-readiness claim. The current Windows sandbox cannot verify MiFi, firewall, BIOS virtualization, client-laptop access, or the live Supabase migration state.
