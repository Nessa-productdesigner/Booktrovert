---
trigger: always_on
---

# design-system.md — Booktrovert Design System

Use this file when building UI components, screens, or styling anything in the frontend.

---

## 1. The Single Source of Truth

Booktrovert uses a custom design system exported from Figma tokens (`colours.tokens.json` and `typography.tokens.json`). These tokens have been converted into CSS variables and are stored in `variables.css`.

**CRITICAL RULE:** The `variables.css` file is the absolute source of truth for all styling. It **overrides** the default Tailwind CSS design system. 

When building UI components, you MUST use these CSS variables rather than falling back to default Tailwind utilities or arbitrary values, either by mapping them in `tailwind.config.ts` or by using them directly (e.g., `bg-[var(--figma-ui3-bg-brand)]`).

---

## 2. Available Token Categories

### 2.1 Colors (`--figma-ui3-*`)
All colors follow the Figma UI3 naming convention. Do not use generic Tailwind colors like `text-red-500` or `bg-blue-600`.
- **Backgrounds:** `--figma-ui3-bg`, `--figma-ui3-bg-brand`, `--figma-ui3-bg-danger`, `--figma-ui3-bg-selected`, etc.
- **Borders:** `--figma-ui3-border`, `--figma-ui3-border-brand`, etc.
- **Icons:** `--figma-ui3-icon`, `--figma-ui3-icon-brand`, etc.
- **Text:** `--figma-ui3-text`, `--figma-ui3-text-brand`, `--figma-ui3-text-danger`, etc.

### 2.2 Typography (`--typography-*`)
Do not use Tailwind's default `text-sm`, `text-lg`, `font-bold` unless mapped. The typography tokens define font-family, font-size, line-height, and font-weight.
- **Families:** `Comic Sans MS` (Headings), `Mulish` (Paragraphs, Titles, Body, Captions)
- **Headings:** `--typography-heading-1` through `--typography-heading-12`
- **Paragraphs:** `--typography-paragraph-1` through `--typography-paragraph-8`
- **Titles:** `--typography-title-1` through `--typography-title-8`
- **Body:** `--typography-body-1` through `--typography-body-8`
- **Captions:** `--typography-caption-*`

### 2.3 Spacing (`--uix-design-system-spacing-sp-*`)
Spacing is strictly scaled in 4px increments. Do not use arbitrary spacing.
- `--uix-design-system-spacing-sp-1` (4px)
- `--uix-design-system-spacing-sp-2` (8px)
- ... up to `sp-11` (44px)

### 2.4 Border Radius (`--uix-design-system-radius-rd-*`)
Border radius also scales in 4px increments.
- `--uix-design-system-radius-rd-0` (0px)
- `--uix-design-system-radius-rd-1` (4px)
- ... up to `rd-11` (44px)

---

## 3. Tailwind Integration Strategy

To maintain development speed, the Tailwind configuration (`tailwind.config.js` or `.ts`) should be extended to map these CSS variables to Tailwind utility classes. 

*Example integration concept:*
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--figma-ui3-bg-brand)',
          hover: 'var(--figma-ui3-bg-brand-hover)',
        },
        danger: 'var(--figma-ui3-bg-danger)'
      },
      fontFamily: {
        heading: ['Comic Sans MS', 'cursive'],
        body: ['Mulish', 'sans-serif'],
      }
    }
  }
}
```

If a utility class is not yet mapped in the Tailwind config, use arbitrary values pointing to the variable: `className="text-[var(--figma-ui3-text-brand)]"`.

---

## 4. UI Vibe & Aesthetic Requirements
As specified in the core PRD and agent rules:
- **No Generic UI:** Booktrovert is built for Gen Z and Millennials. It must look premium.
- **Micro-interactions:** Ensure hover (`--figma-ui3-bg-hover`), pressed, and selected states are always utilized to make the app feel alive and dynamic.
- **Glassmorphism & Depth:** When appropriate, combine your color tokens with backdrop blurs and soft shadows to create a modern aesthetic.
