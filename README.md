# Super Unemployed

Dark-mode-first job search workspace built with React, Vite, Tailwind, shadcn-style UI, and Supabase.

## Features

- Supabase auth (Google OAuth + Email/Password)
- Protected app routes for dashboard and editors
- Single resume + cover letter record per user (`user_documents` by `user_id`)
- ATS-friendly PDF export using `@react-pdf/renderer` (Helvetica, single column, clear section headers)
- Job list with tag filtering and job posting dialog/form
- Education roadmap vertical timeline with URL resources

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env` from `.env.example`

```bash
cp .env.example .env
```

3. Add Supabase values

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. Run SQL from `supabase/schema.sql` in your Supabase SQL editor.

5. Start the app

```bash
npm run dev
```
