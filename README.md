# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website
generator.

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

Push to the master branch, GitHub will publish the updated version to the `gb-pages` branch and in
that way deploy it automatically.

### Error logging and email alerts

Broken links and in-site 404 pages are recorded in PostgreSQL and can trigger email alerts via
[Resend](https://resend.com/).

1. Run `scripts/errors-schema.sql` against the same database as analytics (`DATABASE_URL`).
2. Deploy the site on Vercel (the `/api/errors` endpoint does not run on GitHub Pages alone).
3. Set these Vercel environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (same as analytics) |
| `RESEND_API_KEY` | Resend API key |
| `ERROR_ALERT_TO` | Inbox that receives alerts |
| `ERROR_ALERT_FROM` | Verified sender address in Resend |
| `ERROR_EMAIL_ENABLED` | Optional; set to `false` to disable emails |
| `ERRORS_ALLOWED_ORIGINS` | Optional CORS allowlist (defaults to `ANALYTICS_ALLOWED_ORIGINS`) |

**What triggers an alert:** the first occurrence of each `failed_url` + `error_type` within 24
hours sends one email. Later duplicates are stored in the `errors` table but do not send another
email.

**What is recorded:** visiting a non-existent doc route (`page_not_found`), clicking an external
link that returns HTTP 4xx/5xx, or clicking a same-origin asset link (e.g. `/pdf/...`) that fails.
