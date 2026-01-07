# Minify Setup Guide

This guide will walk you through setting up Minify on your local machine with your own Supabase instance.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** installed
- A **Supabase account** ([Sign up for free](https://supabase.com/))
- A **Cloudflare account** for Turnstile ([Sign up for free](https://dash.cloudflare.com/))

---

## 🗂️ Part 1: Clone and Install

### 1. Clone the Repository

```bash
git clone https://github.com/janki2709/minify.git
cd minify
```

### 2. Install Dependencies

```bash
npm install
```

---

## 🔧 Part 2: Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the details:
   - **Name:** Minify (or your preferred name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your location
4. Click **"Create new project"**
5. Wait for the project to finish setting up (takes 1-2 minutes)

### Step 2: Get API Credentials

1. In your project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the left menu
3. Copy these values (you'll need them later):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 3: Disable Email Confirmation

1. Click **"Authentication"** in the sidebar
2. Click **"Providers"** tab
3. Find **"Email"** provider and click **"Edit"**
4. Toggle **OFF** the option: **"Confirm email"**
5. Click **"Save"**

> **Why?** For development simplicity. In production, you should enable email confirmation.

### Step 4: Set Up Database

Go to **SQL Editor** in the sidebar and run the SQL files **in order**.

The SQL files will be added to the `sql/` folder. Run them in this order:
1. `01_create_tables.sql` - Creates tables
2. `02_rls_policies.sql` - Sets up security policies
3. `03_functions.sql` - Creates database functions
4. `04_triggers.sql` - Sets up triggers
5. `05_cron_jobs.sql` - Creates background jobs

**Note:** Detailed SQL files will be provided in the `sql/` folder.

### Step 5: Verify Database Setup

Check that everything was created:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check cron jobs
SELECT * FROM cron.job;
```

You should see `profiles`, `links`, and `reserved_slugs` tables, and two cron jobs.

---

## 🔐 Part 3: Cloudflare Turnstile Setup

### Step 1: Create Turnstile Site

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **"Turnstile"** in the left sidebar
3. Click **"Add Site"**
4. Fill in:
   - **Site name:** Minify
   - **Domain:** `localhost` (for development)
   - **Widget Mode:** Select **"Managed"** (checkbox)
5. Click **"Add"**

### Step 2: Get API Keys

After creating the site, you'll see:
- **Site Key** (public, starts with `0x...`)
- **Secret Key** (private, keep this safe!)

Copy both, you'll need them for environment variables.

---

## 🌍 Part 4: Environment Variables

### Step 1: Create `.env.local`

In your project root, copy the example file:

```bash
cp .env.example .env.local
```

### Step 2: Fill in Your Credentials

Open `.env.local` and replace the placeholder values:

```bash
# Supabase Configuration (from Part 2, Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-actual-key

# Cloudflare Turnstile (from Part 3, Step 2)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...your-site-key
TURNSTILE_SECRET_KEY=0x...your-secret-key
```

> ⚠️ **Important:** Never commit `.env.local` to Git! It's already in `.gitignore`.

---

## 🚀 Part 5: Run the Application

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Open in Browser

Navigate to: `http://localhost:3000`

You should see the Minify homepage!

---

## ✅ Part 6: Testing the Setup

### Test 1: Create an Account

1. Click **"Sign Up"**
2. Fill in the form:
   - Name (no numbers)
   - Valid email
   - Strong password (8+ chars, uppercase, lowercase, number, special char)
3. Complete the CAPTCHA
4. Click **"Create Account"**
5. You should be redirected to the login page

### Test 2: Login

1. Enter your email and password
2. Complete the CAPTCHA
3. Click **"Sign In"**
4. You should be redirected to the dashboard

### Test 3: Create a Short Link

1. On the dashboard, enter a URL (e.g., `https://github.com`)
2. Either:
   - Enter a custom slug (4-20 chars, no spaces)
   - Leave blank for auto-generation
3. Click **"Shorten"**
4. You should see your link in the table

### Test 4: Test the Short Link

1. Copy the shortened link from the dashboard
2. Open it in a new tab
3. You should be redirected to the original URL

### Test 5: Verify Database

Go to Supabase → **Table Editor**:
- You should see your profile in `profiles` table
- You should see your link in `links` table

---

## 🔍 Troubleshooting

### Problem: "Failed to create account"

**Possible causes:**
- Database tables not created properly
- RLS policies not set up
- Triggers not working

**Solution:**
1. Go to Supabase SQL Editor
2. Run this to check triggers:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';
   ```
3. Re-run the SQL files from Part 2, Step 4

---

### Problem: "Invalid CAPTCHA token"

**Possible causes:**
- Wrong Turnstile keys
- Domain mismatch

**Solution:**
1. Double-check your `.env.local` has correct Turnstile keys
2. In Cloudflare dashboard, make sure `localhost` is listed as a domain
3. Restart your dev server (`Ctrl+C` then `npm run dev`)

---

### Problem: "Link not found" when accessing short link

**Possible causes:**
- Link expired
- Database connection issue

**Solution:**
1. Check the `expires_at` date in the `links` table
2. Try extending the link from the dashboard
3. Verify your Supabase URL is correct in `.env.local`

---

### Problem: Cron jobs not running

**Possible causes:**
- `pg_cron` extension not enabled

**Solution:**
1. Go to Supabase SQL Editor
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```
3. Re-run `sql/05_cron_jobs.sql`
4. Verify with:
   ```sql
   SELECT * FROM cron.job;
   ```

---

### Problem: "Cannot read properties of null" errors

**Possible causes:**
- Environment variables not loaded
- `.env.local` file missing

**Solution:**
1. Make sure `.env.local` exists in project root
2. Restart your dev server
3. Check for typos in variable names (they're case-sensitive!)

---

## 🎉 You're All Set!

If all tests passed, your Minify instance is ready to use!

### Next Steps:

- **Customize:** Modify the UI in `app/` folder
- **Deploy:** See deployment guide below
- **Contribute:** Submit PRs to improve the project

---

## 🚢 Deploying to Production

### Recommended: Vercel

1. Push your code to GitHub (make sure `.env.local` is NOT pushed!)
2. Go to [Vercel Dashboard](https://vercel.com/)
3. Click **"Import Project"**
4. Select your GitHub repository
5. Add environment variables (same as `.env.local`)
6. Click **"Deploy"**

### Update Turnstile Domain

After deployment:
1. Go to Cloudflare Turnstile dashboard
2. Edit your site
3. Add your Vercel domain (e.g., `minify.vercel.app`)
4. Save changes

### Update Supabase Redirect URLs

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🐛 Still Having Issues?

Open an issue on GitHub with:
- Error message
- Steps to reproduce
- Your environment (OS, Node version)

---

**Happy shortening! 🔗**