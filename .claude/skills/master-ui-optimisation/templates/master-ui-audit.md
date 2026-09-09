# Master UI Optimisation Audit

Score each item:

- **2 = Strong**
- **1 = Acceptable / needs refinement**
- **0 = Failing**

Maximum score: **60**

| Area | Test | Score |
|---|---|---:|
| User intent | The primary user goal is obvious. | /2 |
| Screen job | The screen has one dominant responsibility. | /2 |
| Flow | Entry, exit, cancel/back and next action are clear. | /2 |
| States | Empty/loading/error/success states are defined. | /2 |
| Information architecture | Content is grouped and ordered logically. | /2 |
| Data form | Tables/charts/lists/timelines match the data task. | /2 |
| Navigation | Primary navigation reflects frequency/importance. | /2 |
| Progressive disclosure | Low-frequency complexity is hidden appropriately. | /2 |
| Invisible UI | Tooltips/popovers/toasts/etc. exist where needed. | /2 |
| Hierarchy | First/second/third visual priorities are obvious. | /2 |
| Spacing | Spacing follows a coherent rhythm. | /2 |
| Proximity | Related items group naturally without over-boxing. | /2 |
| Cards | Containers are intentional and not excessively nested. | /2 |
| Typography | Type is readable and appropriate to product density. | /2 |
| Icons | Icon family/style/meaning are consistent. | /2 |
| Signifiers | Interactive states look interactive. | /2 |
| Component states | Hover/focus/pressed/disabled/loading states exist. | /2 |
| Colour foundation | Neutrals create useful structure. | /2 |
| Accent | Functional accent is used intentionally. | /2 |
| Semantics | Status/data colour communicates consistent meaning. | /2 |
| Dark mode | Dark mode is designed rather than inverted. | /2 |
| Depth | Borders/shadows/radius/elevation are restrained and consistent. | /2 |
| Dashboard density | If applicable, data is scanable without decorative overload. | /2 |
| Mobile | If applicable, layout is reprioritised rather than shrunk. | /2 |
| Touch/gesture | Touch targets are comfortable; critical gestures have alternatives. | /2 |
| Motion | Animation explains state or adds intentional delight. | /2 |
| Reduced motion | Heavy/ambient animation has a reduced-motion path. | /2 |
| Personality | Brand-specific motifs/copy replace generic AI styling. | /2 |
| Accessibility | Contrast, focus, keyboard, labels, scaling are sound. | /2 |
| Implementation | Existing behaviour is preserved and design tokens/components are coherent. | /2 |

## Score Interpretation

- **55–60** — Excellent; highly intentional
- **49–54** — Strong; targeted polish remains
- **41–48** — Good foundation; several meaningful weaknesses
- **31–40** — Visually usable but structurally inconsistent
- **0–30** — Redesign structure before adding polish

## Automatic Failure Flags

Regardless of score, do not approve if:

- core task cannot be completed
- user can become trapped
- important state is missing
- critical interaction is hover-only or undiscoverable-gesture-only
- async action gives no feedback
- text/touch scale is inaccessible
- mobile is merely compressed desktop
- colour is sole status indicator
- dark mode is simple inversion
- decorative motion blocks comprehension
- no reduced-motion path for heavy animation
- data visualisation misrepresents the task/data
- redesign breaks core behaviour
