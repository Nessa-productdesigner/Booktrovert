# SKILL.md — Supabase Client Integrator

This document outlines the required technical competencies and domain knowledge needed to build the data layer for the Booktrovert frontend. Because Booktrovert uses a lightweight architecture, the frontend communicates directly with the Supabase PostgreSQL database for all standard CRUD operations.

## 1. Direct Database Querying
Fetching and mutating data directly from the React client.

* **Client Initialization:** Properly configuring the `@supabase/supabase-js` client using the public `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables.
* **No Middlemen:** Strictly avoiding the creation of custom backend API routes for standard operations. All queries (fetching shelves, logging books) must be executed directly via the client (e.g., `supabase.from('userbooks').insert(...)`).
* **Relational Fetching:** Using PostgREST syntax to efficiently fetch nested data in a single network request (e.g., fetching a user's `userbooks` records and instantly joining the connected `books` metadata).

## 2. Real-Time UI State Syncing
Bridging the gap between frontend state and database state.

* **Optimistic UI Updates:** Updating the React UI immediately when a user moves a book between shelves or applies tags, and rolling back the UI state if the Supabase network request subsequently fails.
* **Loading States:** Handling asynchronous database requests smoothly by exposing `isLoading` states to the component builder so they can render skeleton loaders or spinners.

## 3. Data Integrity & Tag Enforcement
Ensuring the data sent to the database matches the strict Booktrovert rules.

* **Tag Serialization:** Converting the complex multi-select UI state (pacing, tone, style, etc.) into a clean, flat JSON object before inserting it into the `userbooks.context_tags` column.
* **Vocabulary Enforcement:** Validating that no rogue or custom tags are ever sent to the database; the client must only submit tags that exist in the approved Booktrovert fixed vocabulary list.
* **Negative Signal Triggers:** Automatically prompting the user to apply tags if they move a book from the "Currently Reading" shelf to the "Did Not Finish" shelf.

## 4. Integration with Serverless Proxies
Calling the backend only when absolutely necessary.

* **Books API & DeepSeek Invocation:** Knowing when NOT to query the database directly. The client integrator must trigger the backend API routes (`/api/books/search` and `/api/recommendations/generate`) when external APIs are involved, ensuring API keys remain protected.
* **Secure Invocation:** Ensuring the user's active Supabase session token is securely attached to any requests sent to these serverless proxies.
