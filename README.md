# Clarityboards — Prototype Setup Guide

> Your life, clearly organized. · clarityboards.com

This guide takes you from zero to a live, shareable prototype with real data persistence in about 30 minutes.

---

## What you're building

A full Next.js app with:
- Google OAuth sign-in
- 5 boards (EventBoard, StudyBoard, ActivityBoard, CareerBoard, TaskBoard)
- Real database via Supabase (items persist across sessions and devices)
- 13 sample items auto-loaded for new testers
- Placeholder board-sharing UI

---

## Step 1 — Supabase setup (~10 min)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** → name it `clarityboards-prototype`
3. Choose **East US** region and set a database password (save it)
4. Once created, go to **SQL Editor → New Query**
5. Paste the entire contents of `lib/schema.sql` and click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public key**

---

## Step 2 — Google OAuth setup (~10 min)

### In Supabase:
1. Go to **Authentication → Providers → Google**
2. Toggle Google **on**
3. Copy the **Callback URL** shown (you'll need this in Google Cloud)

### In Google Cloud Console:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project (or create one called `Clarityboards`)
3. **APIs & Services → Credentials → + Create Credentials → OAuth Client ID**
4. Application type: **Web application**
5. Name: `Clarityboards Prototype`
6. Under **Authorized redirect URIs** → add the Supabase callback URL from above
7. Also add: `http://localhost:3000/auth/callback` (for local testing)
8. Click **Create** → copy the **Client ID** and **Client Secret**

### Back in Supabase:
1. Return to **Authentication → Providers → Google**
2. Paste in your **Client ID** and **Client Secret**
3. Click **Save**

---

## Step 3 — Environment variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase Project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

---

## Step 4 — Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the Clarityboards login page.

---

## Step 5 — Push to GitHub

1. Create a new repo at [github.com/new](https://github.com/new)
   - Name: `clarityboards-prototype`
   - Set to **Private** (recommended for a prototype)
2. In your terminal:

```bash
git init
git add .
git commit -m "Clarityboards prototype — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/clarityboards-prototype.git
git push -u origin main
```

---

## Step 6 — Deploy to Vercel (~5 min)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `clarityboards-prototype` repo
4. Under **Environment Variables**, add all four variables from your `.env.local`
5. Click **Deploy**

Vercel gives you a live URL instantly: `https://clarityboards-prototype.vercel.app`

### Add Vercel URL to Google Cloud:
1. Go back to Google Cloud → your OAuth Client ID
2. Under **Authorized redirect URIs**, add:
   `https://clarityboards-prototype.vercel.app/auth/callback`
3. Also add it in Supabase → Authentication → URL Configuration → **Site URL**

---

## Step 7 — Share with testers

Send testers your Vercel URL. When they sign in with Google for the first time:
- A new account is created automatically
- 13 sample items are pre-loaded across all 5 boards
- All changes they make are saved in real time

---

## Tester feedback tips

Ask testers to try:
- [ ] Adding a new item to any board
- [ ] Checking off tasks on an item
- [ ] RSVPing to an event
- [ ] Clicking "Share board" (note their reaction to the coming-soon screen)
- [ ] Using it on their phone

Key questions to ask after:
1. Did you understand what each board was for without reading any instructions?
2. Which board did you find most useful?
3. Did you try to share a board? Who would you share it with?
4. What was confusing or missing?

---

## File structure

```
clarityboards-app/
├── app/
│   ├── page.tsx              # Login page (Google OAuth)
│   ├── dashboard/page.tsx    # Main dashboard — all boards
│   ├── auth/callback/        # OAuth redirect handler
│   ├── layout.tsx
│   └── globals.css
├── lib/
│   ├── supabase.ts           # Supabase client + types
│   ├── boards.ts             # Board config and colors
│   ├── seeds.ts              # 13 sample items for new users
│   └── schema.sql            # Run this in Supabase SQL editor
├── .env.local.example        # Copy to .env.local and fill in
└── README.md
```

---

## Questions?

hello@clarityboards.com
