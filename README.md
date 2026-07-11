# Bnt Baghdad Salon — Site + Store + App

A bilingual (Arabic-first) salon site with:
- Services, About, Contact (WhatsApp + Google Maps)
- A product **shop** (`products.html`) with a **cart** that checks out on WhatsApp
- **Accounts for everyone** — any visitor can sign up / log in with a username + password
- An **admin panel** (the user `YOUNES`) to add/delete products, including a **photo picker**
- A **PWA** (installable app: `manifest.json`, `sw.js`, icons)
- **Static site** — hosted free on **GitHub Pages**
- **Firebase** is used for login credentials (Authentication) and product storage (Firestore)

Everything here is **free**. The only accounts you need (no payment) are **GitHub**
and **Firebase** — I can't create accounts in your name.

---

## 1. Set up Firebase (products + login)

The storefront is static, so product data lives in **Firestore** and accounts live in
**Firebase Authentication**.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database → Create** (start in **Production** mode).
3. **Build → Authentication → Sign-in method → Email/Password** and enable it.
4. **Authentication → Users → Add user** and create the **admin** account:
   - **Email:** `gsys12759@gmail.com`
   - **Password:** `cat-mouse-dog-shin`
   - (The app recognizes the admin by the username **YOUNES**, so the email above must match.)
5. **Build → Firestore → Rules** and paste the contents of **`firestore.rules`** from this
   repo, then **Publish**. It allows anyone to read products, only `gsys12759@gmail.com` to
   write them, and lets each user manage only their own profile.
6. In **`public/auth.js`** (near the top) the Firebase config (`apiKey`, `authDomain`,
   `projectId`, `appId`, …) is already filled in from your web-app settings, and the
   Firebase SDK is loaded as ES modules straight from the CDN — **no build step required**.

> ⚠️ **This is the #1 reason "added products don't show up."** In Production mode Firebase
> starts with rules that deny *all* writes, so the add silently fails. Publishing
> `firestore.rules` (and creating the `gsys12759@gmail.com` user in step 4) fixes it.

---

## 2. Accounts (anyone can sign up)

Visitors sign up and log in with a **username + password only** — no email needed. Behind the
scenes the app stores each account in Firebase Auth using an auto-generated internal email
(`<username>@bnt.local`), so visitors never see or type an email. The admin username **YOUNES**
maps to the real admin email `gsys12759@gmail.com`. This keeps it simple for customers while
keeping everything in Firebase.

- **Sign up:** open the site, tap **Login** (top-left or in the nav), switch to **Sign up**,
  choose a username + password. Usernames must be unique (letters, numbers, `_` and `-`).
- **Log in:** same **Login** button → enter your username + password.
- **Remember me:** Firebase keeps you signed in automatically. Close the site and reopen it
  (even after a GitHub Pages deploy) and you're still signed in.
- **Admin:** log in as **YOUNES** (email `gsys12759@gmail.com`, password `cat-mouse-dog-shin`) to
  reveal the **Manage Products** panel on the home page.

---

## 3. Push the code to GitHub (free)

1. Make a free account at github.com.
2. Create a **new repository** named `bnt-baghdad` (must match this name for the links below).
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

## 4. Deploy on GitHub Pages (free)

1. On GitHub, open the repo **Settings → Pages**.
2. **Source:** Deploy from a branch → **`gh-pages`** → **`/(root)`** → Save.
3. Wait ~1–2 minutes. Your site is live at
   **`https://<your-user>.github.io/bnt-baghdad/`**.
4. Tap **Login** → sign in as **YOUNES** → add products. They appear on the storefront
   (`products.html`) automatically.

> Want a custom domain? Add it under **Settings → Pages → Custom domain**.

---

## 5. How to add / manage products (admin: YOUNES)

1. Open the site and tap **Login** (top-left or nav).
2. Sign in with username **YOUNES** and password **cat-mouse-dog-shin**.
3. Scroll to **Manage Products**, fill the form, and **Add product**:
   - **Photo:** tap **Choose photo**. On a laptop this opens the file explorer; on a phone
     (iPhone/Android) it opens your **Photos** app / gallery. The photo is saved with the
     product (compressed automatically so it stays small).
   - Products are written to Firestore and instantly show on `products.html`.
   - Each product has a **Delete** button (visible only while you're signed in as YOUNES).

If an add fails, the form shows the exact Firebase error. A `permission-denied` /
`Missing or insufficient permissions` message means your **Firestore rules** (step 5 of
section 1) aren't published or the **admin email** doesn't match (`gsys12759@gmail.com`).

---

## 6. Shopping & checkout (cart → WhatsApp)

1. Open **Products** (nav or the home-page CTA) → `products.html`.
2. Tap **Add to cart** on any product. The cart button (bottom-right) shows the item count.
3. Open the cart, adjust quantities, or remove items. The **Total** updates live.
4. Tap **Checkout on WhatsApp** → a WhatsApp chat opens to **+964 773 512 8002** with a
   **bilingual (Arabic + English)** message listing each item, its price, and the grand total.
   The cart clears after checkout.

The cart lives in the browser (localStorage) on the products page — it is not tied to an
account, so anyone can shop without signing in.

---

## Run locally

Firebase needs an **http** origin (not `file://`), so serve the `public/` folder:

```bash
cd public
npx serve          # or: python -m http.server 8000
```

Then open the printed URL. Create the `gsys12759@gmail.com` admin user in Firebase first so you
can add products. Re-run `node make-icons.js` only if you want to regenerate the app icons.

---

## Project layout

```
bnt-baghdad/
├── README.md
├── firestore.rules      # Firestore security rules (public read, admin write, per-user profiles)
├── make-icons.js        # regenerates the PWA icons
└── public/
    ├── index.html       # the home site: storefront + login/sign-up + admin (one file)
    ├── products.html    # the shop: product grid + cart + WhatsApp checkout
    ├── styles.css       # shared styles for both pages (+ cart styles)
    ├── auth.js          # shared auth (sign-up / login / logout) + photo helper
    ├── products.js      # products page: grid, cart, checkout
    ├── manifest.json    # PWA manifest
    ├── sw.js            # service worker (app install / offline)
    ├── favicon.png
    └── icon-*.png       # PWA icons
```

Hosting is **GitHub Pages only** — there is no server and no Firebase Hosting config.
