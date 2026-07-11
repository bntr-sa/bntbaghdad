# Bnt Baghdad Salon — Site + Store + App

A bilingual (Arabic-first) salon site with:
- Services, About, Contact (WhatsApp + Google Maps)
- A product storefront with **WhatsApp ordering** (no cart/payment)
- An **admin panel** to add/delete products (built into the same page)
- A **PWA** (installable app: `manifest.json`, `sw.js`, icons)
- **Static site** — hosted free on **GitHub Pages**
- **Firebase** is used only for product storage (Firestore) and admin login (Authentication)

Everything here is **free**. The only accounts you need (no payment) are **GitHub**
and **Firebase** — I can't create accounts in your name.

---

## 1. Set up Firebase (product storage + admin login)

The storefront is static, so product data lives in **Firestore** and the admin logs in
with **Firebase Authentication**.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database → Create** (start in **Production** mode).
3. **Build → Authentication → Sign-in method → Email/Password** and enable it.
4. **Authentication → Users → Add user** and create your admin account
   (e.g. `you@example.com` + a password). Remember this email.
5. **Build → Firestore → Rules** and paste the contents of **`firestore.rules`** from
   this repo, then **Publish**. Replace `admin@example.com` with the admin email
   from step 4.

   > ⚠️ **This is the #1 reason "added products don't show up."** In Production
   > mode Firebase starts with rules that deny *all* writes, so the add silently
   > fails. Publishing `firestore.rules` (and matching the email) fixes it.

6. In **`public/index.html`**, near the bottom of the `<script type="module">`, set
   the two constants to match:
   ```js
   const STORE_PHONE = "9647735128002";   // your WhatsApp number
   const ADMIN_EMAIL = "admin@example.com"; // MUST equal the email in step 4 + firestore.rules
   ```
   The Firebase config (`apiKey`, `authDomain`, `projectId`, `appId`, …) is already
   filled in from your web-app settings, and the Firebase SDK is loaded as ES modules
   straight from the CDN — **no build step required**.

---

## 2. Push the code to GitHub (free)

1. Make a free account at github.com.
2. Create a **new repository** named `bnt-baghdad` (must match this name for the
   links below).
3. In this folder, run:
   ```bash
   git remote add origin https://github.com/YOURUSERNAME/bnt-baghdad.git
   git branch -M main
   git push -u origin main
   # Publish the SITE (public/*) to the ROOT of the gh-pages branch.
   # GitHub Pages serves the branch root, so the files must NOT sit in public/.
   git subtree push --prefix public origin gh-pages
   ```
   (`gh-pages` holds the static site that GitHub Pages serves.)

---

## 3. Deploy on GitHub Pages (free)

1. On GitHub, open the repo **Settings → Pages**.
2. **Source:** Deploy from a branch → **`gh-pages`** → **`/(root)`** → Save.
3. Wait ~1–2 minutes. Your site is live at
   **`https://<your-user>.github.io/bnt-baghdad/`**.
4. Tap **Admin** (top or bottom nav) → sign in with your admin email → add products.
   They appear on the storefront automatically.

> Want a custom domain? Add it under **Settings → Pages → Custom domain**.

---

## How to add / manage products

1. Open the site and tap **Admin** (🔐) in the nav.
2. Sign in with the admin email you created in Firebase.
3. Scroll to **Manage Products**, fill the form, and **Add product**.
   - Products are written to Firestore and instantly show on the storefront.
   - Each product has a **Delete** button (visible only while you're signed in).

If an add fails, the form shows the exact Firebase error. A
`permission-denied` / `Missing or insufficient permissions` message means your
**Firestore rules** (step 5) aren't published or the **admin email** doesn't match
between `firestore.rules`, `ADMIN_EMAIL` in `index.html`, and your Firebase user.

---

## Run locally

Firebase needs an **http** origin (not `file://`), so serve the `public/` folder:

```bash
cd public
npx serve          # or: python -m http.server 8000
```

Then open the printed URL. Fill in `STORE_PHONE` / `ADMIN_EMAIL` in
`public/index.html` first so products load. Re-run `node make-icons.js` only if you
want to regenerate the app icons.

---

## Project layout

```
bnt-baghdad/
├── README.md
├── firestore.rules      # Firestore security rules (public read, admin write)
├── make-icons.js        # regenerates the PWA icons
└── public/
    ├── index.html       # the whole site: storefront + login + admin (one file)
    ├── manifest.json    # PWA manifest
    ├── sw.js            # service worker (app install / offline)
    ├── favicon.svg
    └── icon-*.png       # PWA icons
```

Hosting is **GitHub Pages only** — there is no server and no Firebase Hosting config.
