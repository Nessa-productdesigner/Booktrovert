# flows.md — Booktrovert User Flows

Use this file when building any screen, component, or interaction
that involves a user moving through the app.

---

## Onboarding Flow

Must complete in under 3 minutes.
Every step is required — no skipping.

```
Step 1 — Account creation
  Email + password
  Age gate: must be 13 or older
          │
          ▼
Step 2 — "What have you read recently?"
  User searches and logs 1–3 books minimum
  Search hits Books API via backend
  If book not found: offer manual entry
          │
          ▼
Step 3 — Tag each book
  For each book logged in Step 2:
  User applies context tags across all 6 dimensions
  Minimum one tag per dimension required to proceed
          │
          ▼
Step 4 — First recommendations generated
  Engine runs immediately after tagging is complete
  User sees first recommendation set
          │
          ▼
Step 5 — Land on shelf (home screen)
  onboarding_complete set to true
```

### Onboarding Rules
- Progress indicator shown on every step
- User cannot skip the tag step
- Minimum 1 tag per dimension required before proceeding
- If user exits mid-onboarding and returns:
  resume from the last incomplete step
- onboarding_complete remains false until Step 5 is reached

---

## Adding a Book

```
User taps Add book
          │
          ▼
Search bar opens
User types title or author
          │
          ▼
Backend queries Books API in real time
Results displayed
          │
     ┌────┴────┐
  Found     Not found
     │            │
     ▼            ▼
User selects   "Can't find this book?"
book           Manual entry form
     │            │
     │         Title + Author required
     │         At least one tag required
     │            │
     └────────────┘
          │
          ▼
Shelf selection screen
to_read | currently_reading | read | rereading | did_not_finish
          │
     ┌────┴────────────────┐
     │                     │
Shelf = read or        Shelf = to_read or
did_not_finish         currently_reading
     │                     │
     ▼                     ▼
Tag screen appears     Book saved
User applies tags      No tags required
     │
     ▼
Book saved
Recommendation engine re-runs
```

---

## Getting Recommendations

```
User opens Recommendations tab
          │
          ▼
Backend checks: does user have 3+ tagged books?
          │
     ┌────┴────┐
    Yes        No
     │          │
     ▼          ▼
Engine runs   Empty state:
              "Log and tag at least
              3 books to unlock
              your first recommendations"
     │
     ▼
Recommendations displayed
Each shows:
  - Book cover, title, author
  - Match reason
  - Matched tags
  - Add to shelf button
  - Dismiss button
          │
     ┌────┴──────┐
  Add to shelf  Dismiss
     │               │
     ▼               ▼
Shelf selection   rec status = dismissed
screen opens      Tag weights reduced
                  Pool refreshes if all dismissed
```

---

## Editing Tags on a Logged Book

```
User opens a book on their shelf
          │
          ▼
User taps Edit tags
          │
          ▼
Tag screen opens with current tags pre-selected
User updates tags
          │
          ▼
Tags saved to userbook record
updated_at refreshed
          │
          ▼
Recommendation engine re-runs immediately
```

---

## Moving a Book Between Shelves

```
User opens a book on their shelf
          │
          ▼
User taps Change shelf
          │
          ▼
Shelf selection screen opens
User selects new shelf
          │
     ┌────┴──────────────────────┐
     │                           │
New shelf = read or         New shelf = to_read or
did_not_finish              currently_reading
     │                           │
     ▼                           ▼
Tag screen appears          Shelf updated
(pre-fills existing tags    No tag change needed
 if tags already exist)
     │
     ▼
Tags saved
Recommendation engine re-runs
```

---

## Sharing a Book

```
User opens a book on Currently Reading or Read shelf
          │
          ▼
User taps Share
          │
          ▼
Backend generates unique token
Saves to share_links table
          │
          ▼
Frontend displays shareable URL:
booktrovert.com/share/:token
          │
          ▼
User copies link or shares to
external platform (WhatsApp, Instagram, etc.)
          │
          ▼
Recipient opens link — no login required
          │
          ▼
Public page shows:
  - Book cover
  - Title and author
  - Reader's context tags (only if shared from Read shelf)
  - No PII (no display name, no account info)
```

---

## Empty States

| Screen | Trigger | Message |
|---|---|---|
| Shelf | 0 books logged | Add your first book to get started. The more you log, the better your recommendations get. |
| Recommendations | Fewer than 3 tagged books | Log and tag at least 3 books to unlock your first recommendations. |
| Search | 0 results from API | Can't find this book? [Add manually button] |
| Recommendations | All recommendations dismissed | Pool refreshes automatically — no action needed |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| User dismisses all recommendations | Auto-lower tag specificity and refresh pool |
| User edits tags on an old book | Recommendation engine re-runs immediately |
| Book moved to Did Not Finish | Tag screen appears — tags saved as negative signals |
| Two users log same book | Two independent userbook records — tags never merged |
| Share link opened without login | Public page renders — no login prompt shown |
| User returns mid-onboarding | Resume from last incomplete step |
| Book API unavailable during search | Show loading → retry once → offer manual entry |

---

## Notifications

| Trigger | Notification |
|---|---|
| New book tagged | In-app: new recommendations available |
| Read book added without tags after 24h | In-app: reminder to tag the book |

### Notification Rules
- Maximum 1 notification per user per day
- No notifications during active onboarding
- User can disable all notifications in settings
- No marketing or promotional notifications at MVP
