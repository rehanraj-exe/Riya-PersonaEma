# Riya-PersonaEmma 🤖✉️

**Your Personal AI Email Agent & Inbox Triage Assistant**

Riya PersonaEmma is an intelligent, automated email management dashboard that acts as your personal executive assistant. It hooks directly into your real email inbox, reads incoming messages, and uses Google's Gemini AI to aggressively filter spam, categorize topics, highlight critical priorities, and automatically draft replies so you can achieve Inbox Zero in seconds.

---

## ✨ Features

- **🧠 Intelligent Triage:** Automatically reads unseen emails and assigns Priority (`Critical`, `High`, `Medium`, `Low`) and Category (`Work`, `Personal`, `Spam`, etc.).
- **🛡️ Spam Deflection:** Accurately identifies spam and isolates it from your core workflow, saving you time and mental energy.
- **✨ AI Draft Responses:** For emails marked `Critical` or `High` priority, the AI instantly generates context-aware draft responses. You can click **Copy** or **Reply** to dispatch them immediately.
- **📊 Real-time Analytics:** A beautiful dashboard that visualizes your inbox trends, spam deflection rate, AI confidence scores, and priority breakdowns using dynamic charts.
- **🔒 Secure Architecture:** Built as a single-tenant personal agent. Authentication is handled by Clerk, and your data is securely stored in a PostgreSQL database.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma
- **AI Model:** Google Gemini (`gemini-3.6-flash`)
- **Authentication:** Clerk
- **Styling:** Tailwind CSS + Framer Motion (Micro-animations)
- **Data Visualization:** Recharts
- **Email Protocol:** IMAP (`imap-simple`, `mailparser`)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following accounts set up:
- A [Supabase](https://supabase.com/) project (for the PostgreSQL database).
- A [Clerk](https://clerk.com/) application (for Authentication).
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey).
- A Gmail account with **IMAP Enabled** and a 16-character **App Password**.

### 2. Environment Setup
Create a `.env.local` file in the `frontend` directory and add the following keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

DATABASE_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

GEMINI_API_KEY="AIzaSy..."

# Your IMAP Credentials (Requires an App Password, NOT your standard password)
IMAP_USER="your-email@gmail.com"
IMAP_PASSWORD="your16characterapppassword"
```

### 3. Database Initialization
Push the database schema to Supabase:
```bash
npx prisma db push
```

### 4. Run the Development Server
Install dependencies and start the app:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your dashboard.

---

## 🔄 How the AI Sync Works

The core engine is located in `sync.js`. This script acts as a background worker:
1. It connects to your Gmail via IMAP.
2. It fetches the total count of messages and grabs the most recent unseen emails to preserve memory.
3. It passes the email sender, subject, and body to **Gemini 3.6 Flash**.
4. Gemini analyzes the sentiment, category, priority, and generates a `suggestedReply`.
5. The processed data is safely upserted into the Prisma database.

To manually trigger a sync, run:
```bash
node sync.js
```
*(In production, this logic can be triggered via a Vercel Cron Job hitting the `/api/cron/fetch-emails` endpoint).*
