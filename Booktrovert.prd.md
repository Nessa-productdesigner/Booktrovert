BOOKTROVERT
Product Requirements Document
A Reader-Centric Book Tracking & Recommendation Platform
Version 1.0  |  MVP Specification


1. Product Overview
1.1 Product Summary
Booktrovert is a minimalist web application that lets fiction readers track their reading and receive AI-powered book recommendations based on the contextual, emotional, and narrative qualities of books they have previously read — not just genre tags.

1.2 Problem Statement
Existing book discovery platforms (Goodreads, StoryGraph) recommend books based on genre categories and collaborative filtering. This approach fails fiction readers who choose books based on pacing, emotional tone, writing style, narrative structure, and specific tropes. These readers currently spend hours searching social media (primarily TikTok/BookTok) to find recommendations that match a specific feeling — not a category.

1.3 Product Vision
To be the first book tracking app that understands how readers actually choose books — and recommends accordingly.

1.4 Target Users
Age 15-35 (Gen Z: 15-25, Millennials: 26-35)
Avid fiction readers
Dissatisfied with genre-only recommendations
Active on BookTok and reading communities

1.5 Success Metrics (MVP)
Onboarding completion rate: >70%
Books logged per active user in first 7 days: 3 or more
Recommendation click-through rate: >25%
Day-7 retention: >40%
Recommendation dismissal rate: <30%

2. Market Intelligence
2.1 Market Size
Segment
Current Value (2024)
Projected Value
Reading Tracking Apps (Global)
$1.42 billion
$4.06 billion by 2033 (13.8% CAGR)
Book Reading Apps (Global)
$1.2 billion
$2.56 billion by 2032 (8.1% CAGR)
Online Book Services (Global)
$23.38 billion
$32.45 billion by 2030 (5.6% CAGR)
Fiction Segment (Apps)
$2.5 billion
Highest value segment in book apps
BookTok-influenced US print sales
59 million books (2024)
$760M+ US revenue attributed to TikTok


Asia-Pacific is the fastest-growing region at 17.2% CAGR (2025-2033). Fiction is the highest-value app segment. BookTok has surpassed 370 billion total views as of 2025.

2.2 User Behavior Signals
55% of Gen Z read once a week or more. 40% read daily.
67% of Gen Z read on their phones — the natural delivery format for Booktrovert.
Gen Z estimates 65% of their reading is fiction — the core Booktrovert audience.
62% of US TikTok users have read a book based on a BookTok recommendation.
More than a third of 16-39 year olds in Europe now discover books on TikTok.
BookTok influenced 59 million US print book sales in 2024, generating $760M+ revenue.
48% of US TikTok users say they read more books because of BookTok influence.

2.3 Competitive Landscape
Platform
Users
Rec. Method
Key Gap
Threat Level
Goodreads
150M
Genre + collaborative filtering
Outdated UI, shallow recs, Amazon-owned
Low
The StoryGraph
5M (Jan 2026)
Mood tags + collaborative filtering
Rec quality declining at scale, no LLM engine
High
Generic AI rec tools
Fragmented
LLM-powered, no tracking
No shelf, no reading history, no retention loop
Medium
Booktrovert (proposed)
MVP launch
LLM contextual + user tag engine
Cold start problem to solve at launch
N/A


2.4 SWOT Analysis
Goodreads
Strengths
• 150M users and deep network effects
• Kindle and Amazon ecosystem integration
• Largest book database globally
• Strong social and community features
Weaknesses
• Recommendation algorithm heavily criticized — genre-only, no emotional or contextual matching
• Outdated UI documented extensively by users as clunky
• Amazon ownership driving user migration to alternatives
• No LLM-powered contextual recommendation capability
Opportunities
• Could ship LLM recommendations leveraging Amazon infrastructure and budget
• Could acquire StoryGraph or a competitor to absorb their user base
Threats
• Ongoing user migration to StoryGraph accelerating since 2024 US election
• BookTok community building reading habits entirely outside Goodreads


The StoryGraph
Strengths
• Cleaner UX than Goodreads — won 2025 App Store Award
• Mood and pacing tags already in product — conceptually closer to Booktrovert than Goodreads
• Independent — no Amazon association, strong anti-Big-Tech positioning
• 5M users reached in January 2026, growing rapidly
Weaknesses
• Recommendation quality documented as declining at scale — user complaints on their own roadmap
• Incomplete book database — many indie and international titles missing
• Still uses collaborative filtering, not LLM contextual matching
• Small team limits development speed and feature velocity
Opportunities
• Could integrate LLM recommendations — this is the single biggest competitive risk for Booktrovert
• Ongoing BookTok-driven Goodreads exodus continues to send users their way organically
Threats
• Larger platforms could replicate their approach at scale with more resources
• User trust eroding due to documented recommendation quality decline


Booktrovert (Proposed)
Strengths
• First product combining LLM contextual recommendations with integrated book tracking
• Built specifically for Gen Z fiction readers — no audience compromise or legacy design debt
• User tagging system generates proprietary reading data that improves recommendations over time
• Clean slate — no legacy architecture, no Amazon association
Weaknesses
• Zero users at launch — cold start problem is real and must be solved by design
• Recommendations require minimum 3 tagged books before they become useful
• No existing book database — fully dependent on external API reliability
• No marketing budget at MVP stage — growth depends on organic and community channels
Opportunities
• Goodreads migration sentiment is at an all-time high — timing could not be better
• BookTok has already trained millions of readers to want and expect contextual recommendations
• No product currently on the market fills this exact gap at this quality level
• Tagged reading data becomes a long-term proprietary moat as the user base scales
Threats
• StoryGraph could ship LLM-powered recommendations at any point — window of differentiation is not permanent
• Cold start drop-off before the first useful recommendation is a critical retention risk
• External books API coverage gaps could frustrate users who read niche or international titles
• User acquisition cost without marketing resources could slow early growth significantly


3. Core Features
3.1 Book Shelf and Tracker
Users log books into one of five shelves:
To Read
Currently Reading
Read
Rereading
Did Not Finish
Each logged book on the Read or Did Not Finish shelf prompts context tagging
Users can edit shelf status and tags at any time after saving

3.2 Book Search and Manual Entry
Search pulls metadata from an external books API (title, author, cover, synopsis, genre)
If a book is not found in the API: user sees a prompt to add it manually
Manual entry requires: Title, Author, and at least one context tag before saving

3.3 User Tagging System
The tagging system is the core engine of Booktrovert. Tags are predefined, multi-select, and the primary input signal for the recommendation engine.

Dimension
Tag Options
Pacing
Slow burn, Fast-paced, Steady
Emotional tone
Dark, Hopeful, Funny, Melancholic, Tense
Writing style
Lyrical, Dialogue-heavy, Sparse, Descriptive
Structure
Non-linear, Multiple POVs, Unreliable narrator, Epistolary
Tropes
Enemies to lovers, Found family, Chosen one, Redemption arc, Morally grey protagonist, Strong Female lead, Friends to lovers, Second chance romance.
Feeling after finishing
Satisfied, Wrecked, Confused, Wanting more


Tag System Rules (MVP)
Tags are a fixed, curated list — not free text and not auto-generated
Multi-select: users can apply multiple tags per dimension
Tags are the primary input signal for the recommendation engine
Fixed tags keep data clean and comparable across all users — slow burn means the same thing for every user, which makes matching reliable
New tag dimensions are added as deliberate product decisions only — not automatically

Tag System Roadmap (Post-MVP)
After MVP, the tagging experience will be enhanced with LLM-assisted pre-selection. The fixed tag list remains unchanged — the LLM does not generate new tags. It reads the book metadata (synopsis, genre data from the API) and pre-selects the most relevant tags from the existing list as suggestions. The user reviews and confirms, rather than selecting from scratch.

LLM scans book metadata on add: synopsis, API genre tags, and title context
LLM pre-selects suggested tags from the fixed list only — it cannot create new ones
Suggested tags are shown as pre-checked — user can deselect or add others freely
This reduces tagging friction while keeping tag data clean and engine-compatible
Tag expansion (adding new dimensions or options) is reviewed quarterly based on dismissal rate patterns, recommendation quality signals, and user feedback — never automated

3.4 AI Recommendation Engine
The engine generates recommendations using these signals in order of priority:
Context tags applied to logged books — highest weight
Books marked Read with positive tags
Did Not Finish tags — used as negative signals to suppress similar books
Recency weighting — last 3 books carry more weight than older entries
Explicit feedback — dismissed recommendations reduce the weight of their matched tags

Each recommendation displays:
Book cover, title, and author
Match reason: e.g. "Because you loved the slow burn and lyrical writing in [Book]"
Tags matched
Option to add to shelf or dismiss

3.5 Shareable Reading Link
Users can generate a public link showing what they are currently reading
Link is shareable outside the app — no account required to view
Linked page shows: book cover, title, author, and the sharing user's context tags

4. User Flow
4.1 Onboarding Flow
Must be completable in under 3 minutes. Every step is required — no skipping.

Account creation: email + password or social login (Google, Apple)
"What have you read recently?" — user searches and logs 1-3 books minimum
For each book logged: user applies context tags across all dimensions
App generates first recommendation set immediately after tagging is complete
User lands on their shelf (home screen)

Progress indicator shown throughout all onboarding steps
Tag step cannot be skipped — minimum one tag per dimension required to proceed

4.2 Adding a Book
User taps "Add book"
Search bar opens — user types title or author
Results pull from external books API in real time
User selects book — shelf selection screen appears
User selects shelf (To Read, Currently Reading, Read, Rereading, Did Not Finish)
If shelf = Read or Did Not Finish: tag screen appears
User applies context tags — book is saved
If shelf = To Read or Currently Reading: book is saved without tags

4.3 Getting Recommendations
User navigates to Recommendations tab
Engine runs tag-matching logic against books database
Recommendations displayed with match reason and matched tags
User can: add to shelf, dismiss, or share a recommendation
Dismissed recommendations are removed and pool refreshes automatically

4.4 Sharing a Currently Reading Book
User opens a book on the Currently Reading shelf
User taps "Share"
Shareable link is generated with a unique token
User copies link or shares directly to external platform
Recipient opens link — sees book details and reader's context tags (no login required)

5. Data Models / Schemas
5.1 User
user_id — unique identifier
email
password_hash
display_name
created_at
onboarding_complete — boolean

5.2 Book
book_id — unique identifier
title
author
cover_url
synopsis
genre_tags — from API
source — API or manual
created_at

5.3 UserBook (Join Table)
userbook_id
user_id — foreign key
book_id — foreign key
shelf — enum: to_read, currently_reading, read, rereading, did_not_finish
context_tags — JSON: stores all tag dimensions and selected values
added_at
updated_at

5.4 Recommendation
rec_id
user_id — foreign key
book_id — foreign key
match_reason — generated string explanation
matched_tags — JSON
status — enum: pending, dismissed, saved
generated_at

5.5 ShareLink
link_id
user_id — foreign key
book_id — foreign key
token — unique public token
created_at
expires_at — optional

6. System Behavior
6.1 Recommendation Engine Triggers
Engine re-runs when: a new book is tagged, tags are edited on an existing book, or a recommendation is dismissed
Negative signals from Did Not Finish books actively suppress books with matching tags
Recency weighting: last 3 tagged books carry 2x weight vs older entries
Minimum threshold: 3 tagged books required before recommendations generate
If threshold not met: empty state shown (see Section 8)

6.2 Book Search Behavior
Search queries hit external books API in real time
Results ranked by relevance to query string
If API returns 0 results: show prompt with option to add book manually
Manual entries stored in Book table with source flagged as manual

6.3 Tag Persistence
Tags are stored per UserBook record, not globally per book
Same book tagged differently by different users — tags do not merge or average
User can edit tags on any previously logged book at any time
Tag edits trigger a recommendation engine re-run

7. Edge Cases
Scenario
System Behavior
User dismisses all recommendations
Refresh pool automatically from broader tag matches — lower specificity threshold applied
Fewer than 3 tagged books
Recommendations tab shows empty state: log and tag at least 3 books to unlock recommendations
Book not found in API
Show prompt — cannot find this book — with option to add manually
User edits tags on an old book
Recommendation engine re-runs immediately with updated tag weights
Book moved from Currently Reading to Did Not Finish
Tag screen appears. Tags saved as negative signals. Suppresses similar books from recommendations.
Two users log same book with different tags
Tags are stored per user — no merging. Each user's recommendations remain fully personalized.
Share link opened without login
Public page renders book details and reader's tags. No account prompt or login wall shown.
Onboarding with fewer than minimum books
User is blocked. Minimum 1-3 books required. Progress indicator shows the missing step.
External API is unavailable
Show loading state, retry once automatically. If still failing: search unavailable — offer manual entry.


8. Empty State Behavior
Location
Message Shown to User
Shelf — 0 books logged
Add your first book to get started. The more you log, the better your recommendations get.
Recommendations — fewer than 3 tagged books
Log and tag at least 3 books to unlock your first recommendations.
Search — no results found
Cannot find this book? Option to add it manually is shown.
Recommendations — all dismissed
Pool refreshes automatically from broader tag matches. No user action required.


9. Notifications Logic
9.1 In-App Notifications
New recommendations available: triggered after user logs and tags a new book
Tag reminder: triggered if user adds a book to the Read shelf without tagging after 24 hours
Onboarding nudge: if user creates account but does not complete onboarding within 48 hours

9.2 Notification Rules
Maximum 1 notification per day per user
No notifications sent during active onboarding flow
User can disable all notifications from settings at any time
No third-party marketing or promotional notifications at MVP stage

10. Security & Compliance
10.1 Authentication
Passwords stored as hashed values — never plain text
Social login via OAuth 2.0 — Google and Apple minimum
Session tokens expire after 30 days of inactivity
Password reset via email verification link only

10.2 Data Privacy
User reading data is private by default — not visible to other users
Share links expose only: book title, author, and the sharing user's context tags
No personally identifiable information on public share pages
Users can delete their account and all associated data at any time

10.3 API Security
External books API calls made server-side — API keys never exposed to client
Rate limiting applied to book search endpoint to prevent abuse
Manual book entries sanitized before database storage to prevent injection

10.4 Compliance Considerations
GDPR: required for European users — consent banner, data export, and right to deletion
COPPA: users under 13 not permitted — age gate at signup
CCPA: required for California users — privacy policy must disclose data usage clearly

Booktrovert PRD v1.0 — MVP Specification. This document defines minimum viable product scope only. Features not listed here are out of scope for the first build.
