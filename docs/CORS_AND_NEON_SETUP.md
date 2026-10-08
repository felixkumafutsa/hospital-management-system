# CORS, Vercel, and Neon setup

## Why the browser reports CORS errors

- The production API only allows browser origins listed in `CORS_ORIGIN`. The current Docker `.env` has it blank, so requests from a different origin receive no CORS permission.
- The Vercel frontend defaults to `/api/v1`. The frontend project's catch-all serves `index.html` for that path; it does not forward requests to the separately deployed API. Vercel needs `VITE_API_URL` at frontend build time.
- Do not set `Access-Control-Allow-Origin: *`. This API uses credentialed requests; configure exact origins instead.

## Docker

The provided Compose deployment serves both the SPA and API through Nginx on one origin. Leave `VITE_API_URL` blank to use the `/api/v1` Nginx proxy. Same-origin requests do not require CORS.

If the frontend is intentionally served from a different origin, set these in the ignored `.env` file:

```dotenv
VITE_API_URL=https://api.example.com/api/v1
CORS_ORIGIN=https://clinic.example.com
```

`CORS_ORIGIN` accepts a comma-separated list of exact origins. Include the scheme and hostname (and port when nonstandard), with no path. A trailing slash is normalized. After changing `VITE_API_URL`, rebuild the web image; after changing `CORS_ORIGIN`, recreate the API container:

```powershell
docker compose build web api
docker compose up -d api web
```

For the standard same-origin setup, the usual fix is rebuilding the images from the current source and opening the frontend through the Nginx URL, not opening the API on port 4000 directly.

## Vercel

Use two Vercel projects connected to this repository. Set the web project's Root Directory to `apps/web` and the API project's Root Directory to `apps/api`. Enable **Include source files outside of the Root Directory** for both because each imports shared code from `packages/types`.

Set these project environment variables, then redeploy both projects:

| Project | Variable | Value |
| --- | --- | --- |
| Web | `VITE_API_URL` | `https://betterlife-api.vercel.app/api/v1` |
| API | `DATABASE_URL` | The rotated Neon pooled connection string |
| API | `DATABASE_CONNECTION_LIMIT` | `1` |
| API | `JWT_PRIVATE_KEY` | A new random secret of at least 32 bytes |
| API | `CORS_ORIGIN` | `https://betterlife-web.vercel.app` |

The API allows `https://betterlife-web.vercel.app` by default when deployed on Vercel and `CORS_ORIGIN` is unset. The frontend also falls back to this API URL on that production hostname, but set `VITE_API_URL` explicitly in the web project for Production and Preview. Set `CORS_ORIGIN` in the API project and add any required preview origins as comma-separated exact origins. Do not include URL paths. Vite embeds `VITE_API_URL` into the built JavaScript, so changing it requires a new frontend deployment. Keep database credentials and JWT secrets only in the API project's encrypted environment settings.

## Reconcile the Neon schema safely

The Neon pooler credential was pasted into chat. Rotate the Neon role password and replace `DATABASE_URL` with the new pooled URL before using the database. Do not commit that URL or place it in frontend variables.

Because the database schema has been edited outside the checked-in Prisma migration chain, do not run `prisma db push`, `prisma migrate reset`, or `prisma migrate deploy` against the existing Neon database yet. First create a Neon branch or backup. Then compare the branch's schema and `_prisma_migrations` table with `apps/api/prisma/schema.prisma` and the checked-in migrations. Reconcile drift on the branch and verify the application against it before applying reviewed migrations to production. Vercel does not run the migration chain automatically.

## Check a browser preflight

Replace the hosts with the actual API and frontend origins. A successful response includes `Access-Control-Allow-Origin` matching the frontend origin and `Access-Control-Allow-Credentials: true`:

```powershell
curl.exe -i -X OPTIONS "https://<API-project-domain>/api/v1/auth/login" `
  -H "Origin: https://<web-project-domain>" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: authorization,content-type"
```

In browser DevTools, check the request's **Request URL** and **Origin**. If the request URL is the web project's `/api/v1` URL instead of the API project URL, the frontend was built without the correct `VITE_API_URL`.
