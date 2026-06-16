# SKILL.md — Database Migration & Schema Architect

This document outlines the required technical competencies and domain knowledge needed to design, implement, secure, and deploy the database migrations for the Booktrovert MVP. This role is responsible for translating the theoretical data models into a robust, high-performance Supabase PostgreSQL database.

## 1. Supabase CLI & Version Control
Managing the safe evolution of the database state exclusively through the Supabase CLI.

* **No Manual GUI Edits:** All database schema changes must be generated locally using `supabase migration new` and tracked in version control. Never use the Supabase web dashboard to create or modify tables manually.
* **Pure PostgreSQL:** Converting the PRD's Data Models into executable database schema definitions using pure SQL DDL rather than relying on abstract ORMs like Prisma, Drizzle, or TypeORM, strictly aligning with the lightweight Supabase architecture.
* **Rollback Strategies:** Writing idempotent, version-controlled migration files ensuring the system can recover safely.

## 2. Row Level Security (RLS)
Supabase enforces RLS by default. Writing secure access policies is critical for data privacy.

* **Private Shelves:** Writing RLS policies to ensure that users can only read, insert, update, or delete their own `userbooks` records.
* **Public Share Links:** Creating strict, read-only RLS policies that allow the frontend to fetch specific book and tag data for a public share link, ensuring no other private data is exposed.
* **Strict Auth Linkage:** Utilizing `auth.uid()` in PostgreSQL policies to tie data securely to the active session token.

## 3. Schema Alignment & Constraints
Executing the exact tables defined in the `schema.md` specification and ensuring bad data never enters the database.

* **No Passwords in Public Schema:** Adhering to the rule that passwords are handled securely by Supabase in the hidden `auth.users` table. The public `users` profile table MUST NOT contain a `password_hash` column.
* **COPPA Enforcement:** Ensuring the `is_13_or_older` boolean column is strictly required in the public users schema to enforce the age gate at the database level.
* **Data Integrity:** Establishing strict foreign keys (e.g., linking `UserBooks` to both `Users` and `Books`) and defining explicit cascade/restrict rules (e.g., `ON DELETE CASCADE` if a user deletes their account).

## 4. Indexing & Performance Optimization
Designing the database structure to support the rapid querying required by the AI recommendation engine and UI.

* **Primary Key Indexing:** Ensuring all `_id` columns are properly indexed.
* **Foreign Key Indexing:** Manually adding indexes to foreign keys (`user_id`, `book_id`) to speed up join operations when fetching a user's shelf.
* **JSONB Query Optimization:** The `context_tags` are stored as JSON. Setting up GIN indexes in PostgreSQL is required to allow the recommendation engine to rapidly scan and match user tags across thousands of records without bottlenecking the database.

## 5. Data Seeding
Creating the foundational data required for the app to function immediately upon deployment.

* **Seed Scripts:** Using `supabase/seed.sql` to populate the database with dummy books, users, and the required baseline `userbooks` records so developers can test the recommendation engine and edge cases before launch.