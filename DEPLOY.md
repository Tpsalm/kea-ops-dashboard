# Deploying KEA Operations Intelligence

Complete step-by-step guide to move this project to **GitHub** and deploy it
to **Vercel** for a permanent live URL.

Total time: **~10 minutes**. No coding required.

---

## Prerequisites (one-time only)

You need three free accounts. If you already have them, skip ahead.

1. **GitHub account** — https://github.com/signup
2. **Vercel account** — https://vercel.com/signup (sign in with your GitHub account)
3. **Git installed on your computer** — https://git-scm.com/downloads
   *(Skip this if you'll use GitHub Desktop instead — see Alternative below.)*

---

## PART 1 · Move the project to GitHub

### Option A — Command line (recommended, 3 minutes)

Open a terminal in this project folder and run:

```bash
# 1. Initialise Git
git init
git branch -M main

# 2. Stage every file
git add .

# 3. Commit
git commit -m "Initial commit: KEA Operations Intelligence dashboard"
```

Now create the GitHub repository:

4. Go to **https://github.com/new**
5. **Repository name:** `kea-operations-intelligence`
6. **Description:** `Field force & merchandising operations dashboard`
7. Choose **Private** (recommended) or Public
8. **DO NOT** tick "Add a README", "Add .gitignore" or "Choose a license" — you already have them
9. Click **Create repository**

GitHub now shows you a page with commands. Copy the two commands under
**"…or push an existing repository from the command line"** and run them:

```bash
# (Replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/kea-operations-intelligence.git
git push -u origin main
```

If GitHub asks for a password, use a **Personal Access Token** instead:
- Go to https://github.com/settings/tokens
- Click **Generate new token (classic)**
- Give it the **`repo`** scope, generate, and paste it as the password

✅ **Your project is now on GitHub.** Refresh the repo page to confirm all files uploaded.

### Option B — GitHub Desktop (no command line, 4 minutes)

1. Download **GitHub Desktop**: https://desktop.github.com/
2. Sign in with your GitHub account
3. Click **File ▸ Add local repository** → select this project folder
4. Click **Publish repository**
5. Name it `kea-operations-intelligence`, tick **Private**, click **Publish**

✅ Done.

---

## PART 2 · Deploy to Vercel (5 minutes)

1. Go to **https://vercel.com/new**
2. If prompted, click **Continue with GitHub**
3. You'll see **"Import Git Repository"** — find `kea-operations-intelligence` in the list
4. Click **Import**

Vercel now auto-detects Next.js:

5. **Project Name:** leave as `kea-operations-intelligence` (or customise)
6. **Framework Preset:** Next.js *(auto-detected)*
7. **Root Directory:** `./` *(leave as-is)*
8. **Build & Output Settings:** *(leave as-is — Vercel handles it)*
9. **Environment Variables:** **leave completely empty** — the dashboard needs none
10. Click **Deploy**

Wait ~90 seconds while Vercel builds and deploys. When it's done you'll see a
🎉 confetti animation and your permanent URL:

```
https://kea-operations-intelligence.vercel.app
```

✅ **This URL never expires. Send it to your client.**

---

## PART 3 · Every future update

Any change you make locally can be published with one command:

```bash
git add .
git commit -m "describe what you changed"
git push
```

Vercel automatically detects the push and redeploys in ~60 seconds.
Your live URL stays the same — visitors just see the updated version.

---

## Optional · Custom domain

Want a URL like `ops.keaservices.com` instead of `*.vercel.app`?

1. Buy a domain (Namecheap, GoDaddy, etc.) or use one you own
2. In your Vercel project dashboard, click **Settings ▸ Domains**
3. Add your domain
4. Vercel shows you the DNS record to add at your domain registrar
5. Once DNS propagates (~5 min to 24 h), your custom domain is live and HTTPS is enabled

**All free on Vercel.**

---

## Troubleshooting

**Q: The build fails with "DATABASE_URL is required"**
A: This shouldn't happen — the code was updated to make DB optional. Make sure
you pushed the latest version of `src/db/index.ts` and `src/app/api/health/route.ts`.

**Q: `git push` says "Permission denied"**
A: Use a Personal Access Token (see Part 1 above). Regular passwords no longer
work with GitHub over HTTPS.

**Q: Vercel deploy fails on the first try**
A: Click **View Build Logs** → scroll to the error. Most first-time errors are
missing Node version — go to **Settings ▸ General ▸ Node.js Version** and pick
**20.x**, then click **Redeploy**.

**Q: Can I preview before deploying?**
A: Yes. Vercel gives you a "Preview" URL for every git branch that isn't
`main`. Push a branch, and you'll see the preview link in the Vercel dashboard.

---

## What's already configured for you

| File | Purpose |
| --- | --- |
| `.gitignore` | Excludes `node_modules`, `.env`, `.next` from Git |
| `next.config.ts` | Production optimisations enabled |
| `vercel.json` | Vercel config — Frankfurt region (closest to Nigeria) |
| `netlify.toml` | (Alternative) Netlify build config |
| `.env.example` | Env placeholder — safe to commit |
| `README.md` | Public project description |
| `DEPLOY.md` | This guide |

**Everything you need to deploy is already in the project. Just follow Part 1 and Part 2 above.**
