# Rakhi Surprise v2 — Backend setup

Do these steps in order. The website itself remains on GitHub Pages.

## Step 1 — Create the Google Sheet logger

1. Create a blank Google Sheet named `Rakhi 2026 Events`.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `google-sheet-logger.gs`.
4. For now, replace `PASTE_YOUR_EMAIL_HERE` with your email address.
5. Leave `ADMIN_PAGE_URL` unchanged for the moment.
6. Save.
7. Deploy → **New deployment** → **Web app**.
8. Execute as: **Me**.
9. Who has access: **Anyone**.
10. Authorize it and copy the Web App URL.

The Apps Script is only a logger/notification endpoint. Shimpi never sees an Apps Script page or banner.

## Step 2 — Create the Cloudflare Worker

1. Create a Cloudflare Worker.
2. Paste `cloudflare-worker.js`.
3. Replace `PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL from Step 1.
4. Create a Cloudflare KV namespace.
5. Bind it to this Worker with the variable name `RAKHI_KV`.
6. Add a Worker secret named `ADMIN_SECRET`. Use a long random value.
7. Deploy the Worker.
8. Copy the Worker URL, for example `https://rakhi-surprise.yourname.workers.dev`.

## Step 3 — Finish the email notification link

Go back to the Apps Script and set:

`ADMIN_PAGE_URL = "https://YOUR-WORKER.workers.dev/admin?secret=YOUR_ADMIN_SECRET"`

Deploy a new version of the Apps Script Web App.

Important: this admin URL is for you only. Never put the secret in GitHub Pages.

## Step 4 — Connect the public website

In `config.js`, set:

`apiEndpoint:"https://YOUR-WORKER.workers.dev"`

Then publish/update the site on GitHub Pages.

## Step 5 — Test end to end

1. Open the GitHub Pages URL on your phone.
2. Complete the experience and select ₹2,001.
3. Check that a `gift_unlocked` row appears in the Google Sheet.
4. Check that you receive the notification email.
5. Open the private admin page from the email.
6. Tap **Payment sent**.
7. Within about 5 seconds, the final screen on the test phone should change to the Hindi confirmation that the gift arrived.

## On Rakhi

1. Send Shimpi only the GitHub Pages link.
2. When your email arrives, send exactly ₹2,001 through UPI.
3. Open the private admin page.
4. Tap **Payment sent**.
5. Her open page updates automatically.

## Event history

The Sheet records events including page load, start, memories, gift opening, amount attempts, final selection, and payment confirmation.
