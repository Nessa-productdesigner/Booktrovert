---
trigger: always_on
---

# auth-flow.md — Booktrovert Authentication & Security

Use this file when building login, registration, OAuth,
session management, or any security-related feature.

---

## Auth Methods

| Method | Description |
|---|---|
| Email + password | Standard registration and login |

---

## Registration Flow (Email + Password)

User submits email + password
│
▼
Client calls `supabase.auth.signUp()`
Supabase validates email format and password requirements
│
▼
Supabase automatically hashes password and saves to `auth.users`
│
▼
Trigger (or client) creates public user record in `users` table
onboarding_complete = false
│
▼
Session token generated
Supabase client stores session securely
│
▼
User redirected to onboarding flow


---

## Login Flow (Email + Password)

User submits email + password
│
▼
Client calls `supabase.auth.signInWithPassword()`
│
▼
Supabase securely compares password hash internally
│
┌────┴────┐
Match      No match
│            │
▼            ▼
Session token   Return Error
generated       "Invalid credentials"
│
▼
Supabase client stores session securely
│
▼
If onboarding_complete = false → redirect to onboarding
If onboarding_complete = true → redirect to shelf


---


## Session Validation & Hydration Flow (Lightweight Client-Side)

To keep the MVP architecture lightweight, minimize serverless function costs, and ensure rapid deployment, this application uses a 100% Client-Side routing and authentication strategy.

### 1. The Architecture Flow
When the application initializes, a global `<AuthProvider>` component blocks the UI from rendering until the Supabase session is confirmed.

```text
[App Initialization / Page Refresh]
        │
        ▼
[Global <AuthProvider> Mounts]
Displays a full-screen loading state (e.g., Booktrovert Logo Spinner).
        │
        ▼
Executes `supabase.auth.getSession()` on the client
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[Session Valid / JWT Ok]      [Session Invalid / Missing]
   │                             │
   ▼                             ▼
1. Populate `useAuthStore`     1. Clear `useAuthStore`
2. Fetch `onboarding` status   2. Remove Loading State
3. Remove Loading State        3. Render `/login` component
   │
   ▼
Check Profile Onboarding Status
   │
   ├─► `onboarding_complete: true`  ──► Render `/shelf` component
   └─► `onboarding_complete: false` ──► Render `/onboarding` component
```

## Session Management

| Rule | Detail |
|---|---|
| Token storage | Supabase client handles storage (defaults to secure localStorage logic). |
| CSRF Protection | Handled inherently by Supabase Auth for client-side API requests. |
| Token expiry | Managed automatically by Supabase (refreshed via `supabase.auth.onAuthStateChange`). |
| Token on logout | Invalidated immediately using `supabase.auth.signOut()`. |
| Token on each request | Attached automatically by the Supabase client to all Supabase database requests. |
| Invalid token | Client-side router redirects to `/login`. |

---

## Password Reset Flow

User submits email on reset page
│
▼
Backend checks if email exists in users table
│
┌────┴────┐
Exists     Not found
│            │
▼            ▼
Send reset     Return generic success message
email          (do not reveal if email exists to prevent enumeration)
│
▼
User clicks link in email
│
▼
Supabase validates reset token
│
▼
User submits new password via `supabase.auth.updateUser()`
│
▼
Supabase automatically hashes and saves new password
Old session tokens invalidated
│
▼
User redirected to login


---

## Application Security Rules

| Rule | Implementation |
|---|---|
| Passwords | Handled securely by Supabase `auth.users`. Minimum 8 characters, 1 number, 1 special character enforced by Supabase. |
| API keys | Server-side only — never sent to the client or exposed in frontend code. |
| CORS | Strict Cross-Origin Resource Sharing policy. Only the official Booktrovert frontend domain can query the backend. |
| Input sanitization | All user input (especially manual book entries and search queries) sanitized before hitting the database to prevent SQLi/XSS. |
| Rate limiting | Applied heavily to `/books/search`, `/auth/login`, and `/auth/reset` endpoints. |
| Public share pages | Return ONLY: title, author, `context_tags`. Absolutely no PII (email, user ID, real name). |
| User data privacy | Private by default — no user can see another user's private shelf data or unfinished reading status. |
| Age gate | Users under 13 not permitted — enforced at registration via a mandatory checkbox. |

---

## Compliance

| Regulation | What to implement |
|---|---|
| GDPR | Consent banner on first visit, data export endpoint, account deletion removes all user data. |
| COPPA | Age gate at signup — mandatory checkbox confirming user is 13 or older. |
| CCPA | Privacy policy page must disclose what data is collected and how it is used. |

---

## Error Responses for Auth Endpoints

| Scenario | Response |
|---|---|
| Email already registered | `409 Conflict` — "An account with this email already exists" |
| Invalid credentials | `401 Unauthorized` — "Invalid email or password" |
| Invalid or expired session | `401 Unauthorized` — redirect to login |
| Password reset token expired | `400 Bad Request` — "This reset link has expired" |
| User under 13 | `403 Forbidden` — "You must be 13 or older to use Booktrovert" |