# SKILL.md — Google Books API Route Agent Guide

## 1. Objective
This document provides exact operational instructions for the AI agent responsible for scaffolding and implementing the backend API routes that interface with the Google Books API. The goal is to build secure, resilient, and standardized endpoints that supply the Booktrovert frontend with book metadata.

---

## 2. Target Internal Endpoint
The agent must scaffold the following internal route to serve the client:

*   **Route:** `GET /api/books/search`
*   **Query Parameters:** `?q={search_string}`
*   **Purpose:** To query the external Google Books API in real time.

---

## 3. Google Books API Integration Rules
When constructing the handler for `GET /api/books/search`, the agent must adhere to these exact steps:

*   **Endpoint:** Call `https://www.googleapis.com/books/v1/volumes?q={query}&key={SERVER_SIDE_API_KEY}`.
*   **Security Context:** The Google Books API key must be injected via environment variables and executed strictly server-side; it must never be exposed to the client.
*   **Rate Limiting:** The agent must implement a rate-limiting middleware on the internal `/api/books/search` endpoint to prevent abuse of the external API.

---

## 4. Data Transformation & Schema Mapping
The Google Books API returns deeply nested and inconsistent objects. The agent must map the Google `volumeInfo` object to the exact Booktrovert schema before returning the response to the client.

*   **`title`:** Map from `volumeInfo.title`.
*   **`author`:** Map from `volumeInfo.authors` (Extract the first author or join as a comma-separated string). Fallback to "Unknown Author" if missing.
*   **`cover_url`:** Map from `volumeInfo.imageLinks.thumbnail`. Ensure `http://` is replaced with `https://`. Return `null` if `imageLinks` is undefined.
*   **`synopsis`:** Map from `volumeInfo.description`.
*   **`genre_tags`:** Map from `volumeInfo.categories` into a flat array of strings.
*   **`source`:** Hardcode the value to `"api"`.

**Expected Output JSON Structure:**
```json
{
  "results": [
    {
      "title": "String",
      "author": "String",
      "cover_url": "String | null",
      "synopsis": "String | null",
      "genre_tags": ["String"],
      "source": "api"
    }
  ]
}
```

---

## 5. Error Handling & Edge Cases
The agent must program the route to gracefully handle external API failures to support the frontend fallback flows.

*   **0 Results Found:** If Google Books returns `totalItems: 0` or an empty items array, do not throw an error. Return a `200 OK` with an empty array (`{ "results": [] }`) so the frontend can display the "Add manually" option.
*   **API Timeout / 5xx Errors:** If the external fetch times out or returns a server error, catch the exception and return a clean `503 Service Unavailable` status code. This signals the frontend to attempt exactly one retry before falling back to manual entry.