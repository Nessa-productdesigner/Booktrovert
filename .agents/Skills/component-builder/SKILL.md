# SKILL.md — Component Builder

This document outlines the required technical competencies and domain knowledge needed to build the frontend UI components for the Booktrovert MVP. This role focuses on translating the design system and product requirements into reusable, interactive, and highly optimized UI blocks.

## 1. Component Architecture & Design System Integration
Transforming the provided CSS architecture into modular, reusable React + TypeScript components styled with Tailwind.

* **Prop API Design:** Building flexible components with clear prop interfaces (e.g., designing a `<BookCard />` that accepts `book`, `variant="shelf" | "recommendation"`, and `onAction` callbacks).
* **CSS Variable Mapping:** Strictly applying the custom Figma token variables (`var(--figma-ui3-bg)`, `var(--uix-design-system-spacing-sp-*)`, `var(--typography-*)`) defined in `variables.css` to component structures without hardcoding values.
* **Layout Composition:** Utilizing CSS Flexbox and Grid utility classes to create complex, responsive layouts, ensuring generous whitespace and single-column structures for mobile.

## 2. Interactive UI & Micro-State Management
Handling component-level interactivity, specifically focusing on the core, high-friction areas of the app.

* **Multi-Select Toggle Logic:** Building the critical "Context Tags" (chips) that handle their own selected/unselected visual states and emit clean arrays of data up to parent forms.
* **Form UI Engineering:** Building controlled input components for the manual book entry form (Title, Author) and the live-search bar, including debouncing user input to prevent API spam.
* **Progress Visualization:** Constructing the visual onboarding progress indicator that updates fluidly as the user logs and tags their initial 1–3 books.

## 3. Edge Case & Fallback Implementation
Ensuring the UI remains beautiful and functional when external data is missing or loading.

* **Image Handling:** Implementing robust `<img />` fallbacks. If the external books API fails to return a `cover_url`, the component must gracefully fallback to a generated visual (e.g., displaying the book title on a `var(--bg-base)` background with proper aspect ratio).
* **Loading States:** Building the CSS-driven shimmer/skeleton components for the AI Recommendation Cards while the matching engine processes tags.
* **Text Truncation:** Utilizing CSS line-clamp and text-overflow properties to handle exceptionally long book titles, author lists, or API-provided synopses without breaking the layout.

## 4. Mobile-First Accessibility (a11y)
Ensuring the application aligns with Gen Z's mobile-heavy usage patterns and standard accessibility guidelines.

* **Touch Targets:** Ensuring all interactive elements (Tags, "Add to Shelf" buttons, Share buttons) have a minimum touch target size of 44x44px to prevent tap frustration on mobile devices.
* **Semantic HTML:** Using proper HTML tags (`<button>` vs `<a>`, `<article>` for book cards) to ensure the DOM is readable by screen readers.
* **Focus & Keyboard Navigation:** Designing distinct visual focus states for keyboard users, ensuring the tag selection and form submissions are fully operable without a mouse.

## 5. View & Empty State Orchestration
Rendering contextual interfaces based on the specific conditions defined in the PRD.

* **Contextual Rendering:** Displaying the correct actions based on the shelf context (e.g., showing the "Share" button on both the "Currently Reading" and "Read" shelves).
* **Empty State Implementation:** Building clean, friendly fallback components with exact messaging (e.g., "Add your first book to get started") when users have 0 books on a shelf or fewer than 3 tagged books in recommendations.