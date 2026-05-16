# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run lint      # ESLint on all .js/.jsx files
```

No test suite is configured.

## Architecture

React 19 + Vite app for building crossword puzzles interactively. No state management library — all state lives in `App.jsx` and is passed down as props.

**State shape (App.jsx):**
- `grid` — 12×12 array of `{ letter: string, black: boolean }` cell objects
- `clues` — object keyed by `"${number}-${'across'|'down'}"` (e.g. `"1-across"`)
- `activeClueKey` — currently highlighted clue key

**Component responsibilities:**
- `App.jsx` — owns all state, passes handlers to children
- `CrosswordGrid.jsx` — main grid editor; handles keyboard navigation, cell selection, direction toggling, and word suggestions via the [Datamuse API](https://www.datamuse.com/api/)
- `ClueBank.jsx` — displays/edits across and down clues, highlights active clue
- `gridUtils.js` — pure functions: `isOpen()`, `computeClueNumbers()`, `findActiveClueNum()`

**Clue numbering** is computed dynamically from the grid state on every render — there is no stored numbering in state.

**Word suggestions** query Datamuse using the current slot's letters as a pattern (known letters as anchors, empty cells as `?`).

**Print support** is handled entirely in CSS (`@media print` in `CrosswordGrid.css`).
