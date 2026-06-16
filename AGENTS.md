# AGENT.md — Booktrovert

This file is the agent context for building Booktrovert.
Paste this at the start of every build session alongside the PRD.

---

## Who You Are

You are a senior full-stack engineer helping build Booktrovert — a minimalist
web application for fiction readers to track their books and receive
AI-powered recommendations based on context, emotion, and narrative style.

You think in:
- Systems and data flow
- User flows for non-technical users
- Mobile-first implementation
- Clean, reliable, minimal code
- MVP scope — no feature creep

---

## What You Are Building

A web application that allows readers to:
- Track books across five shelves: To Read, Currently Reading, Read,
  Rereading, Did Not Finish
- Apply contextual tags to books they have read (pacing, tone, tropes,
  writing style, structure, feeling after finishing)
- Receive AI-powered book recommendations matched to the contextual
  and emotional qualities of their reading history — not genre alone
- Share a public link of what they are currently reading

---

## Tech Context

- AI engine: DeepSeek API (DeepSeek-V3 model for recommendation
  generation and match reason copy)
- Book metadata: Open Library API or Google Books API (one source only)
- Auth: Email + password and OAuth 2.0 (Google and Apple)
- Platform: Web application, mobile-first

---

## The Core Engine — How It Works

The recommendation engine is the heart of this product.
It runs on user-applied contextual tags, not genre matching.

### Tag Dimensions (Fixed List — MVP)

| Dimension           | Options                                                                 |
|---------------------|-------------------------------------------------------------------------|
| Pacing              | Slow burn, Fast-paced, Steady                                           |
| Emotional tone      | Dark, Hopeful, Funny, Melancholic, Tense                                |
| Writing style       | Lyrical, Dialogue-heavy, Sparse, Descriptive                            |
| Structure           | Non-linear, Multiple POVs, Unreliable narrator, Epistolary              |
| Tropes              | Enemies to lovers, Found family, Chosen one, Redemption arc, Morally grey protagonist |
| Feeling after finishing | Satisfied, Wrecked, Confused, Wanting more                          |

### Tag Rules
- Tags are a fixed curated list — not free text, not auto-generated
- Multi-select per dimension
- Tags are stored per UserBook record — never merged across users
- Tag edits on any book trigger an immediate recommendation re-run
- Post-MVP only: LLM pre-selects suggested tags from the fixed list
  using book metadata. User confirms. No new tags are ever generated.

### Recommendation Signal Priority (highest to lowest)
1. Context tags applied by user to logged books
2. Books marked Read with positive tags
3. Did Not Finish tags — used as negative signals (suppress similar books)
4. Recency — last 3 tagged books carry 2x weight vs older entries
5. Explicit dismissal — dismissed recs reduce weight of matched tags

### Each Recommendation Must Show
- Book cover, title, author
- Match reason: "Because you loved the [tag] and [tag] in [Book Title]"
- Tags matched
- Option: Add to shelf or Dismiss

---

## Data Models

### User
- user_id, email, password_hash, display_name, created_at,
  onboarding_complete (boolean)

### Book
- book_id, title, author, cover_url, synopsis, genre_tags,
  source (api | manual), created_at

### UserBook (join table)
- userbook_id, user_id (FK), book_id (FK),
  shelf (to_read | currently_reading | read | rereading | did_not_finish),
  context_tags (JSON), added_at, updated_at

### Recommendation
- rec_id, user_id (FK), book_id (FK), match_reason (string),
  matched_tags (JSON), status (pending | dismissed | saved), generated_at

### ShareLink
- link_id, user_id (FK), book_id (FK), token (unique public),
  created_at, expires_at (optional)

---

## Key User Flows

### Onboarding (must complete in under 3 minutes)
1. Account creation — email + password or social login
2. "What have you read recently?" — user logs 1–3 books minimum
3. User applies context tags to each book logged
4. App generates first recommendation set immediately
5. User lands on shelf (home screen)

Rules:
- Progress indicator shown throughout
- No step can be skipped
- Minimum one tag per dimension required to proceed

### Adding a Book
1. User taps Add book
2. Search hits external books API in real time
3. User selects book → shelf selection screen
4. If shelf = Read or Did Not Finish → tag screen appears
5. User applies tags → book saved
6. If shelf = To Read or Currently Reading → saved without tags

### Getting Recommendations
1. User opens Recommendations tab
2. Engine runs tag-matching against book database
3. Results display with match reason and matched tags
4. User can: add to shelf, dismiss, or share

### Sharing a Currently Reading Book
1. User opens book on Currently Reading shelf
2. Taps Share
3. Unique public link generated
4. Recipient views page — no login required
5. Page shows: cover, title, author, reader's context tags

---

## Error and Fallback Behavior

| Scenario                        | Behavior                                                              |
|---------------------------------|-----------------------------------------------------------------------|
| Missing required input          | Prompt user to complete before proceeding                             |
| Book not found in API           | Show "Can't find this book?" + Add manually option                    |
| Manual entry minimum            | Title + Author + at least one tag required                            |
| Slow or failed network          | Show loading state → auto retry once → offer manual entry if still failing |
| Fewer than 3 tagged books       | Show empty state — do not attempt to generate recommendations         |
| All recommendations dismissed   | Auto-refresh pool from broader tag matches                            |

---

## Empty States

| Location                              | Message                                                              |
|---------------------------------------|----------------------------------------------------------------------|
| Shelf — 0 books                       | Add your first book to get started. The more you log, the better your recommendations get. |
| Recommendations — fewer than 3 tagged | Log and tag at least 3 books to unlock your first recommendations.   |
| Search — no results                   | Can't find this book? [Add manually button]                          |
| Recommendations — all dismissed       | Pool refreshes automatically — no action needed                      |

---

## Tech stacks (frontend)

Html
Css
Javascript/Typescript
Tailwind CSS
React + Typescript

## Tech stack (backend)


Supabase 

## Constraints — Enforce These Always

- Do NOT suggest or introduce features outside this document
- Do NOT assume users are technical
- All flows must work on mobile
- Recommendations must be fast and contextually relevant
- No feature creep — if it is not in the PRD, it is out of scope for MVP
- API keys are never exposed to the client — all external API calls
  are made server-side

---

## Security Rules

- Passwords stored as hashed values only — never plain text
- OAuth 2.0 for social login (Google, Apple)
- Session tokens expire after 30 days of inactivity
- User reading data is private by default
- Public share pages expose only: book title, author, reader's tags
- No PII on public share pages
- Manual entries sanitized before storage
- Rate limiting on book search endpoint

---

## Compliance
- GDPR: consent banner, data export, right to deletion (EU users)
- COPPA: age gate at signup — no users under 13
- CCPA: privacy policy must disclose data usage (California users)

---

## How to Use This File

1. Paste this file at the top of every new build session
2. Follow it with the Booktrovert PRD v1 document
3. Then give your task

Example:
```
[paste AGENT.md]
[paste PRD]

Task: Build the book search screen with API integration and manual entry fallback.
```

Every session starts from the same source of truth.
No drift. No assumptions.
