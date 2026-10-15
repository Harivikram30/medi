<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1E8T01KxyF19VG9YnvwFswu6rlO9rRaRG

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Connect Supabase

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key from Supabase project settings.
4. Restart the Vite server with `npm run dev`.

When Supabase is not configured, the app continues to use its localStorage demo data. The included policy is intended for this demo's custom client-side login; use Supabase Auth and patient-scoped Row Level Security policies before deploying real patient data.
