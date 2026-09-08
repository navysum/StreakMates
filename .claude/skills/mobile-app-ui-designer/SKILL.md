---
name: mobile-app-ui-designer
description: Design, redesign, implement, and audit polished mobile app interfaces using mobile-first UI principles: focused navigation, readable scale, one-screen-one-job, clean content hierarchy, contextual actions, native-feeling gestures, purposeful motion, and thoughtful empty states. Use for iOS/Android app screens, mobile-first web apps, React Native, Flutter, SwiftUI, Jetpack Compose, or mobile UI critique.
version: 1.0.0
metadata:
  hermes:
    tags: [mobile-ui, ui-design, ux, ios, android, react-native, flutter, swiftui, jetpack-compose, responsive-design, accessibility]
    category: design
---

# Mobile App UI Designer

Use this skill to make mobile interfaces feel intentional, focused, touch-friendly, and native rather than like compressed desktop dashboards.

The core design model is:

**Navigation → Scale → Content → One Screen, One Job → Gestures → Dynamism → Empty States**

This skill is based on the mobile UI principles taught in Kole Jain's video:
"Everything you need to know about Mobile App UI's in 8 minutes (beginner friendly)"
https://www.youtube.com/watch?v=Gfsd8NNuD9g

Do not merely repeat the principles. Apply them to the user's actual product, screen, codebase, screenshot, or design request.

## When to Use

Use this skill when the user asks to:

- design a mobile app or mobile screen
- redesign an existing app UI
- make an interface feel more premium, clean, modern, minimal, or native
- convert a desktop/web layout into a mobile layout
- critique a mobile UI screenshot or implementation
- improve navigation, hierarchy, gestures, cards, spacing, or empty states
- implement a mobile UI in React Native, Flutter, SwiftUI, Jetpack Compose, or a mobile-first web stack
- audit an app for mobile usability
- decide what belongs on a screen and what should move elsewhere

Do not use this skill as a generic branding, logo, illustration, or desktop-only web-design skill.

## Operating Principles

### 1. Navigation Must Be Ruthlessly Prioritized

Mobile navigation is not a shrunken desktop sidebar.

For primary bottom navigation:

- Prefer **3–4 primary destinations**.
- Treat **5 as a practical upper bound**, not a target.
- Keep labels/icons unambiguous.
- Give touch targets generous space; use roughly **44 pt or the platform-equivalent minimum touch target**.
- Highlight one genuinely important action only when the product needs it.
- Do not put every destination in the bottom bar.

If the product has many destinations, use one of these patterns:

- a dedicated home/hub screen
- contextual drill-down navigation
- a profile/settings area for low-frequency destinations
- a full-screen menu when that is clearer than a cramped bar

Navigation must reflect frequency and importance, not the database or route structure.

### 2. Scale for Fingers and Eyes, Not for Desktop Density

Do not respond to a small screen by making everything tiny.

- Use readable body text near platform norms.
- Increase hierarchy through weight, size, spacing, and contrast.
- Preserve breathing room around controls.
- Avoid dense desktop-style tables unless the task truly requires them.
- Prefer concise labels over smaller typography.
- Important touch controls must be easy to hit with one hand.

When adapting desktop UI, reduce simultaneous information before reducing font size.

### 3. Mobile Content Usually Has One Dominant Direction

Desktop dashboards can expand across rows and columns simultaneously. Mobile sections should usually choose one primary flow.

Prefer:

- vertical stacking for the main reading/task flow
- horizontal carousels/rails only for secondary, glanceable collections
- one column for forms and detailed content
- progressive disclosure rather than showing everything at once

Avoid:

- miniature multi-column dashboard grids
- horizontal scrolling for essential content
- layouts that require the user to scan in two dimensions

For every section ask:

> Should the user move down, or sideways?

If the answer is "both", simplify the section.

### 4. One Screen, One Job

Except for a true home/overview screen, each screen should have one dominant job.

Examples:

- Settings screen → change settings.
- Note editor → edit the note.
- Search screen → find something.
- Checkout screen → complete the purchase.
- Habit detail → understand or update that habit.

Do not mix unrelated secondary modules into a task screen merely because space exists.

For each screen define:

- **Primary job**
- **Primary action**
- **Essential supporting information**
- **What is deliberately excluded**

If multiple jobs compete for attention, split the flow into screens, sheets, tabs, or progressive disclosure.

### 5. Build With a Small Set of Clear Content Blocks

Think in four broad building blocks:

1. **Cards/containers** — group related information.
2. **Text/links** — explain, label, navigate.
3. **Images/media** — provide visual context.
4. **Inputs/controls** — let the user act or enter data.

Cards are flexible, but do not use them reflexively.

Rules:

- Avoid card-inside-card-inside-card layouts.
- Use whitespace and section hierarchy before adding another container.
- A card should communicate meaningful grouping or interaction.
- Do not wrap every line of content in a rounded rectangle.
- Keep the component hierarchy visually obvious.

If removing a card border/background makes the hierarchy clearer, remove it.

### 6. Actions Must Follow Context

Mobile UI should change as the user's context changes.

Examples:

- Opening an editor can replace global navigation with editor-specific tools.
- Selecting an item can reveal selection actions.
- Entering a creation flow can reduce the UI to confirm/cancel plus the task itself.
- A detail page can expose actions relevant only to that object.

Do not keep every global control visible on every screen.

The active screen determines which actions deserve visibility.

### 7. Gestures Should Feel Native, But Never Be the Only Way

Useful mobile interaction patterns include:

- swipe/back transitions
- pull/swipe gestures
- bottom sheets
- long press for contextual actions
- swipe to reveal or dismiss where platform conventions support it

Use gestures to make an app feel fluid, not mysterious.

Requirements:

- Keep a visible alternative for important actions.
- Do not hide critical functionality behind an undiscoverable gesture.
- Respect platform conventions.
- Do not invent novel gestures without a strong reason.
- Protect destructive actions from accidental activation.

### 8. Motion Should Explain State Changes

Animation is useful when it communicates:

- where an element came from
- where it went
- what became active
- what layer is above another
- how navigation/context changed

Good examples:

- a bottom sheet sliding from its physical origin
- contextual actions entering when a selection is made
- the underlying screen subtly responding when a modal/sheet takes focus
- a smooth back transition that preserves spatial continuity

Avoid animation that exists only to look impressive.

Always provide a reduced-motion-safe experience.

### 9. Design Empty States as Real Screens

Empty states are not edge cases. They are product states.

Differentiate at minimum:

#### First-use / no-content state
The user has no content yet.

Provide:

- a concise explanation
- one obvious next action
- optional lightweight guidance
- enough context to understand what will appear here later

#### No-results state
The user searched or filtered and found nothing.

Provide:

- clear acknowledgement that there are no matches
- useful recovery guidance
- an option to clear/adjust the search or filters
- an obvious exit/back path when needed

#### Error / unavailable state
Something failed or cannot load.

Provide:

- plain-language status
- retry or recovery action
- preservation of user input/state where possible

Never leave a blank screen without explaining why it is blank.

## Workflow

When asked to design, redesign, implement, or audit mobile UI, follow this order.

### Step 1 — Understand the Product and Existing Constraints

Identify:

- target platform(s)
- screen or flow being worked on
- user goal
- current navigation
- existing visual language
- available data/content
- technical stack if implementation is requested
- functionality that must not break

If a codebase or files are available, inspect them before proposing structural changes.

Do not replace established brand tokens, component libraries, or navigation architecture without a reason.

### Step 2 — Write the Screen Contract

Before styling, state internally or in the design plan:

- Screen name
- Primary job
- Primary action
- Secondary actions
- Essential content
- Excluded content
- Entry point
- Exit/back behaviour
- Empty/loading/error states

If the screen cannot be described cleanly in this format, it is probably doing too much.

### Step 3 — Choose the Navigation Model

Decide:

- bottom navigation, tabs, stack navigation, hub, sheet, or full-screen menu
- which destinations are truly primary
- which controls should become contextual
- how back behaviour works
- whether a prominent creation/primary action is needed

Do not start by decorating an inherited desktop sidebar.

### Step 4 — Establish Hierarchy and Scale

Define or infer:

- page title/header hierarchy
- body text
- metadata/caption text
- spacing rhythm
- touch target sizes
- major section boundaries
- safe-area handling

Prefer a small consistent type/spacing system over arbitrary per-component values.

### Step 5 — Compose Content in One Dominant Direction

For each section:

1. Decide vertical stack or horizontal rail.
2. Place the most important item first.
3. Remove duplicate labels and metadata.
4. Use progressive disclosure for low-priority detail.
5. Check whether cards are actually helping.

### Step 6 — Define Interaction and State

Specify:

- tap behaviour
- long-press behaviour where appropriate
- swipe/back behaviour
- bottom sheets/modals
- contextual action changes
- loading
- empty
- no-results
- error
- disabled
- success/confirmation

A finished UI design includes states, not just the happy-path screenshot.

### Step 7 — Add Purposeful Motion

Only add transitions that improve continuity or feedback.

For each animation define:

- trigger
- entering/exiting element
- purpose
- reduced-motion fallback

### Step 8 — Implement Without Breaking Behaviour

When editing code:

- reuse existing components where practical
- reuse design tokens instead of scattering hard-coded values
- preserve routes, data flows, event handlers, and accessibility semantics
- avoid a giant one-file rewrite unless architecture is already disposable
- separate presentational cleanup from behavioural changes where possible
- handle safe areas, keyboards, dynamic text, and small screens
- ensure interaction works with touch, not only hover

### Step 9 — Verify

Audit the result using the checklist in:
`templates/mobile-ui-audit.md`

If needed, load:
`references/video-principles.md`

## Required Output for Design Tasks

When the user asks for a design or redesign, provide enough detail to implement it.

Use this structure when appropriate:

### Screen Goal
One sentence describing the screen's single job.

### Navigation
Primary destinations and how the user enters/exits the screen.

### Hierarchy
Ordered list of visible sections from top to bottom.

### Components
Key reusable components and their responsibilities.

### Interactions
Tap, swipe, long-press, sheet/modal, and contextual actions.

### States
Loading, empty, no-results, error, disabled, and success states that apply.

### Design Tokens
Only the tokens necessary for implementation: typography, spacing, radii, elevation/borders, and colours if the user has not already supplied them.

### Implementation Notes
Framework-specific guidance when code is requested.

Do not bury the recommendation under generic UI theory.

## Audit Rules

Flag the design when any of these are true:

- More than five persistent primary navigation destinations.
- A task screen has two or more competing primary jobs.
- Important controls are difficult to tap.
- Essential information requires horizontal scrolling.
- Multiple nested cards exist without a clear semantic reason.
- Typography was shrunk mainly to fit more content.
- Important actions are available only through gestures.
- Global controls remain visible when context-specific tools should replace them.
- Motion does not communicate state or spatial continuity.
- Empty/no-results/error states are undefined.
- The mobile layout is visibly a compressed desktop dashboard.
- Critical interactions depend on hover.
- Destructive actions are easy to trigger accidentally.
- The design ignores safe areas, keyboard overlap, or dynamic text.

## Premium / Minimal UI Guidance

When the user asks for a clean, premium, or luxurious mobile look:

- simplify before decorating
- use fewer containers
- use strong typography and spacing
- reduce visual noise
- reserve accent colour for meaningful emphasis
- use subtle separators/elevation rather than excessive borders
- keep icon style consistent
- avoid gradients, glass, glow, or 3D effects unless they serve the brand
- use motion sparingly and precisely
- make the primary action obvious without making everything loud

"Premium" should come from restraint, proportion, detail, and consistency — not from adding effects.

## Pitfalls

### Pitfall: Copying a desktop dashboard onto mobile
Fix: re-prioritize content and choose one dominant direction per section.

### Pitfall: Putting everything in bottom navigation
Fix: keep only high-frequency destinations primary; move the rest into contextual or hub navigation.

### Pitfall: Excessive cards
Fix: use typography, spacing, and grouping before adding containers.

### Pitfall: One screen doing everything
Fix: define the screen's job and move secondary workflows into dedicated screens/sheets.

### Pitfall: Gesture-only UI
Fix: retain visible, accessible alternatives for important actions.

### Pitfall: Pretty happy path, broken real states
Fix: explicitly design loading, empty, no-results, error, and disabled states.

### Pitfall: Animation everywhere
Fix: require every transition to explain state, hierarchy, or spatial continuity.

### Pitfall: Redesigning brand identity without permission
Fix: preserve supplied colours, typography, iconography, and brand rules unless the user asks to change them.

## Verification

Before calling the work complete, confirm:

1. The screen has one dominant job.
2. Primary navigation is limited and understandable.
3. Text and controls are comfortably readable/tappable.
4. Each section has a clear primary scroll direction.
5. Content hierarchy works without unnecessary nested cards.
6. Contextual actions appear only when relevant.
7. Gestures have visible alternatives for important actions.
8. Motion explains state rather than decorating it.
9. Empty/no-results/error states are defined.
10. The smallest supported screen remains usable.
11. Accessibility and reduced-motion behaviour are preserved.
12. Existing functionality still works after implementation changes.

If any item fails, revise before presenting the result as finished.
