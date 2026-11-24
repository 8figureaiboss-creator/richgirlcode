# Holistic Innovations LLC: Website

Next.js 15 (App Router) + Tailwind CSS v4 + Framer Motion site for Holistic Innovations LLC,
Jamie Madeline Wilson's postpartum, newborn care, lactation and doula mentorship practice.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel             # preview deploy (set the project Root Directory to `holistic-innovations`)
vercel --prod      # production
```

Then add the custom domain `holisticinnovationsllc.com` under Project → Settings → Domains.

### Connect the inquiry form

The contact form and the guide waitlist post to `/api/inquiry`, which forwards each submission as JSON
to `INQUIRY_WEBHOOK_URL`. Until that variable is set, the form tells visitors to DM on Instagram instead.

1. Create a webhook (for example a Zapier "Catch Hook" that emails you or adds a Google Sheet row).
2. In Vercel → Settings → Environment Variables, add `INQUIRY_WEBHOOK_URL`.
3. Redeploy.

## Editing content

All copy, services, prices, FAQs and guide titles live in `src/lib/content.ts`.
Brand colors are in `src/app/globals.css` (`--color-lotus`, `--color-teal`, `--color-blush`).

Rates marked "pending final confirmation" in the brand overview (lactation, postpartum recovery,
meal support, mentorship) should be confirmed before launch.
