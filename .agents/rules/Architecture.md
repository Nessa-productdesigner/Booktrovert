---
trigger: always_on
---

# ARCHITECTURE.md — Booktrovert

High-level system overview. Full detail lives in the split files.

---

## System Overview

```text
User (Browser)
     │
     ▼
Frontend (Web App / Public Pages)
     │
     ▼
Backend (API Gateway / Monolith)
     ├── Auth Logic
     ├── Book Search ──────► External Books API (Open Library/Google)
     ├── Shelf & Tags
     ├── Recommendations ──► DeepSeek V3 API
     └── Share Links
     │
     ▼
Single App Database (Users, Books, Tags, Recs)
```

---

## Layers

| Layer | Responsibility |
|---|---|
| Frontend | UI, routing, state — never calls external APIs directly |
| Backend | All business logic, all external API calls, auth, rate limiting |
| Database | Single source of truth. All user profiles, auth states, and book schemas reside in a unified Supabase PostgreSQL database to ensure data integrity and simple relational queries. |
| DeepSeek V3 | Recommendation generation and match reason copy — server-side only |
| Books API | Book metadata (title, author, cover, synopsis) — server-side only |

---

## Key Rules

- API keys are never exposed to the client — all external calls are server-side
- Session tokens stored in httpOnly cookies — never localStorage
- Tags are stored per userbook record — never merged across users
- Recommendation engine requires minimum 3 tagged books before running
- Did Not Finish tags are negative signals — suppress similar books from recommendations
- Fixed tag vocabulary only — DeepSeek cannot invent new tags

---

## File Reference

| File | Use when building |
|---|---|
| `AGENT.md` | Every session — role, rules, constraints |
| `schema.md` | Database tables, migrations, queries |
| `api-endpoints.md` | Backend routes, frontend-backend connection |
| `recommendation-engine.md` | DeepSeek integration, recommendation logic |
| `auth-flow.md` | Login, registration, OAuth, session management |
| `flows.md` | Any screen or user interaction |
| `Booktrovert.prd.md` | Full product requirements — source of truth |