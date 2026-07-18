# BOOKTROVERT
## Product Requirements Document: A Reader-Centric Book Tracking & Recommendation Platform
**Version:** 2.0 | **Status:** Post-Beta Update  
**Date:** July 16, 2026

---

## Changelog — v1 to v2

This version reflects feedback collected from a 7-person book club beta test conducted after the MVP launch.

| Change | Reason |
| :--- | :--- |
| **Added Point of View tag dimension** | 3 testers requested explicit first/second/third person tagging — current tropes/structure tags were too broad. |
| **Added Theme tag dimension** | Testers wanted thematic matching separate from tropes and tone. |
| **Expanded Tropes list** | Testers found existing trope options too limited for accurate matching. |
| **Flagged Add-to-Shelf bug** | One tester got stuck on this exact step and received zero recommendations as a result — highest priority fix. |
| **Added Reader Connections feature (new)** | 4 of 7 testers independently requested a way to connect with other readers — strongest unprompted signal in the entire survey. |
| **Increased recommendation count** | Increased from 3 to 5 minimum. Multiple testers asked for more recommendations per cycle. |
| **Added longer book description** | Added to the recommendation card. Testers wanted more than just the match reason — full context on the recommended book. |
| **Added Home Screen Install Prompt (new)** | Consumer retention requires home screen presence — users will not remember to revisit a website on their own. |

> **Note:** Native mobile app and AI-generated writing tools were requested by 1-2 testers each but are **not** included in this version due to insufficient demand signal relative to build cost at this stage.

---

## 1. Product Overview

### 1.1 Product Summary
Booktrovert is a minimalist web application that lets fiction readers track their reading and receive AI-powered book recommendations based on the contextual, emotional, and narrative qualities of books they have previously read — not just generic genre tags.

### 1.2 Problem Statement
Existing book discovery platforms (Goodreads, StoryGraph) recommend books primarily based on broad genre categories and collaborative filtering. This approach fails fiction readers who choose books based on pacing, emotional tone, writing style, narrative structure, and specific tropes. Beta testing confirmed this thesis directly — testers rated Booktrovert recommendations as more accurate than Goodreads or social media search in the majority of responses.

### 1.3 Product Vision
To be the first book tracking app that understands how readers *actually* choose books — and recommends accordingly.

### 1.4 Target Users
*   **Age Profile:** 15-35 (Gen Z: 15-25, Millennials: 26-35)
*   **Persona:** Avid fiction readers
*   **Pain Point:** Dissatisfied with standard genre-only recommendations
*   **Habits:** Active on BookTok, Bookstagram, and digital reading communities

### 1.5 Beta Test Results (7 Testers)
*   **5 of 7** testers rated likelihood to keep using the app at 4 or 5 out of 5.
*   **6 of 7** completed sign-up without difficulty.
*   **All** testers who reached the tagging step completed it in under 3 minutes.
*   **3 of 7** rated recommendations as "surprisingly accurate".
*   **3 of 7** rated Booktrovert better than Goodreads or social search; 0 rated it worse.
*   **4 of 7** independently requested a reader connection feature.

### 1.6 Success Metrics (Updated for v2)
*   **Onboarding Completion Rate:** >70%
*   **Books Logged:** 3 or more per active user in the first 7 days
*   **Recommendation Click-Through Rate (CTR):** >25%
*   **Day-7 Retention:** >40%
*   **Recommendation Dismissal Rate:** <30%
*   **Add-to-Shelf Completion Rate (New):** >95% *(specifically introduced to track the bug fix)*

---

## 2. Known Issues (Priority Fix)

### 2.1 Add-to-Shelf Failure
One beta tester reported getting stuck while adding a book to their shelf, which resulted in zero recommendations being generated. This is the **highest priority fix** for this version.

#### Required Actions:
1.  **Investigate:** Audit the shelf selection screen for failure points across browsers and mobile devices.
2.  **Confirm State:** Ensure the `userbook` record is successfully created and verified before navigating the user away from the screen.
3.  **Error Handling:** Add a clear, visible error state if the save fails, replacing silent failure behavior.
4.  **Telemetry:** Implement robust logging around this flow to catch future failures before users report them.

---

## 3. Updated Tagging System

### 3.1 Tag Dimensions (v2 — Expanded)
Based on beta feedback, two new tag dimensions have been added and the Tropes list has been expanded. The tag system remains fixed and curated — no free text or auto-generated tags are permitted.

| Dimension | Tag Options |
| :--- | :--- |
| **Pacing** | Slow burn, Fast-paced, Steady |
| **Emotional Tone** | Dark, Hopeful, Funny, Melancholic, Tense |
| **Writing Style** | Lyrical, Dialogue-heavy, Sparse, Descriptive |
| **Structure** | Non-linear, Multiple POVs, Unreliable narrator, Epistolary |
| **Point of View (NEW)** | First person, Second person, Third person limited, Third person omniscient |
| **Theme (NEW)** | Identity, Found family, Coming of age, Justice, Love and loss, Survival, Power and corruption |
| **Tropes (Expanded)** | Enemies to lovers, Chosen one, Redemption arc, Morally grey protagonist, Slow burn romance, Forced proximity, Second chance romance, Dark romance, Literary fiction, Legal thriller, Psychological thriller, Horror |
| **Feeling After Finishing** | Satisfied, Wrecked, Confused, Wanting more, Didn't like it |

### 3.2 Tag System Rules (Unchanged from v1)
*   **Fixed & Curated:** Tags are strictly selected from a fixed list — no free text and no fully auto-generated tags are allowed.
*   **Multi-Select:** Users can apply multiple tags per dimension.
*   **Engine Core:** Tags serve as the primary input signal for the AI recommendation engine.
*   **Evolution:** New tag dimensions are added solely as deliberate product decisions based on user demand, as demonstrated in this update.

### 3.3 Tag System Roadmap (Post-MVP, Unchanged)
LLM-assisted pre-selection from the fixed list remains the post-MVP plan. The LLM will read book metadata and pre-select relevant tags from the existing list; it will not generate new tags. Tag expansion will continue to be reviewed periodically based on user feedback patterns.

---

## 4. New Feature — Reader Connections

### 4.1 Why This Feature?
4 of 7 beta testers independently requested a way to connect with other readers without being prompted by the survey questions. This is the strongest unprompted signal from the entire beta round and points to a genuine gap: readers want to share taste, not just receive AI recommendations in isolation.

### 4.2 Feature Scope (v1 of this feature — MVP)
*   **Opt-In Discovery:** Users can explicitly opt in to a "Find Readers Like Me" view.
*   **Overlap Matching:** Matching is calculated based on tag overlap. Users with high tag overlap on logged books surface as suggested connections.
*   **Public Shelf Visibility:** Users can view another reader's public shelf (limited to *Read* and *Rereading* categories only) if that reader has opted in.
*   **Shared Taste Highlight:** Display common tags prominently: *"You both loved slow burn, morally grey protagonists."*
*   **No Messaging:** This MVP feature is read-only visibility (no direct messaging or chat functionality).

### 4.3 Explicitly Out of Scope for This Version
*   Direct messaging or chat between readers.
*   Book club or group discussion structures.
*   Public comments, threads, or reviews on books.
*   A formal following/follower social graph beyond simple connection suggestions.
*   Writing tools or authoring features.

### 4.4 Data Model Addition

```sql
CREATE TABLE reader_connections (
    connection_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    connected_user_id INT NOT NULL,
    shared_tags JSON, -- Computed field showing tag overlap
    visibility_opt_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (connected_user_id) REFERENCES users(id)
);
```

### 4.5 User Flow — Opting In and Finding Readers
1.  User goes to **Settings** and toggles **"Make my shelf discoverable"** (opt-in).
2.  User navigates to the new **"Find Readers"** tab.
3.  System surfaces other opted-in users ranked by tag overlap percentage.
4.  User taps a suggested reader profile to view shared tags and their public shelf.
5.  No messaging option is displayed; connection is passive and taste-driven.

### 4.6 Privacy Rules
*   **Strict Opt-In:** Visibility is strictly opt-in (default is `false`).
*   **Shelf Limits:** Only *Read* and *Rereading* shelves are visible to connections. *To Read*, *Currently Reading*, and *Did Not Finish* shelves are strictly private.
*   **Profile Minimization:** Only the user's chosen display name is shown. No emails, phone numbers, or account details are exposed.
*   **Instant Revocation:** Users can opt out at any time, immediately removing their visibility and profile from discoverability.

---

## 5. Updated Recommendation Output

### 5.1 Recommendation Count
The minimum recommendation count increases from **3 to 5 per cycle**, following beta feedback requesting more options per session.

### 5.2 Recommendation Card — Updated Fields
Each recommendation card will now display:
*   Book cover, title, and author
*   **Match Reason:** e.g., *"Because you loved the slow burn and lyrical writing in [Book]"*
*   **Matched Tags:** Explicit highlights of matching dimensions
*   **Book Description (NEW):** Full book synopsis retrieved from existing Books API metadata stored on the book record.
*   **Actions:** Quick buttons to *Add to Shelf* or *Dismiss*.

---

## 6. Home Screen Install Prompt (PWA)

### 6.1 Why This Feature?
Booktrovert is a consumer app competing for daily attention. Industry data shows home screen installation increases return visits by approximately **3x** compared to a regular bookmarked website. This feature transforms Booktrovert from a site users must remember to visit into a visible icon on their phone's home screen.

### 6.2 Platform Behavior Differs — Design for Both

| Platform | Behavior | Implementation Strategy |
| :--- | :--- | :--- |
| **Android / Chrome** | Supports native install prompts (`beforeinstallprompt` event). | App captures the event and triggers a custom, beautifully designed "Install Booktrovert" button within the UI. |
| **iOS / Safari** | No automatic install prompt exists on iOS. | App must display a custom, persistent in-app banner explaining the manual path. |

### 6.3 Prompt Trigger Rules
*   **No First-Visit Prompts:** Do not prompt users on their first visit.
*   **Value-Based Trigger:** Trigger the banner only after a meaningful action — specifically, once a user has tagged **3 books** (the same threshold that unlocks recommendations).
*   **Dismissal Cool-Down:** If a user dismisses the prompt, do not display it again for **14 days**.
*   **Post-Install Suppression:** If installed (running in standalone mode), never show the prompt again.

### 6.4 iOS-Specific Banner Requirements
Since iOS lacks native prompt support, the custom in-app banner must guide the user through the manual Safari utility:
1.  Tap the **Share** icon in Safari.
2.  Scroll down and select **"Add to Home Screen"**.
3.  Tap **"Add"** in the top right to confirm.

*Note: The banner must detect iOS Safari specifically, only display on that platform, and remain hidden if the app is already running in `standalone` mode.*

### 6.5 Manifest Requirements (Foundation Check)
Ensure the web app manifest (`manifest.json`) is correctly configured to guarantee installability across platforms:
*   `display: standalone` — Removes browser chrome once installed.
*   `start_url` and `scope` set explicitly (omitting these breaks iOS-specific standalone behavior).
*   Provide a full, high-resolution icon set, including iOS-specific touch icons.
*   `theme_color` and `background_color` matching the Booktrovert brand palette.

### 6.6 Update Delivery — Service Worker Strategy
To prevent caching issues (where iOS users do not receive app updates after adding to the home screen), configure the service worker correctly:
*   Use a **stale-while-revalidate** or version-checked caching strategy (never a raw cache-first strategy with no revalidation).
*   The service worker must check for a new version every time the app is opened.
*   New versions should download in the background and apply automatically on the next launch — no user-facing "reinstall" prompts are required.

### 6.7 Explicitly Out of Scope for This Version
*   Native iOS or Android builds (this feature is strictly a PWA enhancement).
*   Push notifications via the install (covered separately under existing Notifications Logic; strictly in-app notifications for this version).
*   Forced installation (users can always opt to use the web version in-browser).

---

*Booktrovert PRD v2.0 — Post-Beta Update. Sections not listed in this document (Data Models, full System Behavior, Edge Cases, Notifications, Security & Compliance) remain unchanged from v1 and should be referenced alongside this document.*
