# ✂️ CapCut Auto — AI-Powered Editing Assistant

A full-stack website where users sign up, describe their video edit in plain English,
and receive a precise step-by-step CapCut editing guide powered by Claude AI.

---

## 📁 File Structure

```
capcut-auto/
├── index.html              ← Landing page + auth
├── pages/
│   └── dashboard.html      ← Main app (after login)
├── css/
│   ├── style.css           ← Global styles
│   └── dashboard.css       ← Dashboard styles
├── js/
│   ├── supabase.js         ← Supabase client setup
│   ├── auth.js             ← Sign up / login / logout
│   ├── main.js             ← Landing page JS
│   └── dashboard.js        ← AI generation + history
└── README.md
```

---

## 🚀 Step-by-Step Setup

### Step 1 — Get a Supabase account (free)

1. Go to **https://supabase.com** → "Start your project" → Sign up free
2. Click **"New project"**, name it `capcut-auto`, choose a region
3. Wait ~2 minutes for the project to start
4. Go to **Settings → API** in the left sidebar
5. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2 — Set up the database table

In Supabase → **SQL Editor** → New query → Paste and run this:

```sql
-- Create the edit_plans table
create table if not exists edit_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prompt text not null,
  style text default 'cinematic',
  plan text not null,
  created_at timestamptz default now()
);

-- Only the owner can read/write their own plans
alter table edit_plans enable row level security;

create policy "Users can manage their own plans"
  on edit_plans
  for all
  using (auth.uid() = user_id);
```

### Step 3 — Add your keys to the code

Open **`js/supabase.js`** and replace:
```js
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

Open **`js/dashboard.js`** and replace:
```js
const ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY";
```

> ⚠️ **Security warning**: Putting the Anthropic API key directly in frontend code exposes it.
> See the **Secure API Key Setup** section below for the right way to do it.

### Step 4 — Get an Anthropic API key

1. Go to **https://console.anthropic.com**
2. Sign in → **API Keys** → Create a new key
3. Copy the key and put it in `dashboard.js` (for now — then move to edge function)

### Step 5 — Deploy to GitHub Pages

1. Create a new GitHub repo named `capcut-auto`
2. Upload all the files from this folder
3. Go to repo **Settings → Pages**
4. Source: **Deploy from a branch** → Branch: `main` → Folder: `/` (root)
5. Click Save — your site will be live at `https://yourusername.github.io/capcut-auto/`

---

## 🔐 Secure API Key Setup (Recommended)

Never expose your Anthropic API key in frontend code. Use a **Supabase Edge Function** instead:

### Create the Edge Function

In Supabase → **Edge Functions** → New function → name it `generate-plan`

```typescript
// supabase/functions/generate-plan/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const { prompt, style } = await req.json()

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: "You are CapCut Auto, an expert video editing assistant...",
      messages: [{ role: "user", content: `Style: ${style}\n${prompt}` }]
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
})
```

Add `ANTHROPIC_API_KEY` as a secret in Supabase → Settings → Edge Functions → Secrets.

Then in `dashboard.js`, replace the `fetch(CLAUDE_API_URL, ...)` call with:
```js
const sb = getSupabase();
const { data, error } = await sb.functions.invoke("generate-plan", {
  body: { prompt, style: currentStyle }
});
```

---

## ✅ Features

- 🔐 Sign Up / Login with Supabase Auth (email + password)
- ✨ AI-powered CapCut edit plan generation (Claude Sonnet)
- 🎬 5 style presets: Cinematic, TikTok, Vlog, YouTube, Music Video
- 📋 Checkable step-by-step plan with progress tracking
- 💾 Save plans to Supabase (with localStorage fallback)
- 📂 Plan history with delete
- 🎯 6 quick-start templates
- 📋 Copy-to-clipboard
- 📱 Responsive on mobile
- 🌙 Dark theme with purple gradient aesthetic

---

## 🐛 Troubleshooting

**Login not working**: Check your Supabase URL and anon key in `js/supabase.js`

**AI not generating**: Check your Anthropic API key in `js/dashboard.js`. Make sure you have credits.

**Plans not saving**: The Supabase table might not exist — run the SQL from Step 2.

**Redirecting in a loop**: Clear your browser's localStorage and try again.
