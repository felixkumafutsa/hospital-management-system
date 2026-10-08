# BetterLife LAN Deployment Runbook

## Laptop 1 preparation

Install Docker Desktop with Linux containers and Docker Compose v2. Use the WSL2 backend where available. Initial image builds and package installation need Internet access; day-to-day application use does not. Confirm Docker Desktop is running with `docker info` and `docker compose version`.

Connect Laptop 1 to the Airtel MiFi. Reserve its DHCP address in the MiFi settings if supported. Otherwise inspect the subnet and DHCP pool, choose an unused static address outside the pool, and confirm the address is not already in use. Turn off Wi-Fi client isolation so Laptop 2 can reach the server.

From the repository root in PowerShell:

```powershell
.\scripts\Initialize-LocalDeployment.ps1 -CorsOrigin https://192.168.0.10
.\scripts\New-LocalTlsCertificate.ps1 -ServerAddress 192.168.0.10
```

The helper files are PowerShell scripts. If Windows execution policy blocks them, have the clinic administrator approve or sign the scripts or provide a permitted execution method; do not weaken a managed machine-wide policy to continue deployment.

Replace `192.168.0.10` with Laptop 1's stable LAN address or local DNS name. The first command creates an ignored `.env` with unique database and JWT secrets and does not print them. The second creates the HTTPS server certificate and a local certificate authority, then assigns the server key to the unprivileged Nginx UID with read-only permissions. Keep `deploy\tls\ca-private\ca.key.pem` private. Give Laptop 2 only `deploy\tls\client\betterlife-local-ca.crt`.

Allow HTTPS from the MiFi subnet in an elevated PowerShell window on Laptop 1. Windows must classify the Wi-Fi connection as Private. Restrict `LocalSubnet` further to the MiFi's actual subnet if Windows resolves it too broadly:

```powershell
New-NetFirewallRule -DisplayName 'BetterLife HMS HTTPS' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -Profile Private -RemoteAddress LocalSubnet
```

## Build and start

From the repository root:

```powershell
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail 100
```

Compose starts PostgreSQL, waits for its health check, applies the checked-in Prisma migrations with `prisma migrate deploy`, starts the API, and then starts Nginx. Do not run `prisma migrate reset`, `docker compose down -v`, or the general seed command against clinic data.

On a new, empty database only, create the first administrator interactively:

```powershell
docker compose --profile tools run --rm -it bootstrap-admin
```

This refuses to run if an active administrator already exists, creates the role/permission setup without deleting records, and prompts for a new password without displaying it. If restoring clinic records that already contain staff, do not bootstrap another account.

Verify the local health endpoint after trusting the local CA:

```powershell
curl.exe https://192.168.0.10/api/v1/health
```

It should return HTTP 200 and report `database: connected`. If the CA is not trusted yet, the browser displays a certificate warning; install and trust the CA instead of teaching staff to bypass the warning.

## Laptop 2

Copy the public CA file to Laptop 2 using an administrator-approved method. In PowerShell, install it for the current Windows user:

```powershell
Import-Certificate -FilePath .\betterlife-local-ca.crt -CertStoreLocation Cert:\CurrentUser\Root
```

Open `https://192.168.0.10/` using the exact stable address in the certificate. The client laptop needs only a current browser and the trusted CA. No Docker, Node.js, or database software is required.

## Daily operation

```powershell
docker compose ps
docker compose logs -f api web db
docker compose restart api web
docker compose stop
docker compose up -d
```

Create and verify a database backup before updates and at the end of each work day:

```powershell
.\scripts\Backup-Database.ps1
```

The script writes a dated custom-format dump in `backups\` and verifies it with `pg_restore --list`. Copy verified backups to an encrypted external drive on a regular schedule and keep that drive disconnected when not in use. Store the database password, JWT key, certificate-authority private key, and database backups with access limited to authorized administrators.

## Restore procedure

Restore to a new database first. Replace the filename below with a verified dump in `backups\`:

```powershell
$dump = 'betterlife-YYYYMMDD-HHMMSS.dump' # replace with the verified backup filename
docker compose exec -T db createdb --username betterlife_app betterlife_restore
docker compose --profile tools run --rm backup pg_restore --host db --username betterlife_app --dbname betterlife_restore --no-owner --exit-on-error "/backups/$dump"
```

Verify the staging database and sample records with the authorized administrator before switching service. To switch after approval, take a fresh backup and stop API writes. The first command preserves the current database under another name; the second promotes the restored copy:

```powershell
docker compose stop api web
docker compose exec -T db psql --username betterlife_app --dbname postgres --set ON_ERROR_STOP=1 --command 'ALTER DATABASE betterlife RENAME TO betterlife_before_restore'
docker compose exec -T db psql --username betterlife_app --dbname postgres --set ON_ERROR_STOP=1 --command 'ALTER DATABASE betterlife_restore RENAME TO betterlife'
docker compose up -d
docker compose ps
```

Preserve `betterlife_before_restore` until the restored system has passed the clinic's workflow checks. If Laptop 1 fails, restore the latest verified external backup and the separately protected `.env` / certificate materials to the replacement server; reissue the TLS certificate if the CA private key was not securely retained.

## Upgrade procedure

Review migration SQL and test it against a restored staging copy first. Create and verify a backup, update the tracked application source, then run:

```powershell
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail 100
```

The existing `postgres_data` volume is retained. Never use `docker compose down -v` for an application update.

The current development worktree has untracked source modules and Prisma migrations. Include and review them in the release before building from a clone; a clone built from the existing tracked files alone would omit part of the current schema and application modules.

## Existing Supabase data

Do not point the local deployment at the current Supabase URL. Rotate the credential exposed by the tracked sample configuration before any dump operation. Make a provider-side backup and restore a verified dump to a separate local staging database. Compare the actual `_prisma_migrations` table and schema to the repository migrations. Existing migrations include operations that can drop or require remapping visit, maternity, and invoice fields, so resolve these against the staging copy before switching. The migration state of the live source has not been inspected; do not run the local migration chain against imported clinic data until this reconciliation is complete.

## Operations limitations

The first `docker compose build` requires Internet access for container images and npm packages. The running HMS does not need Internet for its API/database; Google Fonts remains a cosmetic external request and falls back to local fonts. This deployment has not been tested across the MiFi from Laptop 2 yet. A separate authorization review and remediation of patient-identifying debug logs are still needed before real clinic data is served.
