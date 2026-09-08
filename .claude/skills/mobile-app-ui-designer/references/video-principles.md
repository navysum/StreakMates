# Video Principles Reference

Source:
- Kole Jain — "Everything you need to know about Mobile App UI's in 8 minutes (beginner friendly)"
- YouTube: https://www.youtube.com/watch?v=Gfsd8NNuD9g
- Published: 18 April 2026

This file is a concise, paraphrased reference for the concepts that informed the skill. It is not a transcript.

## Video Structure

The video is organized around:

- Navigation
- Scale
- Content
- One Screen, One Job
- Gestures
- Dynamism
- Empty States

## Navigation

Mobile navigation should prioritize a small number of important destinations rather than reproduce a desktop sidebar.

Practical guidance:
- 3–4 bottom-navigation items is a strong default.
- 5 can work but begins to feel crowded.
- Touch controls need generous targets.
- A full-screen hub/menu can replace a crowded persistent navbar.
- Top-bar actions should change with context.

## Scale

Mobile typography should remain readable. Smaller screens do not justify shrinking all text and spacing.

A mobile interface often uses text at least as readable as desktop, because the device is touch-first and viewed at a different distance.

## Content and Layout

Desktop layouts often use multi-column grids. Mobile interfaces generally work better when a section chooses a single direction:

- stack vertically, or
- use a horizontal rail for secondary content

Avoid forcing a two-dimensional desktop dashboard into a narrow viewport.

## One Screen, One Job

A normal task screen should have one clear responsibility.

Examples:
- settings is for settings
- an editor is for editing
- search is for search

The home screen is the main exception because it may act as an overview/hub.

## Building Blocks

Common UI building blocks include:
- cards/containers
- text/links
- images/media
- inputs/controls

Cards are flexible but should not be endlessly nested. Whitespace can create grouping without another container.

## Gestures

The video highlights familiar mobile patterns such as:
- swipe/back
- bottom sheets
- swipe-based reveal/search interactions
- long press for contextual actions

A production implementation should also provide accessible visible alternatives for important gesture actions.

## Dynamism

The visible UI can change with context.

Examples:
- global navigation can disappear in a focused editor
- item-specific actions can appear after selection
- creation flows can reduce controls to confirm/cancel
- animations can make action changes feel coherent

## Empty States

Different empty states need different recovery paths.

First-use/no-content:
- explain what the area is for
- emphasize the next action
- optionally teach the user what to do

No search results:
- acknowledge zero results
- help the user recover from typos/filters
- provide a clear way to adjust or exit

Treat empty states as designed product states, not blank placeholders.
