# SKILL.md — Auth & Routing Architect

This document outlines the required technical competencies and domain knowledge needed to implement the Booktrovert 100% Client-Side routing and authentication architecture. This role ensures the app is secure, routes are properly guarded, and session state is globally accessible.

## 1. Global Session Initialization
Implementing the blocking architecture defined in `auth-flow.md`.

* **The `<AuthProvider>`:** Building a top-level React component that wraps the entire application. It must display a full-screen loading state (e.g., logo spinner) while it executes `supabase.auth.getSession()` on initial mount.
* **Global State Management:** Using a lightweight state manager (like Zustand or React Context) to store the active session token and user profile data (`useAuthStore`).
* **Session Hydration:** Automatically clearing the store and redirecting to `/login` if the session is invalid or missing, and populating the store if the JWT is valid.

## 2. Supabase Auth Integration
Handling the native client-side authentication flows.

* **Email & Password Login:** Implementing the login form to call `supabase.auth.signInWithPassword()` directly from the client.
* **Registration & Compliance:** Implementing the signup form to call `supabase.auth.signUp()`, ensuring the UI enforces the mandatory COPPA "13 or older" checkbox before submission.
* **Password Resets:** Building the client-side flow to request a reset email and handle the callback using `supabase.auth.updateUser()`.
* **No Manual Hashing:** Adhering strictly to the rule that all password hashing is handled invisibly by Supabase; the client NEVER hashes passwords.

## 3. Route Guarding & Navigation
Protecting private screens and orchestrating the user journey.

* **Private Routes:** Creating a higher-order component or route wrapper that kicks unauthenticated users back to the `/login` screen if they attempt to access `/shelf` or `/recommendations`.
* **Onboarding Redirection:** Checking the `onboarding_complete` boolean on the user's profile. If `false`, the user must be forcefully routed to the `/onboarding` flow, regardless of which private route they try to access.
* **Public Share Routes:** Ensuring that specific routes like `/share/:token` explicitly bypass the `<AuthProvider>` blocking logic so they can be viewed by users without an account.

## 4. Auth Error Handling
Ensuring the user receives clear, actionable feedback during auth failures.

* **Graceful Rejection:** Catching Supabase auth errors (e.g., `401 Invalid credentials`, `409 User already registered`) and mapping them to clean, user-friendly UI error messages on the forms.
