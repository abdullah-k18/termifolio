# TermiFolio

> "Not a website. A terminal."

A terminal-style portfolio generator. Upload your photo, auto-remove the background, convert it to ASCII art, fill in your details, and get a shareable CLI-powered profile URL. Visitors explore your portfolio using real terminal commands.

---

## Tech Stack

| Layer          | Tech                                        |
| -------------- | ------------------------------------------- |
| Frontend       | Next.js 16, Tailwind CSS v4                 |
| ASCII          | Canvas API (client-side)                    |
| BG Removal     | `@imgly/background-removal` (WASM, in-browser) |
| Image Cache    | Supabase Storage (`bg-cache` bucket)        |
| Backend        | Supabase (PostgreSQL + REST)                |
| Language       | TypeScript                                  |

---

## Features

- Automatic background removal before ASCII conversion (runs fully in-browser via WebAssembly — no API quota)
- Processed images cached in Supabase Storage by SHA-256 hash to avoid redundant work
- Image → ASCII art conversion (alpha compositing against white + gamma curve, client-side Canvas)
- Tag-based skills input
- Named custom social links (label + URL pairs)
- Terminal profile view with interactive command system
- Shareable URL per user: `/portfolio/{username}`
- `ls`-style blue skills display in terminal output
- Split layout: ASCII art sidebar + interactive terminal panel
- Blinking cursor, scanline effect, CRT glow

---

## Routes

| Route                   | Description               |
| ----------------------- | ------------------------- |
| `/`                     | Landing page              |
| `/create`               | Profile creation form     |
| `/portfolio/{username}` | Interactive terminal view |

---

## API Routes

| Route              | Method | Description                                      |
| ------------------ | ------ | ------------------------------------------------ |
| `/api/profiles`    | POST   | Create a new profile                             |
| `/api/profiles/[username]` | GET | Fetch a profile by username               |
| `/api/save-image`  | POST   | Save bg-removed PNG to Supabase Storage (cached) |

---

## Terminal Commands

```
/about    → Show about section
/skills   → Show skills (ls-style)
/contact  → Show contact info
/social   → Show social links
/all      → Show everything
/clear    → Clear terminal
/help     → Show this help
```

---

## Database Schema (Supabase)

```sql
create table profiles (
  id           uuid primary key default gen_random_uuid(),
  username     text not null unique,
  name         text not null,
  ascii_art    text default '',
  about        text default '',
  skills       text[] default '{}',
  email        text default '',
  phone        text default '',
  social_links jsonb default '{}',
  created_at   timestamptz default now()
);
```

`social_links` shape:
```json
{
  "github": "https://...",
  "linkedin": "https://...",
  "twitter": "https://...",
  "Portfolio": "https://...",
  "Any custom label": "https://..."
}
```

---

## Supabase Storage

A public bucket named `bg-cache` stores background-removed profile images.

- **Bucket:** `bg-cache` (public)
- **File naming:** `{sha256-of-original}.png`
- **Purpose:** Avoids reprocessing the same image on repeat uploads

Create it in your Supabase dashboard: **Storage → New bucket → name: `bg-cache` → Public → Create**

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `SUPABASE_SERVICE_ROLE_KEY` is used server-side only to upload images to the `bg-cache` bucket. Never expose it to the browser.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## UX Flow

1. Visit `/create`
2. Upload photo → background is removed in-browser via WASM model → ASCII art generated
3. Processed image saved to Supabase Storage for caching
4. Fill in name, username, about, skills, contact, social links
5. Preview → submit → profile saved to Supabase
6. Share `/portfolio/{username}` link
7. Visitors use terminal commands to explore the profile

---

## Future Enhancements

- Improved ASCII art quality (better character sets, higher resolution, edge detection, contrast tuning)
- Authentication (edit/delete profile)
- Export ASCII as PNG
- Animated typing intro
- Themes (amber retro, hacker green, monochrome)
