import { useState, useCallback } from 'react'
import CrosswordGrid from './CrosswordGrid'
import './App.css'

const GRID_SIZE = 12

function createEmptyGrid(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ letter: '', black: false }))
  )
}

export default function App() {
  const [grid, setGrid] = useState(() => createEmptyGrid(GRID_SIZE))

  const updateCell = useCallback((row, col, value) => {
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      next[row][col] = { ...next[row][col], ...value }
      return next
    })
  }, [])

  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid(GRID_SIZE))
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Crossword Maker</h1>
        <p className="hint">Click a cell to type a letter &middot; Press <kbd>Space</kbd> or <kbd>.</kbd> to toggle black square &middot; Arrow keys to navigate</p>
        <button className="btn-clear" onClick={clearGrid}>Clear Grid</button>
      </header>
      <main>
        <CrosswordGrid grid={grid} size={GRID_SIZE} onUpdateCell={updateCell} />
      </main>
    </div>
  )
}
