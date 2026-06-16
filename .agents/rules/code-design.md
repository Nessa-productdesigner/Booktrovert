---
trigger: always_on
---

# Booktrovert: Product Requirements & System Design Specification

## 1. Product Overview
[cite_start]Booktrovert is a minimalist web application designed to allow fiction readers to track their reading and receive AI-powered book recommendations based on contextual, emotional, and narrative qualities, rather than just genre tags[cite: 7]. [cite_start]The platform is built specifically for avid Gen Z and Millennial fiction readers (ages 15–35) who find genre-only recommendations insufficient and prefer discovery based on pacing, writing style, and emotional tone[cite: 10, 14, 15, 16, 17]. [cite_start]The core vision is to serve as the first tracking app that understands how readers actually choose books by analyzing a book's narrative DNA[cite: 13].

---

## 2. Core Features
* [cite_start]**Book Shelf and Tracker:** Users log books into five distinct shelves: To Read [cite: 50][cite_start], Currently Reading [cite: 51][cite_start], Read [cite: 52][cite_start], Rereading [cite: 53][cite_start], and Did Not Finish[cite: 54]. [cite_start]Books on the "Read" or "Did Not Finish" shelves prompt the user to apply context tags[cite: 55].
* [cite_start]**Book Search and Manual Entry:** Search queries pull metadata (title, author, cover, synopsis, genre) from an external books API[cite: 58]. [cite_start]If a book is not found, users are prompted to add it manually[cite: 59]. [cite_start]Manual entry requires a Title, Author, and at least one context tag[cite: 60].
* [cite_start]**User Tagging System:** The primary engine of the platform, utilizing a fixed, curated list of tags to ensure clean data[cite: 62, 65, 68]. [cite_start]Users can multi-select tags across several dimensions[cite: 63, 66]:
    * [cite_start]**Pacing:** Slow burn, Fast-paced, Steady[cite: 63].
    * [cite_start]**Emotional tone:** Dark, Hopeful, Funny, Melancholic, Tense[cite: 63].
    * [cite_start]**Writing style:** Lyrical, Dialogue-heavy, Sparse, Descriptive[cite: 63].
    * [cite_start]**Structure:** Non-linear, Multiple POVs, Unreliable narrator, Epistolary[cite: 63].
    * [cite_start]**Tropes:** Enemies to lovers, Found family, Chosen one, Redemption arc, Morally grey protagonist, Strong Female lead, Friends to lovers, Second chance romance[cite: 63].
    * [cite_start]**Feeling after finishing:** Satisfied, Wrecked, Confused, Wanting more[cite: 63].
* [cite_start]**AI Recommendation Engine:** Generates personalized recommendations by weighing the user's applied context tags, prioritizing recent reads, and utilizing explicit feedback such as recommendation dismissals[cite: 81, 82, 85, 86].
* [cite_start]**Shareable Reading Link:** Users can generate a public, unique link to share what they are reading (or have read) outside the app[cite: 93, 94]. [cite_start]The linked page displays the book details. If tags were applied (e.g., from the Read shelf), they are also displayed. No login required[cite: 95].

---

## 3. User Flow
### 3.1 Onboarding Flow
* [cite_start]**Step 1:** Account creation via email and password[cite: 99].
* [cite_start]**Step 2:** User is prompted with "What have you read recently?" and searches to log a minimum of 1–3 books[cite: 100].
* [cite_start]**Step 3:** For each logged book, the user applies context tags across all dimensions[cite: 101]. [cite_start]This step cannot be skipped[cite: 105].
* [cite_start]**Step 4:** The application generates the first set of recommendations immediately after tagging is completed[cite: 102].
* [cite_start]**Step 5:** The user lands on their home screen shelf[cite: 103].
* [cite_start]*Note:* A progress indicator is shown throughout, and the flow must be completable in under 3 minutes[cite: 98, 104].

### 3.2 Adding a Book
* [cite_start]User taps "Add book" and searches by title or author[cite: 107, 108].
* [cite_start]Results are pulled from the external books API in real time[cite: 109].
* [cite_start]User selects a book and chooses a shelf (To Read, Currently Reading, Read, Rereading, Did Not Finish)[cite: 110, 111].
* [cite_start]If "Read" or "Did Not Finish" is selected, the tag screen appears for the user to apply context tags before saving[cite: 112, 113].
* [cite_start]If "To Read" or "Currently Reading" is selected, the book is saved without tags[cite: 114].

### 3.3 Getting Recommendations
* [cite_start]User navigates to the Recommendations tab[cite: 116].
* [cite_start]The engine runs tag-matching logic and displays recommendations[cite: 117].
* [cite_start]Each recommendation shows the book cover, title, author, matched tags, and a match reason (e.g., "Because you loved the slow burn and lyrical writing in [Book]")[cite: 88, 89, 90, 118].
* [cite_start]User can add the book to a shelf, share it, or dismiss it[cite: 91, 119]. [cite_start]Dismissed recommendations are removed, and the pool refreshes automatically[cite: 120].

### 3.4 Sharing a Book
* [cite_start]User opens a book on their Currently Reading or Read shelf and taps "Share"[cite: 122, 123].
* [cite_start]A shareable link with a unique token is generated[cite: 124].
* [cite_start]The recipient opens the link and views the book details. If the book is on the Read shelf, the reader's context tags are also displayed. No login required[cite: 126].

---

## 4. Data Models / Schemas
### 4.1 User
* [cite_start]`user_id` — unique identifier [cite: 129]
* [cite_start]`email` [cite: 130]
* [cite_start]`display_name` [cite: 132]
* [cite_start]`is_13_or_older` — boolean used for COPPA age verification [cite: 133]
* [cite_start]`created_at` [cite: 134]
* [cite_start]`onboarding_complete` — boolean [cite: 135]

### 4.2 Book
* [cite_start]`book_id` — unique identifier [cite: 136]
* [cite_start]`title` [cite: 137]
* [cite_start]`author` [cite: 138]
* [cite_start]`cover_url` [cite: 139]
* [cite_start]`synopsis` [cite: 140]
* [cite_start]`genre_tags` — pulled from API [cite: 141]
* [cite_start]`source` — flag for API or manual entry [cite: 142]
* [cite_start]`created_at` [cite: 143]

### 4.3 UserBook (Join Table)
* [cite_start]`userbook_id` [cite: 145]
* [cite_start]`user_id` — foreign key [cite: 146]
* [cite_start]`book_id` — foreign key [cite: 147]
* [cite_start]`shelf` — enum (to_read, currently_reading, read, rereading, did_not_finish) [cite: 148]
* [cite_start]`context_tags` — JSON storing all selected tag dimensions and values [cite: 149]
* [cite_start]`added_at` [cite: 150]
* [cite_start]`updated_at` [cite: 151]

### 4.4 Recommendation
* [cite_start]`rec_id` [cite: 153]
* [cite_start]`user_id` — foreign key [cite: 154]
* [cite_start]`book_id` — foreign key [cite: 155]
* [cite_start]`match_reason` — generated string explanation [cite: 156]
* [cite_start]`matched_tags` — JSON [cite: 157]
* [cite_start]`status` — enum (pending, dismissed, saved) [cite: 158]
* [cite_start]`generated_at` [cite: 159]

### 4.5 ShareLink
* [cite_start]`link_id` [cite: 161]
* [cite_start]`user_id` — foreign key [cite: 162]
* [cite_start]`book_id` — foreign key [cite: 163]
* [cite_start]`token` — unique public token [cite: 164]
* [cite_start]`created_at` [cite: 165]
* [cite_start]`expires_at` — optional [cite: 166]

---

## 5. System Behavior
* [cite_start]**Engine Triggers:** The recommendation engine re-runs when a new book is tagged, existing tags are edited, or a recommendation is dismissed[cite: 169].
* **Weighting & Signals:**
    * [cite_start]Context tags applied to logged books hold the highest weight[cite: 82].
    * [cite_start]Books marked "Read" with positive tags act as positive signals[cite: 83].
    * [cite_start]Books marked "Did Not Finish" act as negative signals to actively suppress similar books[cite: 84, 170].
    * [cite_start]Recency weighting applies a 2x multiplier to the last 3 tagged books compared to older entries[cite: 85, 171].
    * [cite_start]Dismissed recommendations explicitly reduce the weight of their matched tags[cite: 86].
* [cite_start]**Tag Persistence:** Tags are stored per `UserBook` record, ensuring that if two users log the same book differently, the tags do not merge or average[cite: 180, 181].
* [cite_start]**Minimum Threshold:** A minimum of 3 tagged books is required before recommendations can be generated[cite: 172].

---

## 6. Edge Cases
* [cite_start]**Missing Required Input:** If a user attempts onboarding with fewer than the minimum required books, they are blocked, and the progress indicator highlights the missing step[cite: 185].
* [cite_start]**Book Not Found in API:** If the API returns 0 results, a prompt is shown stating "Cannot find this book" with an option to add it manually[cite: 177, 185, 187].
* [cite_start]**External API Unavailable:** The system will show a loading state, retry once automatically, and if it still fails, state that search is unavailable and offer a manual entry option[cite: 185].
* [cite_start]**Empty State — 0 Books Logged:** The shelf displays: "Add your first book to get started. The more you log, the better your recommendations get"[cite: 187].
* [cite_start]**Empty State — Fewer Than 3 Books Tagged:** The Recommendations tab displays: "Log and tag at least 3 books to unlock your first recommendations"[cite: 185, 187].
* [cite_start]**All Recommendations Dismissed:** The pool automatically refreshes from broader tag matches by applying a lower specificity threshold; no user action is required[cite: 185, 187].
* [cite_start]**Shelf Changes:** Moving a book from "Currently Reading" to "Did Not Finish" immediately triggers the tag screen, saving those tags as negative signals[cite: 185].

---

## 7. Notifications Logic
* **In-App Triggers:**
    * [cite_start]New recommendations available notification is sent after a user logs and tags a new book[cite: 190].
    * [cite_start]Tag reminder is sent if a user adds a book to the "Read" shelf without tagging it after 24 hours[cite: 191].
    * [cite_start]Onboarding nudge is sent if an account is created but onboarding is incomplete within 48 hours[cite: 192].
* **Rules:**
    * [cite_start]Maximum of 1 notification per day per user[cite: 194].
    * [cite_start]No notifications are sent during the active onboarding flow[cite: 195].
    * [cite_start]Users can disable all notifications from their settings[cite: 196].
    * [cite_start]No third-party marketing notifications are allowed at the MVP stage[cite: 197].

---

## 8. Security & Compliance Considerations
* [cite_start]**Authentication:** Passwords must be stored as hashed values, never in plain text[cite: 200]. [cite_start]Session tokens expire after 30 days of inactivity[cite: 202]. [cite_start]Password resets occur exclusively via email verification links[cite: 203].
* [cite_start]**API Security:** External books API calls are executed server-side to ensure API keys are never exposed to the client[cite: 210]. [cite_start]Rate limiting is enforced on search endpoints, and manual entries are sanitized prior to database storage to prevent injection attacks[cite: 211, 212].
* [cite_start]**Data Privacy:** User reading data is private by default and not visible to other users[cite: 205]. [cite_start]Public share links expose only the book title, author, and context tags, stripping all personally identifiable information[cite: 206, 207].
* **Compliance:**
    * [cite_start]**GDPR:** Required for European users (consent banners, data export, right to deletion)[cite: 214]. [cite_start]Users can delete their account and data at any time[cite: 208].
    * [cite_start]**COPPA:** Users under 13 are not permitted, enforced via an age gate at signup[cite: 215].
    * [cite_start]**CCPA:** Required for California users; privacy policies must clearly disclose data usage[cite: 216].