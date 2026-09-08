# Mobile UI Audit Template

Use this after designing or implementing a mobile screen.

Score each item:

- **2 = Strong**
- **1 = Acceptable / needs polish**
- **0 = Failing**

Maximum score: **30**

| Area | Test | Score |
|---|---|---:|
| Screen focus | The screen has one dominant job. | /2 |
| Primary action | The main action is obvious. | /2 |
| Navigation | Persistent primary navigation is limited and prioritized. | /2 |
| Touch | Important controls have comfortable touch targets. | /2 |
| Type | Text is readable without shrinking to fit density. | /2 |
| Flow | Each section has a clear dominant scroll/layout direction. | /2 |
| Hierarchy | Content importance is immediately understandable. | /2 |
| Cards | Containers are used intentionally, without needless nesting. | /2 |
| Context | Actions adapt appropriately to the active task/state. | /2 |
| Gestures | Gestures feel familiar and important actions have visible alternatives. | /2 |
| Motion | Animation explains state/spatial change and supports reduced motion. | /2 |
| Empty state | First-use/no-content state is designed. | /2 |
| No-results | Search/filter failure has a useful recovery path. | /2 |
| Errors/loading | Loading and error behaviour is clear and recoverable. | /2 |
| Mobile robustness | Small screens, safe areas, keyboard, and dynamic text remain usable. | /2 |

## Interpretation

- **27–30:** Strong mobile UI
- **23–26:** Good, with targeted polish needed
- **18–22:** Usable but structurally weak
- **0–17:** Redesign the screen architecture before visual polish

## Mandatory Failure Flags

Regardless of total score, do not approve the screen if:

- a critical action is gesture-only
- important controls are too small to tap reliably
- essential content depends on horizontal scrolling
- the screen has multiple competing primary jobs
- empty/error states can leave the user stranded
- the implementation breaks existing core behaviour
