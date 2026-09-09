---
name: premium-app-experience
description: Make an existing mobile or product app feel premium through compounded visible and invisible craft: responsive interactions, deliberate motion, tactile feedback, distinctive visual details, anticipatory context, smart defaults, graceful latency, strong empty/error states, privacy-aware intelligence, and obsessive friction removal. Use when an app works but still feels generic, cheap, AI-generated, unfinished, or less thoughtful than premium consumer software.
version: 1.0.0
metadata:
  hermes:
    tags: [premium-ui, product-design, mobile-ui, ux, microinteractions, motion, haptics, anticipatory-design, product-polish, react-native, swiftui, flutter]
    category: design
---

# Premium App Experience

Use this skill when the product is already functional but does not yet **feel** exceptional.

This skill is inspired by Chris Raroque's video:

**"How I Make Apps FEEL Premium (5 examples)"**
https://www.youtube.com/watch?v=MXLF8b15GhQ

The operating idea is:

> Premium is rarely one impressive feature. It is the compounding effect of many small decisions that make the product feel unusually considered.

Some premium decisions are visible:
- motion
- illustration
- icons
- transitions
- haptics
- loading states

Some of the strongest are invisible:
- anticipating what the user meant
- eliminating a correction step
- using context to improve accuracy
- choosing a better default
- preserving user state
- making errors less likely before they happen

The product should do more thinking so the user can do less.

---

# 1. Premium Is a Feeling, Not a Visual Style

Do not equate premium with:

- glassmorphism
- gradients
- gold
- blur
- excessive animation
- expensive-looking fonts
- large corner radii
- 3D
- glowing effects

Those may fit some brands, but none of them creates premium quality by itself.

Premium means the interface feels:

- responsive
- coherent
- anticipatory
- intentional
- stable
- fast
- tactile
- forgiving
- distinctive
- complete

A plain interface can feel premium.
A visually extravagant interface can feel cheap.

---

# 2. The Premium Stack

Audit an app in this order:

1. **Correctness**
2. **Friction**
3. **Responsiveness**
4. **Continuity**
5. **Context awareness**
6. **Feedback**
7. **Edge-state quality**
8. **Visual identity**
9. **Delight**
10. **Invisible craft**

Do not polish animations while the user still has to fight the product.

---

# 3. Surprise and Delight Means "How Did It Know?"

Do not reduce delight to:

- confetti
- cute mascots
- celebration animations
- easter eggs

Those can work, but a stronger form of delight is:

> The product correctly anticipates something the user expected to be difficult.

Examples:

- speech recognition understands a difficult nearby restaurant name
- a form preselects the likely country or unit
- an app remembers the user's preferred action without making them configure it
- a calendar suggests the right duration
- a finance app recognises a merchant category correctly
- a photo tool applies the previously chosen export format
- a search surface understands context from the current object
- an AI assistant carries forward relevant context without asking the user again

The goal is not magic for its own sake.

The goal is to remove unnecessary user work.

---

# 4. Anticipatory Context

Look for information the product can safely use to make the next interaction easier.

Possible context:

- current screen
- current object
- recent action
- recent search
- location, when relevant and explicitly permitted
- time
- device capability
- user preference
- prior selection
- history
- nearby entities
- known vocabulary
- current workflow stage

Ask:

> What mistake or extra question can we prevent if the product understands the current context?

## Rules

Contextual intelligence must be:

- relevant
- proportionate
- explainable when needed
- privacy-conscious
- permission-aware
- easy to disable where appropriate

Never collect broad context simply because it might be useful.

Use the smallest amount of context that solves the problem.

---

# 5. Invisible Craft

Invisible craft is work the user may never explicitly notice because it prevents friction before it appears.

Examples:

- caching likely entities
- prefetching the next screen
- remembering state
- preserving scroll position
- debouncing noisy input
- intelligent typo handling
- better speech-recognition hints
- optimistic updates
- undo rather than confirmation spam
- smart defaults
- precomputed suggestions
- local processing for private context
- automatic draft saving
- resilient offline/retry behaviour

A useful test:

> If this feature works perfectly, will the user simply continue without thinking?

That can be a premium feature.

---

# 6. Remove Correction Loops

Cheap-feeling software often creates unnecessary correction loops:

1. user performs action
2. system misunderstands
3. user corrects system
4. system asks for confirmation
5. user repeats information

Premium software tries to make the obvious path succeed the first time.

Audit:

- speech input
- search
- forms
- date/time entry
- location
- names
- units
- recurring actions
- AI prompts
- categorisation
- import/export
- permissions

For each, ask:

> What does the user repeatedly have to fix?

Fix the system, not the user's behaviour.

---

# 7. Responsive Physicality

A premium app should acknowledge interaction immediately.

For tappable controls, consider:

- subtle scale
- opacity shift
- highlight
- ripple
- spring response
- state change
- haptic

The response should begin at touch-down when appropriate, not only after the action completes.

## Press-State Rules

- Keep scale changes subtle.
- Do not make every button bounce.
- Do not delay the action just to show animation.
- Preserve accessibility.
- Ensure the pressed state works consistently across the app.

The user should feel that the control is responding to them, not that they are sending commands into a dead surface.

---

# 8. Motion Creates Continuity

Motion should answer:

- What changed?
- Where did it come from?
- Where did it go?
- What became active?
- What completed?

Good examples:

- page content slides in the direction of navigation
- a microphone transforms into a confirmation state
- a selected object expands into its detail view
- a sheet emerges from the bottom
- a successful action resolves visually rather than abruptly disappearing
- a tab indicator moves rather than teleports

Avoid generic fade-ins everywhere.

Use animation to make state transitions legible.

---

# 9. Build Complex Motion as Sequences

Do not try to create a sophisticated interaction as one giant animation.

Break it into stages.

Example:

1. input accepted
2. button changes state
3. background responds
4. text transitions
5. result appears
6. interaction settles

For each stage define:

- trigger
- duration
- easing
- visual property
- end state

This makes implementation easier to reason about and easier for coding agents to execute correctly.

---

# 10. Haptics Are Semantic Feedback

Haptics should communicate meaning, not vibrate on every tap.

Possible hierarchy:

## Light
Use for:
- high-frequency minor interactions
- small toggles
- picker changes
- lightweight selection

## Medium
Use for:
- switching meaningful modes
- completing a normal action
- committing a choice

## Strong / Distinct
Use for:
- success
- important confirmation
- destructive warning
- significant state transition

Do not use the same haptic strength everywhere.

Avoid haptics when:

- the interaction happens repeatedly in rapid succession
- it adds noise
- the platform does not support it well
- accessibility/user settings indicate otherwise

---

# 11. Iconography Changes Product Character

Do not choose icons only by meaning.

Icon style affects the personality of the entire app.

Common directions:

- thin/minimal → light, clean, refined
- filled/heavy → bold, friendly, direct
- detailed → expressive, illustrative, information-rich

Pick one coherent direction.

Do not mix:

- different stroke weights
- filled and outlined variants arbitrarily
- unrelated icon libraries
- incompatible corner styles

One inconsistent icon can make a polished navigation bar feel accidental.

---

# 12. Distinctive Illustration

Custom illustrations can make empty states and product moments feel proprietary rather than template-generated.

Good uses:

- empty states
- onboarding
- success
- search with no results
- assistant/listening state
- waiting
- contextual help

If the product has a mascot or illustration language:

- define a base character/style
- preserve proportions and visual identity
- generate or draw variations from that base
- keep lighting, stroke, palette, and expression consistent

Do not add illustrations where they slow down an operational task.

---

# 13. Empty States Must Have Personality and Purpose

An empty state should answer:

1. Why is this empty?
2. What belongs here?
3. What can I do next?

Premium empty states can also communicate brand character through:

- illustration
- short human copy
- subtle animation
- contextual CTA

Never leave a blank page with only "No data."

---

# 14. Loading Is Part of the Product

Waiting time is experienced as product quality.

Avoid using a generic spinner for every loading state.

Prefer where appropriate:

- skeletons
- shimmer
- streaming
- staged progress
- status messages
- preserved previous content
- optimistic update
- prefetching

The user should understand:

- that the app is working
- what is coming
- whether they can continue
- whether their previous action was accepted

For AI tasks, loading copy can explain the current stage without pretending certainty.

---

# 15. Keyboard Behaviour Is Premium Behaviour

For mobile apps, keyboard handling is not implementation trivia.

Audit:

- Does the keyboard cover the input?
- Does the submit button remain reachable?
- Can the user dismiss naturally?
- Does layout jump?
- Is focus preserved correctly?
- Are next/previous actions sensible?
- Does scroll position behave predictably?
- Does the keyboard animation feel integrated with the layout?

A beautiful screen that fights the keyboard does not feel premium.

---

# 16. Smart Defaults

A strong default removes a decision.

Ask for every choice:

- Can this be inferred?
- Can it be remembered?
- Is there a safe standard?
- Is there a likely recent value?
- Can the product choose correctly most of the time?

Examples:

- preferred unit
- last-used filter
- common account
- typical duration
- likely category
- recent recipient
- previous export type
- current date
- current location with permission

Do not hide important consequences behind defaults.

Make destructive, financial, privacy, and high-impact choices explicit.

---

# 17. Preserve State

Premium apps remember what the user was doing.

Preserve when appropriate:

- unfinished input
- scroll position
- selected tab
- filter state
- draft
- currently viewed item
- playback position
- search query
- partially completed workflow

Do not force users to rebuild context after:

- navigating back
- switching tabs
- brief app backgrounding
- recoverable network failure

---

# 18. Error Prevention Beats Error Messaging

Do not wait for the user to fail.

Prevent predictable failure through:

- inline validation
- format assistance
- contextual suggestions
- safe defaults
- duplicate detection
- input constraints
- previews
- disabled impossible actions
- smarter parsing
- background checks

A premium experience often feels easy because invalid paths disappear before the user reaches them.

---

# 19. Error Recovery

When failure still occurs:

- preserve input
- explain plainly
- provide retry
- provide alternative action
- distinguish user error from system error
- avoid blame
- do not destroy progress

Prefer recoverable actions over dead-end alerts.

---

# 20. Privacy Is Part of Premium

A clever feature stops feeling premium if it feels invasive.

For contextual features:

- request permission at the moment the benefit is understandable
- explain why the context improves the experience
- minimise collected data
- prefer on-device processing where feasible
- transmit only what is necessary
- make optional features actually optional
- provide an off switch

Do not disguise privacy-sensitive behaviour as convenience.

---

# 21. Performance Is Felt

Users interpret latency and dropped frames as quality problems.

Audit:

- touch latency
- scroll smoothness
- animation frame rate
- startup
- navigation transition
- keyboard response
- image loading
- network request sequencing
- unnecessary re-rendering
- large bundles/assets

Premium polish cannot compensate for jank.

---

# 22. Consistency Creates Trust

Micro-details only compound when they follow a system.

Standardise:

- animation duration
- spring behaviour
- haptic hierarchy
- icon style
- button states
- loading patterns
- empty-state voice
- radius
- typography
- spacing
- gesture behaviour

A product with ten individually beautiful but inconsistent interactions still feels unfinished.

---

# 23. Study Premium Products Deliberately

Improve taste through repeated exposure.

Do not merely screenshot apps you like.

For each reference, record:

- what happened
- why it felt good
- what the user did before it
- how the interface responded
- timing
- motion
- haptic
- copy
- layout
- context
- what friction was removed
- what was invisible

Then extract the principle.

Do not copy proprietary visuals one-for-one.

---

# 24. The Premium Moment Test

For every important flow, ask:

## Before
What does the user expect to be annoying, slow, or error-prone?

## During
What can the product do to make the action feel responsive and clear?

## After
Can the user immediately trust that it worked?

## Surprise
Is there a small moment where the product performs better than expected?

The surprise should come from usefulness first, spectacle second.

---

# 25. Premium Opportunity Hunt

When auditing an app, inspect these surfaces:

- login
- onboarding
- search
- forms
- voice
- AI input
- navigation
- tab switching
- list actions
- empty states
- loading
- error
- success
- keyboard
- permissions
- notifications
- sharing
- import/export
- settings
- recurring tasks
- destructive actions
- offline state
- returning to the app

For each, find at least one opportunity to remove friction or improve feedback.

---

# 26. Premium Polish Workflow

When asked to make an existing app feel premium:

## Step 1 — Inspect the Real Product
Review:
- code
- screenshots
- flows
- states
- interactions
- design tokens
- platform conventions

Do not redesign from imagination if the product already exists.

## Step 2 — Identify the Core Loops
Find the actions users repeat most often.

Prioritise polishing frequent actions over rare decorative screens.

## Step 3 — Log Friction
For each loop record:
- extra tap
- extra question
- correction
- delay
- uncertainty
- jump
- forgotten state
- bad default
- weak feedback

## Step 4 — Find Invisible Improvements
Ask:
- what can be inferred?
- what can be prefetched?
- what can be remembered?
- what can be prevented?
- what context can safely help?

## Step 5 — Add Immediate Feedback
Implement:
- pressed state
- loading acknowledgement
- success acknowledgement
- semantic haptic if appropriate

## Step 6 — Improve Continuity
Add purposeful transitions where state currently teleports.

## Step 7 — Improve Edge States
Design:
- empty
- loading
- error
- no-results
- success

## Step 8 — Improve Character
Review:
- icon family
- illustration
- micro-copy
- subtle product-specific delight

## Step 9 — Verify Privacy and Accessibility

## Step 10 — Run the Premium Audit
Use:
`templates/premium-experience-audit.md`

---

# 27. Implementation Guidance

## React Native

Where the project already uses them, suitable categories of tools include:

- Reanimated / native animation APIs
- Gesture Handler
- Expo/native haptics
- keyboard-aware layout/controller tools

Do not add dependencies automatically.

Prefer the project's current stack when it can produce the result well.

## SwiftUI

Prefer native:

- state-driven transitions
- matched geometry where appropriate
- sensory feedback/haptics
- focus management
- safe-area and keyboard behaviour

## Flutter

Prefer:

- implicit animations for simple state changes
- explicit animation controllers for coordinated sequences
- platform haptics
- proper focus/keyboard handling

## Web / PWA

Do not pretend unsupported mobile haptics exist.

Focus on:

- pointer/touch feedback
- transitions
- optimistic updates
- preserved state
- contextual intelligence
- loading quality

---

# 28. Accessibility Guardrails

Premium must include accessibility.

Always consider:

- reduced motion
- system haptic preferences
- touch target size
- dynamic text
- focus visibility
- screen-reader labels
- contrast
- keyboard navigation
- colour-independent state
- motion sickness
- cognitive load

If a decorative premium effect conflicts with usability, remove the effect.

---

# 29. Avoid Fake Premium

Reject these patterns when they have no functional or brand reason:

- blur everywhere
- giant bounce animations
- haptic on every tap
- unnecessary parallax
- random gradients
- excessive spring motion
- loading animations that make tasks slower
- decorative 3D
- huge shadows
- glass cards everywhere
- confetti for routine actions
- forced mascots
- overly clever copy
- context collection without real benefit

Premium comes from precision, not decoration density.

---

# 30. Required Output for Audits

When this skill is used to audit an app, return:

## Premium Diagnosis
Why the app currently feels ordinary, cheap, or unfinished.

## Core Loops
The highest-frequency actions worth polishing first.

## Friction Log
Specific extra taps, corrections, delays, confusing states, or bad defaults.

## Invisible Craft Opportunities
Context, prefetching, memory, prediction, preservation, prevention.

## Interaction Polish
Press states, haptics, transitions, keyboard behaviour.

## Edge States
Loading, empty, error, success, offline.

## Visual Cohesion
Icons, illustration, copy, motion consistency.

## Privacy / Accessibility
Any constraints on contextual or tactile features.

## Implementation Plan
Concrete changes in priority order.

## Audit Score
Use the premium-experience audit.

Do not respond with vague advice such as "add smoother animations."

---

# 31. Final Standard

The product should reach the point where users are more likely to say:

- "That was smooth."
- "It remembered."
- "It just knew."
- "I didn't have to fix it."
- "That felt nice."
- "This feels really polished."

rather than:

- "Nice gradient."
- "Cool animation."

The strongest premium work often disappears into the task succeeding.
