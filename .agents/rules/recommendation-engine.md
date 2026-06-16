# recommendation-engine.md — Booktrovert Recommendation Engine

Use this file when building the recommendation engine,
the DeepSeek integration, or the recommendations API endpoint.

---

## How the Engine Works

The engine matches books to users based on contextual tags —
not genre. It runs server-side and calls DeepSeek V3.

```
User logs book + applies tags
          │
          ▼
Backend collects all userbook records for this user
where shelf = read, rereading, or did_not_finish
          │
          ▼
Apply signal weights to tag profile
          │
          ▼
Build DeepSeek prompt with weighted tag profile
          │
          ▼
DeepSeek V3 returns recommendations + match reasons
          │
          ▼
Backend validates and filters response
          │
          ▼
Save to recommendations table (status = pending)
          │
          ▼
Frontend fetches and displays to user
```

---

## Signal Weights (Priority Order)

| Signal | Weight | Notes |
|---|---|---|
| Context tags on all logged books | Base (1x) | All read + rereading books |
| Last 3 tagged books | High (2x) | Recency boost |
| Did Not Finish tags | Negative | Suppress books with matching tags |
| Dismissed recommendation tags | Reduced | Lower weight on next run |

### Rules
- Minimum 3 tagged books required before engine runs
- If fewer than 3 tagged books: return insufficient_data — do not call DeepSeek
- Engine re-runs automatically when:
  - A new book is tagged
  - Tags are edited on any existing book
  - A recommendation is dismissed
- Engine can be manually triggered via POST /recommendations/refresh

---

## DeepSeek Integration

### Model
**DeepSeek-V3** — used for recommendation generation and match reason copy

### API Call (server-side only)
```javascript
const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT }
    ],
    temperature: 0.7,
    max_tokens: 1000
  })
});
```

---

## Prompt Structure

### System Prompt
```
You are a book recommendation engine for a reading app called Booktrovert.
You recommend books based on the contextual, emotional, and narrative
qualities of books a reader has previously read.

You only use tags from the fixed vocabulary provided.
You never invent new tags.
You return JSON only — no preamble, no explanation outside the JSON.
```

### User Prompt Template
```
A reader has logged the following books with these contextual tags:

[For each book in weighted tag profile:]
[Book Title] by [Author]
Pacing: [tags]
Emotional tone: [tags]
Writing style: [tags]
Structure: [tags]
Tropes: [tags]
Feeling after finishing: [tags]
Weight: [standard | high | negative]

Recommend 5 books that match this reader's taste.
Do not recommend books already in this list.

For each recommendation return:
- title
- author
- matched_tags (from fixed vocabulary only)
- match_reason (one sentence starting with "Because you loved the...")

Fixed tag vocabulary:
Pacing: slow burn, fast-paced, steady
Emotional tone: dark, hopeful, funny, melancholic, tense
Writing style: lyrical, dialogue-heavy, sparse, descriptive
Structure: non-linear, multiple POVs, unreliable narrator, epistolary
Tropes: enemies to lovers, found family, chosen one, redemption arc,
        morally grey protagonist, strong female lead, friends to lovers,
        second chance romance
Feeling after finishing: satisfied, wrecked, confused, wanting more

Return JSON only. No preamble. No markdown.
```

---

## Expected Response Format

```json
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "matched_tags": ["slow burn", "lyrical", "melancholic"],
    "match_reason": "Because you loved the slow burn and lyrical writing in [Book]"
  },
  {
    "title": "Book Title",
    "author": "Author Name",
    "matched_tags": ["fast-paced", "unreliable narrator", "tense"],
    "match_reason": "Because you loved the unreliable narrator and tense pacing in [Book]"
  }
]
```

---

## Response Validation Rules

After DeepSeek responds, before saving to the database:

- Parse JSON — explicitly strip any markdown block wrappers (e.g., ```json) before parsing. If malformed, retry once then return error
- Strip any recommendations where the book is already on the user's shelf
- Strip any tags in matched_tags that are outside the fixed vocabulary
- If 0 valid recommendations remain after filtering: lower tag
  specificity and retry once
- Save valid recommendations to recommendations table with status = pending

---

## Fallback Behavior

| Scenario | Response |
|---|---|
| Fewer than 3 tagged books | Do not call DeepSeek — return insufficient_data |
| DeepSeek API unavailable | Return cached recommendations if available, else show error state |
| Malformed JSON response | Retry once — if still malformed, return error state |
| All recs filtered out (on shelf already) | Lower specificity threshold and retry once |
| All recs dismissed by user | Auto-lower specificity and re-run engine |

---

## Tag Specificity Fallback Logic

If the engine cannot find enough recommendations at full specificity:

1. First pass: match on all tag dimensions
2. Fallback pass: match on top 3 weighted tag dimensions only
3. Final fallback: match on emotional tone and pacing only

Never return 0 recommendations if books exist in the system.
