# SKILL.md — DeepSeek LLM Recommendation Agent Guide

## 1. Objective
This document provides exact operational instructions for the AI agent responsible for scaffolding the AI Recommendation Engine using the DeepSeek API. The goal is to ingest a user's reading history and context tags, analyze their narrative preferences, and return highly specific book recommendations formatted as clean JSON.

---

## 2. Target Internal Endpoint
The agent must scaffold the following internal route to serve the client:

* **Route:** `POST /api/recommendations/generate`
* **Request Body:** ```json
    {
      "userId": "String",
      "recentBooks": [
        { "title": "String", "author": "String", "tags": ["String"] }
      ],
      "didNotFinishTags": ["String"],
      "dismissedTags": ["String"]
    }
    ```
* **Purpose:** To generate 3-5 personalized book recommendations based on user tags.

---

## 3. DeepSeek API Integration Rules
The agent must use the standard OpenAI SDK but route it to DeepSeek's servers.

* **SDK:** Use the official `openai` package (Node.js/Python).
* **Configuration:**
    * `baseURL`: `https://api.deepseek.com`
    * `apiKey`: Inject via `DEEPSEEK_API_KEY` environment variable.
    * `model`: `deepseek-chat` (DeepSeek's flagship V3/V4 model).
    * `response_format`: `{ type: "json_object" }` (CRITICAL to prevent markdown crashes).
* **Security Context:** This execution must happen entirely server-side.

---

## 4. Prompt Engineering Architecture
The agent must construct the LLM call using strict System and User prompts to enforce Booktrovert's logic.

**System Prompt:**
> "You are the recommendation engine for Booktrovert, a reading app for Gen Z/Millennial fiction readers. Your job is to recommend books based on narrative DNA (pacing, tone, writing style, structure, tropes) rather than just genre. 
> 
> You must output strictly in JSON format. Do not include markdown formatting or conversational text. The JSON must be an array of objects matching this exact schema:
> { 'recommendations': [ { 'title': 'Book Title', 'author': 'Author Name', 'match_reason': 'A 1-sentence explanation of why they will like it, referencing their specific tags', 'matched_tags': ['tag1', 'tag2'] } ] }
> 
> You MUST ONLY use tags from this exact vocabulary. NEVER invent new tags:
> Pacing: slow burn, fast-paced, steady
> Tone: dark, hopeful, funny, melancholic, tense
> Style: lyrical, dialogue-heavy, sparse, descriptive
> Structure: non-linear, multiple POVs, unreliable narrator, epistolary
> Tropes: enemies to lovers, found family, chosen one, redemption arc, morally grey protagonist, strong female lead, friends to lovers, second chance romance
> Feeling: satisfied, wrecked, confused, wanting more"

**User Prompt Structure:**
The agent must dynamically inject the user's data into the User prompt:
> "Generate 3 book recommendations for a user. 
> RECENT LOVED BOOKS: [Insert recentBooks data]
> NEGATIVE SIGNALS (Avoid these): [Insert didNotFinishTags]
> DISMISSED TAGS (Deprioritize): [Insert dismissedTags]
> Ensure the recommended books are real, published fiction titles."

---

## 5. Data Transformation & Schema Mapping
Because LLMs can occasionally hallucinate or break formatting, the backend must parse and validate the DeepSeek response before saving it to the database.

* **JSON Parsing:** Extract the JSON string from the LLM's response content, explicitly strip any markdown block wrappers (e.g., ```json and ```) via regex or string replacement, and then call `JSON.parse()`.
* **Validation:** Ensure each recommendation contains `title`, `author`, `match_reason`, and `matched_tags`.
* **Database Sync:** After generation, the backend should loop through the suggested titles, fetch their cover URLs from the Google Books (or Open Library) API built earlier, and insert the final payloads into the `Recommendations` table.

---

## 6. Error Handling & Edge Cases
The agent must program the route to gracefully handle LLM-specific edge cases.

* **JSON Parse Failure:** If the LLM returns malformed JSON, catch the parsing error and execute exactly one retry with a stronger instruction to "RETURN ONLY VALID JSON".
* **Timeout/Rate Limit:** If DeepSeek returns a 429 (Too Many Requests) or times out, return a `503 Service Unavailable` status code to the frontend with the message `"The recommendation engine is currently cooling down. Please try again in a moment."`
* **Insufficient Data:** If the request body contains fewer than 3 tagged books, immediately return a `400 Bad Request` before hitting the DeepSeek API to save tokens.