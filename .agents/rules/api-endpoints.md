# api-endpoints.md — Booktrovert API Endpoints

Use this file when building backend routes, controllers,
or connecting the frontend to the backend.

---

## Rules That Apply to All Endpoints

- All external API calls (DeepSeek, Books API, OAuth) are made
  server-side only — API keys never reach the client
- All authenticated endpoints require a valid session token
- Session tokens are stored in httpOnly cookies — never localStorage
- All manual user input is sanitized before hitting the database
- Rate limiting is applied to /books/search

---

## Auth

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /auth/register | No | Create account with email + password |
| POST | /auth/login | No | Login with email + password |
| POST | /auth/oauth/google | No | OAuth login via Google |
| POST | /auth/oauth/apple | No | OAuth login via Apple |
| POST | /auth/logout | Yes | Invalidate session token |
| POST | /auth/reset-password | No | Send password reset email |
| POST | /auth/reset-password/confirm | No | Complete password reset with token |
| GET | /auth/me | Yes | Get current user profile and onboarding state |
| PATCH | /auth/onboarding | Yes | Mark onboarding as complete |

---

## Books

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /books/search?q= | Yes | Search external Books API — server-side |
| POST | /books/manual | Yes | Add a book manually |
| GET | /books/:book_id | Yes | Get single book metadata |

### /books/search behavior
- Hits external Books API server-side
- Returns: title, author, cover_url, synopsis, genre_tags
- If 0 results: return empty array — frontend shows manual entry prompt
- Rate limited to prevent abuse

### /books/manual required body
```json
{
  "title": "string — required",
  "author": "string — required",
  "cover_url": "string — optional",
  "synopsis": "string — optional",
  "shelf": "to_read | currently_reading | read | rereading | did_not_finish — required",
  "context_tags": "object — required if shelf is read or did_not_finish"
}
```

---

## Shelf

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /shelf | Yes | Get all userbook records for authenticated user |
| POST | /shelf | Yes | Add a book to a shelf |
| PATCH | /shelf/:userbook_id | Yes | Update shelf status or context tags |
| DELETE | /shelf/:userbook_id | Yes | Remove book from shelf |

### POST /shelf required body
```json
{
  "book_id": "uuid — required",
  "shelf": "to_read | currently_reading | read | rereading | did_not_finish",
  "context_tags": {
    "pacing": [],
    "emotional_tone": [],
    "writing_style": [],
    "structure": [],
    "tropes": [],
    "feeling_after_finishing": []
  }
}
```

### Rules
- If shelf = read or did_not_finish: context_tags must have at least
  one tag before saving
- If shelf = to_read or currently_reading: context_tags can be empty
- PATCH triggers recommendation re-run if context_tags are updated
- **External IDs:** If `POST /shelf` receives an external `book_id` not yet in the DB, the backend must fetch and insert the book metadata first.

---

## Recommendations

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | /recommendations | Yes | Get current recommendation set for user |
| POST | /recommendations/dismiss/:rec_id | Yes | Dismiss a recommendation |
| POST | /recommendations/save/:rec_id | Yes | Save recommendation to shelf |
| POST | /recommendations/refresh | Yes | Manually trigger recommendation re-run |

### GET /recommendations behavior
- Returns recommendations with status = pending only
- If user has fewer than 3 tagged books: return empty array with
  reason: "insufficient_data"
- Frontend shows empty state when reason = "insufficient_data"

### POST /recommendations/dismiss behavior
- Sets status = dismissed on the record
- Reduces weight of matched_tags in next engine run
- Auto-refreshes pool if all recommendations are dismissed

---

## Share Links

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /share | Yes | Generate share link |
| GET | /share/:token | No | Public — fetch book + reader tags |

### POST /share required body
```json
{
  "book_id": "uuid — must be on currently_reading or read shelf"
}
```

### GET /share/:token behavior
- No auth required
- Returns: book cover, title, author, reader's context_tags
- Returns no PII — display_name is not returned
- If token not found: return 404

---

## Error Response Format

All endpoints return errors in this shape:

```json
{
  "error": true,
  "code": "ERROR_CODE",
  "message": "Human readable message"
}
```

### Common error codes
| Code | Meaning |
|---|---|
| MISSING_FIELDS | Required fields not provided |
| BOOK_NOT_FOUND | Book not found in API or database |
| UNAUTHORIZED | No valid session token |
| INSUFFICIENT_DATA | Fewer than 3 tagged books for recommendations |
| TOKEN_NOT_FOUND | Share link token does not exist |
| RATE_LIMITED | Too many requests to search endpoint |
