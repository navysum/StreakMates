---
name: master-ui-optimisation
description: Master UI/UX optimisation system for improving existing interfaces or designing new ones across product apps, dashboards, SaaS, AI products, mobile apps, landing pages, and presentation prototypes. Prioritises user intent, flows, hierarchy, spacing, colour, typography, signifiers, states, progressive disclosure, data-driven layouts, motion, personality, accessibility, responsive behaviour, and implementation quality. Inspired by and synthesised from Kole Jain's public UI/UX teaching.
version: 1.0.0
metadata:
  hermes:
    tags: [ui, ux, product-design, mobile-ui, dashboard-ui, saas, ai-ui, landing-pages, colour, typography, motion, microinteractions, accessibility, responsive-design, design-systems]
    category: design
---

# Master UI Optimisation

A comprehensive operational system for making interfaces **clearer, more useful, more polished, more human, and more memorable**.

This skill synthesises the recurring UI/UX principles taught across Kole Jain's public design videos. It is a **paraphrased methodology**, not a transcript or reproduction of his videos.

The master principle:

> **Fix the product logic before the pixels, then use visual craft to make the logic obvious.**

Never start by adding gradients, animations, cards, or decoration. Start with the user's goal, the flow, the information, and the states. Polish comes after structure.

---

# 0. The Optimisation Order

When improving a UI, work in this order unless there is a strong reason not to:

1. **User intent**
2. **Task / journey**
3. **Screen responsibility**
4. **Information architecture**
5. **Content and data form**
6. **Navigation**
7. **Layout and hierarchy**
8. **Spacing and grouping**
9. **Typography and iconography**
10. **Colour and depth**
11. **Components and signifiers**
12. **Interaction states**
13. **Progressive disclosure and hidden UI**
14. **Loading / empty / error / success / onboarding states**
15. **Responsive and mobile behaviour**
16. **Motion and micro-interactions**
17. **Brand personality and delight**
18. **Accessibility and performance**
19. **Implementation consistency**
20. **Presentation and prototype quality**

Do not polish step 16 while steps 1–8 are broken.

---

# 1. Severity Ladder

Classify problems before changing the interface.

## P0 — Broken
Examples:
- user cannot complete the task
- inaccessible critical action
- destructive action triggers too easily
- data is misleading
- navigation traps the user
- important content is unreadable

Fix immediately.

## P1 — Structural
Examples:
- wrong information architecture
- screen has multiple competing jobs
- missing navigation or escape path
- missing states
- data shown in the wrong format
- mobile layout is a compressed desktop view

Fix before styling.

## P2 — Hierarchy
Examples:
- weak focal point
- unclear CTA priority
- inconsistent spacing
- poor grouping
- overloaded card grids
- too much simultaneous information

Fix before aesthetic polish.

## P3 — Visual System
Examples:
- poor typography
- inconsistent radius
- weak colour system
- mismatched icons
- bad dark mode
- inconsistent components

Fix systematically.

## P4 — Delight
Examples:
- motion
- expressive visual motifs
- micro-interactions
- playful copy
- creative 404
- presentation polish

Add only after P0–P3 are healthy.

---

# 2. Start With User Intent

A UI exists to help a person accomplish something.

Before redesigning, identify:

- Who is the user?
- What did they come here to do?
- What information do they need first?
- What decision are they trying to make?
- What is the most likely next action?
- What are the less-frequent actions?
- What might go wrong?
- How do they leave or recover?

Design the journey, not isolated screenshots.

## Intent Test

For every screen, finish this sentence:

> "The user opened this screen because they want to ______."

If there are several unrelated answers, the screen probably needs to be simplified or split.

---

# 3. One Screen, One Dominant Job

Most screens should have one dominant responsibility.

Examples:

- Search → find something
- Editor → edit something
- Settings → change settings
- Checkout → complete purchase
- Habit detail → inspect/update that habit
- Analytics detail → understand a specific metric

A home or overview dashboard can be broader, but it still needs a clear hierarchy.

Define:

- **Primary job**
- **Primary action**
- **Secondary actions**
- **Essential content**
- **Excluded content**

Do not add modules merely because there is unused space.

---

# 4. Design the Flow Before the Frame

Do not design only the happy-path screen.

Map:

- entry
- main task
- decisions
- confirmation
- cancellation
- back/escape
- success
- failure
- retry
- empty state
- no-results state
- loading
- permissions
- first-use/onboarding

A visually beautiful isolated screen can still be poor product design if the journey around it is missing.

## Escape-Hatch Rule

Any screen a user can reach unintentionally should provide a clear way to:

- go back
- cancel
- dismiss
- switch context
- recover

Never strand the user.

---

# 5. Content and Data Determine Form

Do not force every piece of information into the same component.

Ask what the data actually is.

Examples:

- chronological events → timeline
- comparable records → table/list
- trend over time → line/area chart
- proportions → bar/stacked bar where appropriate
- categorical status → chip/badge
- single KPI → metric card
- dense record details → detail panel/drawer
- grouped tasks → sections/list
- media collection → grid/rail

If time is the core dimension, a timeline may communicate better than a generic table.

If comparison is the core task, alignment becomes critical.

---

# 6. Navigation Is Prioritisation

Navigation should reflect importance and frequency, not simply mirror route count.

## Desktop / Dashboard

A sidebar often acts as the product spine.

Good structure:

- group related destinations
- use clear labels
- keep icons consistent
- show active state clearly
- place low-frequency help/settings/profile lower
- do not make the sidebar visually louder than the content
- collapse secondary groups when useful
- avoid dozens of equally weighted links

## Mobile

For persistent bottom navigation:

- prefer **3–4 primary destinations**
- treat **5 as an upper practical limit**
- use clear labels/icons
- use generous touch targets
- move low-frequency destinations into contextual navigation, hubs, profile/settings, or menus

Mobile navigation is not a tiny desktop sidebar.

## Contextual Navigation

Global controls do not need to remain visible during focused tasks.

Examples:

- editor → editing controls replace global nav emphasis
- selection state → selection actions appear
- creation flow → confirm/cancel become prominent
- object detail → object-specific controls appear

Let the active context determine visible actions.

---

# 7. Progressive Disclosure

Show what is needed **now**. Reveal complexity as the user needs it.

Useful mechanisms:

- tooltips
- popovers
- drawers
- bottom sheets
- expandable advanced settings
- hover-revealed row actions on desktop
- swipe/long-press contextual actions on mobile
- "More" menus
- collapsible sections
- detail panels

## Spectrum of Explicitness

### Always visible
Use for:
- primary navigation
- primary CTA
- high-frequency actions
- safety-critical controls

### Contextually visible
Use for:
- secondary row actions
- editing tools
- advanced filters
- low-frequency utilities

### Hidden but discoverable
Use for:
- explanations
- shortcut hints
- metadata
- advanced detail

Never hide a critical action only because the interface looks cleaner.

---

# 8. Invisible UI Matters

Beginner designs often include only visible content and forget supporting interaction layers.

Audit for:

- tooltip
- popover
- dropdown
- context menu
- drawer
- modal
- bottom sheet
- toast
- loading indicator
- skeleton
- validation
- focus state
- keyboard shortcut hint
- undo
- confirmation
- onboarding cue

A mature product often feels simple precisely because complexity is distributed into the right hidden states.

---

# 9. Onboarding Without Overwhelm

Avoid a giant instruction modal that explains the whole product at once.

Prefer sequential guidance:

1. point to the first useful action
2. let the user perform it
3. reveal the next step
4. optionally show a lightweight checklist
5. stop once the user understands the core loop

Teach in context.

Good onboarding helps the user achieve a meaningful first result quickly.

---

# 10. Hierarchy

Hierarchy answers:

> "What should I notice first, second, and third?"

Use:

- size
- weight
- position
- proximity
- contrast
- colour
- opacity
- whitespace
- repetition

Do not rely on font size alone.

## Typical Priority

1. Primary task/message
2. Primary action or core data
3. Supporting context
4. Secondary action
5. Metadata

If everything is bold, bright, boxed, and large, nothing is important.

---

# 11. Layout: Skeleton Before Decoration

Break a screen into large zones before styling details.

Examples:

- navigation
- header/context
- primary workspace
- secondary panel
- footer/status area

Establish the skeleton first.

## Grids

Grids are guides, not commandments.

Use structured columns when:

- items repeat
- comparison matters
- alignment helps scanning

Do not force every layout into a 12-column grid.

For dense product UI, a consistent spacing system often matters more than a marketing-style grid.

---

# 12. Spacing and Proximity

Spacing is one of the strongest hierarchy tools.

Use a consistent base rhythm, commonly multiples of 4:

- 4
- 8
- 12
- 16
- 24
- 32
- 40
- 48

The exact scale may vary, but arbitrary one-off gaps should be rare.

## Proximity Rule

Things that belong together should be closer to each other than to unrelated things.

Before adding:

- a border
- a background
- a card
- a divider

try solving grouping with spacing first.

## Density by Product Type

### Marketing / landing pages
Can use:
- larger type
- larger spacing
- dramatic composition

### Dashboards / tools
Usually need:
- tighter type scale
- compact but readable spacing
- stronger alignment
- less decorative padding

---

# 13. Cards Are Not the Default

Do not wrap every piece of information in a rounded rectangle.

Use a card when it provides meaningful:

- grouping
- containment
- interaction
- elevation
- comparison

Avoid:

- card inside card inside card
- every section as a floating panel
- excessive shadows
- every KPI in an identical decorative tile

Whitespace, separators, alignment, and section headings can often do the job better.

---

# 14. Typography

Keep the type system simple.

## General

Prefer:

- one strong sans-serif family for most product UI
- limited, intentional sizes
- clear weight hierarchy
- readable line length
- enough line-height

## Product / Dashboard

Use a compressed scale.

Avoid giant marketing headings inside dense tools.

## Marketing

Larger expressive headings are acceptable.

For large display text, slight negative tracking and tighter line-height can improve visual cohesion, but never at the expense of readability.

## Hierarchy

Typography works with:

- opacity
- colour
- spacing
- alignment

not alone.

---

# 15. Icons

Icons must communicate, not decorate.

Rules:

- use one coherent icon family
- match stroke weight/style
- size icons roughly in proportion to adjacent text line-height
- label ambiguous icons
- add tooltips to unfamiliar desktop icon-only controls
- use familiar symbols for common actions
- do not mix emojis with professional icons by default

Emoji can be appropriate if it is intentionally part of the brand, but should not substitute for a coherent icon system accidentally.

---

# 16. Signifiers: Make Interactivity Obvious

Good UI signals how it works.

Users should understand what is:

- clickable
- selected
- disabled
- editable
- draggable
- expandable
- active
- destructive

Use:

- containers
- underlines
- chevrons
- cursor changes
- selected states
- focus rings
- hover changes
- pressed states
- tooltips
- labels

Do not require users to guess.

---

# 17. State Completeness

Every interactive component should have the states it needs.

## Buttons

At minimum where relevant:

- default
- hover
- pressed/active
- focus
- disabled
- loading

## Inputs

At minimum:

- default
- focus
- filled
- error
- warning if used
- disabled
- success if useful

## Async Actions

Use feedback such as:

- spinner
- inline progress
- toast
- status change
- skeleton
- optimistic update

Silent UI feels broken.

---

# 18. Colour: Use a Layered Product System

Do **not** treat the 60/30/10 rule as a rigid product-interface law.

For modern product UI, use four layers.

## Layer 1 — Neutral Foundation

Create a neutral ramp for:

- canvas background
- elevated background
- card/surface
- subtle border
- strong border
- primary text
- secondary text
- muted text

Neutrals create most of the structure.

Pure black/white may be too harsh depending on the product; tuned neutrals often produce better hierarchy.

## Layer 2 — Functional Accent

Treat the brand/accent as a **scale**, not one hex code.

Create variants for:

- primary CTA
- hover
- pressed
- subtle tinted background
- link
- focus ring
- selected state

Use accent colour where attention or interaction needs it.

## Layer 3 — Semantic Colours

Colours should communicate meaning:

- success
- warning
- error/destructive
- informational
- categorical chart series

Do not force every semantic state into the brand colour.

For data-heavy products, perceptually consistent spaces such as **OKLCH** can help build more even colour scales.

## Layer 4 — Theme

Light/dark/custom themes should adapt:

- lightness
- chroma
- contrast
- surface depth

Do not simply invert colours.

---

# 19. Dark Mode Is Its Own Design

Dark mode needs deliberate depth and contrast.

Use:

- dark neutral canvas
- slightly lighter elevated surfaces
- restrained borders
- adjusted accent chroma/brightness
- readable but not glaring text
- reduced reliance on shadows

Avoid:

- pure inversion
- bright white borders everywhere
- neon accent overload
- same shadow model as light mode

In dark mode, elevation is often communicated through lighter surfaces rather than stronger shadows.

---

# 20. Borders, Radius, Shadows, and Depth

## Borders

Use subtle contrast.

Avoid heavy black outlines unless the visual identity intentionally calls for them.

## Radius

Choose a coherent radius family.

Do not randomly mix:
- 4px
- 13px
- 22px
- 30px

without a system.

## Shadows

Light mode:
- subtle shadow can separate elevation

Dark mode:
- rely more on surface contrast
- keep shadows restrained

## Glass

Glassmorphism is not a default premium setting.

Use only when:
- content stays readable
- depth is meaningful
- the brand supports it

---

# 21. Buttons and CTA Hierarchy

A screen should not have five equally loud CTAs.

Typical hierarchy:

### Primary
High-emphasis action.

### Secondary
Lower-emphasis but visible.

### Tertiary / Ghost
Low-emphasis utility/navigation action.

Ghost buttons work well for secondary controls, sidebar links, and actions that should remain available without competing with the primary task.

Keep button label, icon, padding, state and radius consistent.

---

# 22. Dashboard Design

Dashboards are not marketing pages with smaller cards.

Their priorities are:

- clarity
- scanability
- comparison
- density
- data meaning
- repeat use

## Dashboard Spine

Use clear navigation and a stable layout.

## Primary Data

The most important user information should dominate the first viewport.

Do not give every metric equal weight.

## Tables

For data tables:

- right-align numerical values when comparison benefits
- align comparable columns consistently
- use categorical chips for status where helpful
- support search/filter/sort when needed
- truncate long text gracefully
- allow detail expansion
- visually de-emphasise inactive/disabled rows
- expose low-frequency row actions progressively

## Charts

Use the simplest chart that answers the question.

Avoid charts that look impressive but reduce comprehension.

Colour should map to data meaning consistently.

## Cards

Use cards selectively.

A dashboard full of identical KPI tiles often signals weak prioritisation.

---

# 23. Data Colour Is Meaning, Not Decoration

For dashboards and analytics, ask:

- What does this colour mean?
- Is the meaning consistent everywhere?
- Can the user distinguish states without colour alone?
- Are chart categories perceptually distinct?
- Is red reserved for error/destructive/negative meaning where appropriate?

Do not recolour charts merely to match the brand if doing so weakens interpretation.

---

# 24. Mobile UI

Mobile requires re-prioritisation, not shrinking.

## Navigation
- 3–4 primary bottom destinations preferred
- 5 is a practical upper limit
- secondary destinations move elsewhere

## Touch
Use generous touch areas around controls.

Around 44pt / platform-equivalent is a useful minimum reference for many common actions.

## Scale
Do not make text tiny to fit desktop density.

## Content Direction
Each section should usually have one dominant direction:

- vertical for primary task/content
- horizontal rails for secondary browseable collections

Avoid two-dimensional mini-dashboard layouts.

## Gestures
Use familiar gestures such as:
- swipe/back
- long press
- bottom sheet
- swipe reveal/dismiss

But critical actions must also have visible/discoverable alternatives.

## Safe Areas and Keyboard
Account for:
- notch/dynamic island/cutouts
- home indicator
- system bars
- software keyboard
- dynamic text

---

# 25. Motion Has Two Jobs

Motion can provide:

1. **clarity**
2. **delight**

Use both intentionally.

## Utility Motion

Good for:

- navigation continuity
- sheet/modal origin
- selection changes
- loading
- state transition
- feedback

## Delight Motion

Good for:

- landing pages
- brand moments
- small decorative interactions
- celebratory success states
- personality

Do not animate everything.

---

# 26. Object-Specific Motion

Avoid a generic fade-in pasted onto every element.

Let the object suggest the motion.

Examples:

- coin → spin
- balloon → float/fly
- star → pop/rotate
- paper → slide/unfold
- badge → stamp
- card → stack/tilt
- progress concept → fill

This makes motion feel designed rather than generated.

---

# 27. Easing and Timing

Motion should not feel robotic.

Use appropriate:

- ease-out for entrances
- ease-in for exits
- ease-in-out for ambient movement
- spring/bounce sparingly for playful interactions
- deliberate delay for tooltips or sequences

Avoid:
- constant-speed UI transitions
- excessive bounce
- long animations blocking tasks

---

# 28. Micro-Interactions

High-value micro-interactions include:

- button text/icon shifts
- hover feedback
- press feedback
- tooltip reveal
- toast progress/success
- avatar/name reveal
- progress animation
- card stack movement
- selection transitions
- loading shimmer
- shortcut hint
- focus animation

A micro-interaction should improve:

- feedback
- discoverability
- continuity
- delight

not distract from the task.

---

# 29. Reduced Motion

Always support users who request reduced motion.

When reduced motion is enabled:

- remove parallax
- remove ambient bobbing
- replace large entrances with simple state changes
- preserve essential feedback
- avoid animated text that delays comprehension

Accessibility outranks animation.

---

# 30. Personality: Avoid Generic AI UI

Common generic patterns:

- meaningless purple/blue gradients
- random glowing orbs
- glass everywhere
- every section in rounded cards
- same centred hero structure on every project
- repetitive icon-card grids
- excessive symmetry
- generic startup copy
- emojis used as default icons
- motion with no relationship to content
- colours chosen without product context

The fix is not "more effects."

The fix is product-specific visual language.

---

# 31. Build a Product-Specific Visual Metaphor

Ask:

- What physical or visual objects belong to this product?
- What behaviour represents the product?
- What concept can become a recurring motif?

Examples:

## Finance
- invoices
- receipts
- coins
- graphs
- wallets

## Planning
- calendars
- notes
- checkboxes
- clocks

## Developer tooling
- terminals
- cursors
- nodes
- connections
- code fragments

## Travel
- tickets
- route lines
- passports
- luggage
- map pins

Use 1–3 signature motifs consistently.

Do not add unrelated doodles.

---

# 32. Meaningful Richness

Minimalism can become emptiness.

Additional visual elements can improve a design when they:

- explain the product
- reinforce the brand
- direct attention
- create rhythm
- add memorable personality

Protect whitespace around:

- headline
- CTA
- primary product visual
- essential controls

The focal point must remain obvious.

---

# 33. Animated Narratives

Text can participate in storytelling.

Instead of animating letters randomly, animate the **meaning**.

Examples:

- progress → progress bar fills
- paid → currency moves
- complete → checkbox checks
- secure → lock closes
- connected → nodes link
- delivered → object travels to destination

Use one meaningful narrative beat at a time.

Never make users wait through an animation to understand the message.

---

# 34. Human Copy

Visual personality fails if the copy sounds robotic.

Prefer language that is:

- concise
- specific
- natural
- clear
- appropriate to the brand

Avoid generic phrases such as:

- "Unlock seamless experiences"
- "Empowering businesses"
- "Revolutionary end-to-end solution"
- "Elevate your workflow"

Human does not mean childish.

Match the product's seriousness.

---

# 35. Finishing Touches

Polish overlooked states.

Audit:

- 404
- empty
- loading
- error
- success
- disabled
- pressed
- hover
- focus
- skeleton
- footer
- validation
- selection colour
- favicon
- share preview
- page transition

A creative 404 can be playful, but must always provide a route back.

---

# 36. AI Product UI

AI products often need interfaces that expose:

- prompt/input
- context
- sources
- generated result
- history
- iteration
- confidence
- progress

Useful patterns include:

## Functional Prompt Box
A large input can be central when prompting is the main task.

## Multimodal Inputs
Show supported input types clearly.

## Contextual Chips / Modes
Use mode/model/task chips when they genuinely change behaviour.

## Integrations
Expose connected services in a clear, purposeful way.

## History / Memory
Give users visibility into previous generations or retained context when appropriate.

## Inline Editing
Allow modification near the generated output rather than forcing a separate workflow.

## Research / Process Visibility
When useful, show:
- steps
- sources
- progress
- confidence
- status

Do not fabricate certainty.

## Loading
AI latency needs deliberate perceived-performance design:
- skeleton
- progress
- streaming
- status language
- staged reveal

---

# 37. SaaS UI

Avoid "vibe-coded" SaaS symptoms:

- random emojis as icons
- arbitrary colours
- giant card grids
- messy sidebar
- every advanced option always visible
- weak billing hierarchy
- meaningless analytics
- generic landing-page graphics
- inconsistent states

Use:

- coherent icon library
- deliberate palette
- progressive disclosure
- clear plan/usage hierarchy
- meaningful charts
- strong navigation
- real design review after generation

AI can generate UI quickly; human judgement must still decide what belongs.

---

# 38. Loading, Empty, No-Results, Error, Success

Treat these as real screens/states.

## First-Use Empty
Explain:
- what this area is
- what appears here
- the next action

## No Results
Explain:
- nothing matched
- how to adjust filters/search
- how to clear/exit

## Loading
Communicate:
- activity
- approximate structure where possible
- preserved context

## Error
Provide:
- plain-language problem
- retry
- recovery
- preserved input when possible

## Success
Confirm:
- what happened
- next logical action
- undo where appropriate

Never leave users staring at unexplained blank space.

---

# 39. Search, Filter, and Browsing

Design around user intent.

Ask:

- Are users looking for a known item?
- exploring?
- comparing?
- narrowing?

Use:
- search for known retrieval
- filters for narrowing
- sort for ordering
- tabs for strong categorical separation

Do not add all three automatically.

For long feeds, **Load More** may be preferable to infinite scroll when:
- footer access matters
- users want control
- content is task-oriented

Infinite scroll can work for continuous discovery, but is not a default.

---

# 40. Interaction Conventions

Respect familiar patterns unless breaking the convention provides clear value.

Users already know:

- common back behaviour
- common dropdowns
- familiar form patterns
- tabs
- menus
- drag handles
- mobile sheets

Novel interaction increases learning cost.

Break conventions intentionally, not accidentally.

---

# 41. Design Systems

A design system should accelerate consistency without preventing good judgement.

Standardise:

- spacing
- typography
- colour
- radius
- component states
- iconography
- elevation
- motion tokens

But do not force a component into a context where it no longer communicates well.

Mastery includes knowing when to bend the system deliberately.

---

# 42. Reference-First Learning and Design

Before inventing from nothing, study real successful interfaces.

Good reference workflow:

1. gather relevant examples
2. identify skeleton/zones
3. study spacing
4. study grouping
5. study hierarchy
6. study interaction conventions
7. identify repeated patterns
8. extract principles
9. restyle for the current product

For learning, recreating an interface can teach micro-decisions.

For shipped work, do not copy another brand's proprietary design pixel-for-pixel. Extract patterns and create an original solution.

---

# 43. Visual "Flavour"

Define the desired personality in 2–3 words.

Examples:

- calm, precise, clinical
- youthful, premium, social
- technical, dark, dense
- warm, playful, tactile

Translate those words into:

- radius
- spacing
- type
- colour
- imagery
- texture
- motion
- density

Do not choose these independently.

The system should feel like one product.

---

# 44. Landing Pages

Landing pages have different priorities from product screens.

They need:

- clear value proposition
- strong first visual
- trust
- narrative
- evidence
- CTA
- pacing

## Strong Progression

A useful conceptual progression:

### Functional
Readable, organised, coherent.

### Polished
Better spacing, hierarchy, typography, colour.

### Distinctive
Product-specific visuals, stronger composition, interaction.

### Memorable
Narrative motion, original visual language, deliberate surprise, deep polish.

Do not skip functional clarity to chase the final level.

---

# 45. Captivating Sections

Strong sections usually combine:

- intentional structure
- rhythm
- focal point
- clear message
- selective surprise

Use motion to guide attention.

Use restraint so the surprise remains special.

A page where every section tries to be the hero becomes exhausting.

---

# 46. Presentation and Prototyping

A good design can look weak if presented badly.

When showcasing UI:

- use a clean background
- use realistic device/context mockups where useful
- vary composition rather than stacking screenshots identically
- show interaction with prototypes/video when motion matters
- use subtle brand-derived presentation colour
- keep the interface itself readable

For dark UI, subtle surrounding glow can help presentation, but should not become part of the product unless intentional.

For light UI, a desaturated/tinted background derived from the accent can create separation.

---

# 47. Responsive Optimisation

Do not merely scale components.

At each breakpoint ask:

- What disappears?
- What reorders?
- What becomes a drawer/sheet?
- What becomes full width?
- What stops being side-by-side?
- What becomes scrollable?
- What should remain fixed?

Responsive design is reprioritisation.

Prevent:

- horizontal overflow
- clipped floating decoration
- impossible tables
- hover-only controls
- tiny text
- cramped tap targets

---

# 48. Accessibility Is UI Quality

Check:

- readable contrast
- focus visibility
- keyboard navigation
- touch targets
- semantic labels
- screen reader names
- reduced motion
- colour-independent meaning
- readable text scaling
- error identification
- predictable navigation

Do not treat accessibility as a final compliance pass.

It affects hierarchy, states, colour, motion, and component design from the beginning.

---

# 49. Implementation Rules

When this skill is used on a real codebase:

1. inspect the existing implementation first
2. identify framework and design system
3. preserve working data flows/routes
4. reuse existing components where sensible
5. consolidate tokens rather than scatter hard-coded values
6. separate structural change from cosmetic change where possible
7. do not introduce a new animation library for trivial effects
8. prefer performant transforms/opacity for motion
9. prevent layout shift
10. lazy-load heavy media
11. support reduced motion
12. verify keyboard/touch
13. verify loading/error states
14. verify smallest supported screen
15. verify dark/light themes
16. run existing tests/lint/build if available

Do not perform a giant rewrite just because a visual redesign was requested.

---

# 50. Master Optimisation Workflow

When asked to improve a UI, follow this workflow.

## Step 1 — Inspect
Review:
- screenshots/design
- code
- routes
- design tokens
- content/data
- user flow
- current behaviour

## Step 2 — Define Intent
Write:
- target user
- primary job
- primary action
- success condition

## Step 3 — Map Flow and States
Include:
- entry
- exit
- empty
- loading
- error
- success
- edge cases

## Step 4 — Diagnose by Severity
Classify P0–P4.

## Step 5 — Fix Architecture
Address:
- screen responsibility
- navigation
- information architecture
- content form

## Step 6 — Fix Hierarchy
Address:
- focal point
- CTA hierarchy
- grouping
- spacing
- density

## Step 7 — Fix Visual System
Address:
- typography
- icons
- colour layers
- depth
- radius
- components

## Step 8 — Fix Interaction
Address:
- signifiers
- hover
- focus
- pressed
- disabled
- loading
- tooltips
- progressive disclosure

## Step 9 — Add Product Completeness
Address:
- empty
- no-results
- error
- onboarding
- hidden UI
- confirmations
- undo

## Step 10 — Adapt by Surface
Choose relevant specialised rules:
- dashboard
- mobile
- SaaS
- AI
- landing page

## Step 11 — Add Delight
Only after clarity:
- micro-interactions
- narrative motion
- product-specific visuals
- human copy
- finishing touches

## Step 12 — Verify Accessibility and Performance

## Step 13 — Run Master Audit
Use:
`templates/master-ui-audit.md`

---

# 51. Required Output

When the user asks for a critique/redesign, structure the work like this when appropriate:

## 1. UI Diagnosis
What is structurally or visually weak.

## 2. User Job
What this screen/product is primarily for.

## 3. Priority Fixes
P0 → P4.

## 4. New Structure
Navigation, zones, information order.

## 5. Visual System
Typography, spacing, colour, radius, iconography.

## 6. Components
What components exist and why.

## 7. Interaction + Hidden UI
Tooltips, popovers, drawers, sheets, states.

## 8. Empty / Loading / Error / Success
Define applicable states.

## 9. Motion
Only purposeful motion.

## 10. Responsive / Mobile
How layout and priority change.

## 11. Accessibility
Relevant requirements.

## 12. Implementation
Concrete changes when code is requested.

Do not return a generic list of design tips when the user supplied a real product.

---

# 52. Automatic Failure Flags

Do not approve a UI if any of these are true:

- critical task is impossible or unclear
- no clear primary action
- screen has several competing primary jobs
- user can become trapped
- important state is missing
- silent async actions
- interaction depends solely on hover
- interaction depends solely on undiscoverable gesture
- colour is the only way to communicate important status
- tiny tap targets
- unreadably small mobile text
- desktop dashboard simply shrunk to mobile
- random card nesting
- inconsistent icon libraries
- random one-off spacing/radius values
- dark mode is simple colour inversion
- excessive border contrast
- generic AI visual effects have no product meaning
- animation delays comprehension
- no reduced-motion path
- decorative elements cause overflow
- table/chart form does not match the data task
- essential information is hidden for aesthetic reasons
- loading/error/empty states strand the user
- redesign breaks existing behaviour

---

# 53. Supersession Rules

Kole Jain's teaching evolves. When two ideas conflict, use the more recent, context-appropriate principle.

Important example:

## Colour
Older material may use **60/30/10** as a simple colour heuristic.

For complex product UI, do **not** enforce that ratio.

Prefer the newer layered system:

1. neutral foundation
2. functional accent ramp
3. semantic colours
4. theme adaptation

A loose ratio can still be a composition exercise for simple marketing visuals, but it is not a universal product-UI rule.

## Minimalism vs Richness
"Less is more" and "More is more" are not contradictions when context is considered.

Use:

- **Less** when effects/components reduce clarity.
- **More** when contextual visuals improve meaning, brand, or narrative without crowding the focal point.

The real rule is:

> **Every element must earn its place.**

---

# 54. Final Quality Standard

A strong UI should feel:

- obvious without being simplistic
- structured without being rigid
- consistent without being generic
- polished without being over-designed
- expressive without becoming noisy
- responsive without feeling compressed
- interactive without being distracting
- accessible without looking compromised
- branded without sacrificing usability

The goal is not "pretty UI."

The goal is a product that feels **intentional**.
