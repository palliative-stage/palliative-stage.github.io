# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website
generator. The live site is [cdel-palliative.org.il](https://cdel-palliative.org.il/), deployed on
[Vercel](https://vercel.com/) from the `master` branch. Serverless routes under `/api` (analytics
and error reporting) run only on Vercel.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are
reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static
contents hosting service.

### Deployment

Push to `master`. Vercel builds the site and publishes it. Do not use GitHub Pages for production:
the `/api/*` endpoints do not run there.

### Analytics and error logging

Page views, search, and clicks are stored in PostgreSQL. Broken links and in-site 404 pages are
recorded in the same database and can trigger email alerts via [Resend](https://resend.com/).

1. Run `scripts/analytics-schema.sql` against the database (`DATABASE_URL`).
2. Run `scripts/errors-schema.sql` against the same database.
3. Deploy on Vercel.
4. Set these Vercel environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (analytics and errors) |
| `ANALYTICS_ALLOWED_ORIGINS` | CORS allowlist for `/api/analytics` (production: `https://cdel-palliative.org.il`) |
| `RESEND_API_KEY` | Resend API key |
| `ERROR_ALERT_TO` | Inbox that receives alerts |
| `ERROR_ALERT_FROM` | Verified sender address in Resend |
| `ERROR_EMAIL_ENABLED` | Optional; set to `false` to disable emails |
| `ERRORS_ALLOWED_ORIGINS` | Optional CORS allowlist (defaults to `ANALYTICS_ALLOWED_ORIGINS`) |
| `AUTH_SECRET` | Long random string used to hash staff session tokens |

### Staff login

There is no public registration. Accounts are created by the super-admin.

1. Run `scripts/users-schema.sql` against `DATABASE_URL` (the seed script does this too).
   That script also adds `events.actor_role`, which `/api/analytics` fills from the login cookie.
2. Set `AUTH_SECRET` in Vercel.
3. Create the super-admin once. The password is not stored in the repo:

```
SUPERADMIN_PASSWORD='your-initial-password' node scripts/seed-superadmin.js
```

The default email is `talmonf@gmail.com`. Override it with `SUPERADMIN_EMAIL`.
If that account already exists, the script leaves the password unchanged.
The first sign-in must change the password.

- Super-admin: `/admin/users` (English) to add an Admin or a regular User and set an initial password.
- Admin and super-admin: `/admin/analytics` (Hebrew). The default filter is the last 30 days, with admin activity hidden.
- Regular users can sign in and change their password. They have no staff screens yet.

To exercise the API locally, run `yarn dev:api` and start the site with `DEV_API_PROXY=http://127.0.0.1:3001`.
On PowerShell: `$env:DEV_API_PROXY='http://127.0.0.1:3001'; yarn start`.

**What triggers an alert:** the first occurrence of each `failed_url` + `error_type` within 24
hours sends one email. Later duplicates are stored in the `errors` table but do not send another
email.

**What is recorded:** visiting a non-existent doc route (`page_not_found`), clicking an external
link that returns HTTP 4xx/5xx, or clicking a same-origin asset link (e.g. `/pdf/...`) that fails.
