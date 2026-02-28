# Letranido — Creative Writing Platform

> A full-stack platform where writers compete in monthly challenges, vote for their favorite stories, and build a public portfolio.

**Live:** [letranido.com](https://www.letranido.com) · **Stack:** React 19 · Supabase · PostgreSQL · Vercel

---

## Overview

Letranido is a community-driven creative writing platform built from scratch. Users submit short stories to monthly contests, vote blindly for their favorites, earn achievement badges, and maintain public author profiles. The entire contest lifecycle — from submission to winner announcement — runs automatically with zero manual intervention.

---

## Key Features

### Contest System
- **Automated lifecycle**: Submission → Voting → Counting → Results phases driven by deadlines
- **Blind voting**: Vote counts hidden during voting phase to prevent bandwagon effect
- **Auto-finalization**: `pg_cron` triggers a Supabase Edge Function at the exact `voting_deadline` to compute winners, assign badges, and send email notifications — no admin action required
- **6 automated emails** per contest cycle via Resend (new contest, reminders, voting open, results)

### Microhistories Feed
- Social writing feed inspired by Instagram: weekly rotating prompts, 50–300 word stories
- Real-time likes and nested comments with optimistic UI (no page reloads)
- Separate from the contest system — focused on daily practice, not competition

### Badge & Karma System
- 14 badge types: writing milestones, contest wins, community engagement, special donors
- Auto-assigned by PostgreSQL function `check_and_award_badges()` triggered on story publish
- Badges for contest wins are **repeatable per contest** — handled without a UNIQUE constraint using `EXISTS()` checks

### Public Author Profiles
- Each user gets a profile page at `/author/:userId` with their full story history, stats, and badges
- Optional: bio, country, social links — fully privacy-controlled by the user
- **Read tracking**: Stories auto-marked as read after 15 seconds; unread stories sorted first during voting

### Community Polls
- Community votes on prompts for upcoming contests
- Winning prompt auto-converts to the next contest via DB trigger

---

## Architecture

```
Frontend (React 19 + Vite + Tailwind CSS)
│
├── GlobalAppContext.jsx        — Central state (auth, contests, votes)
├── Custom hooks (19)          — Contest logic, badges, feed, read tracking
├── Supabase JS client         — Auth, realtime, storage
│
Backend (Supabase / PostgreSQL)
│
├── Row Level Security         — All tables protected by RLS policies
├── Edge Functions (Deno)      — auto-finalize-contest, send-scheduled-email
├── pg_cron                    — Scheduled jobs for auto-finalization & emails
├── pg_net                     — HTTP calls from cron to Edge Functions
└── DB functions               — check_and_award_badges(), schedule_contest_finalization()
```

**Frontend → Supabase** for all data. No custom API server — business logic lives in PostgreSQL functions and Supabase Edge Functions (Deno/TypeScript).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Routing | React Router v7 |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Automation | pg_cron, pg_net, Supabase Edge Functions |
| Email | Resend |
| Hosting | Vercel |
| Rich text | Quill 2.0 |
| SEO | React Helmet Async |

---

## Project Structure

```
src/
├── contexts/           # Global state (auth, contests, user data)
├── pages/              # 26 page components
├── components/
│   ├── admin/          # Contest management, polls, moderation
│   ├── feed/           # Microhistories social feed
│   ├── ui/             # Reusable components (Badge, UserCard, ProfileButton)
│   └── voting/         # Voting UI and validation
├── hooks/              # 19 custom hooks (finalization, badges, feed, reads)
└── lib/                # Supabase client, email templates, feature flags
```

---

## Database Design Highlights

- `contests` + `stories` + `votes` — core contest flow
- `user_profiles` — public stats, bio, country, social links, privacy toggle
- `feed_prompts` + `feed_stories` + `feed_story_likes` + `feed_story_comments` — social feed
- `user_story_reads` — per-user read tracking for fair story distribution during voting
- `contest_automation_log` — full audit trail of scheduled jobs and email sends
- All counters (`likes_count`, `comments_count`) maintained by DB triggers for performance

---

## Notable Engineering Decisions

**Optimistic UI for likes** — Feed likes update instantly in the UI without waiting for the DB round-trip, then reconcile on error.

**Blind voting fairness** — Vote counts are hidden during the active voting phase and revealed only after finalization, preventing popularity bias.

**Idempotent auto-finalization** — The Edge Function checks `finalized_at IS NOT NULL` before processing, so manual admin closure and the scheduled job can never double-process a contest.

**Badge deduplication without UNIQUE constraint** — Contest winner badges are intentionally repeatable (one per contest), so duplicate prevention uses `EXISTS()` queries instead of a DB constraint.

**Read-first ordering** — During voting phase, stories a user hasn't read yet appear first. This improves discovery equity across all submissions regardless of submission time.

---

## Local Development

```bash
# Install dependencies
npm install

# Development (connects to production DB — read-only safe)
npm run dev:prod

# Development with local Supabase
npm run dev:local

# Build
npm run build

# Lint
npm run lint
```

Requires `.env.local` with Supabase URL + anon key (see `.env.example`).

---

## License

Private project. All rights reserved.
