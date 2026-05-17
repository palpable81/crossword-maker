import { useState, useCallback, useRef, useEffect } from 'react'
import CrosswordGrid from './CrosswordGrid'
import ClueBank from './ClueBank'
import { computeClueNumbers, findActiveClueNum, remapClues } from './gridUtils'
import './App.css'

const GRID_SIZE = 12

function createEmptyGrid(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ letter: '' }))
  )
}

export default function App() {
  const [grid, setGrid] = useState(() => createEmptyGrid(GRID_SIZE))
  const [clues, setClues] = useState({})
  const [activeClueKey, setActiveClueKey] = useState(null)

  const prevGridRef = useRef(grid)
  useEffect(() => {
    const prevGrid = prevGridRef.current
    prevGridRef.current = grid
    setClues(prev => {
      if (!prev || Object.keys(prev).length === 0) return prev
      return remapClues(prevGrid, grid, prev, GRID_SIZE)
    })
  }, [grid])

  const clueData = computeClueNumbers(grid, GRID_SIZE)

  const updateCell = useCallback((row, col, value) => {
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      next[row][col] = { ...next[row][col], ...value }
      return next
    })
  }, [])

  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid(GRID_SIZE))
    setClues({})
    setActiveClueKey(null)
  }, [])

  const handleSelectionChange = useCallback((selected, direction) => {
    const num = findActiveClueNum(grid, selected, direction, clueData.numbers, GRID_SIZE)
    setActiveClueKey(num ? `${num}-${direction}` : null)
  }, [grid, clueData.numbers])

  const handleClueChange = useCallback((key, value) => {
    setClues(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Crossword Maker</h1>
        <p className="hint">Click a cell to type a letter &middot; Arrow keys to navigate</p>
        <div className="header-actions">
          <button className="btn-print" onClick={() => window.print()}>Print Puzzle</button>
          <button className="btn-clear" onClick={clearGrid}>Clear Grid</button>
        </div>
      </header>
      <main>
        <ClueBank
          clueData={clueData}
          clues={clues}
          activeClueKey={activeClueKey}
          onClueChange={handleClueChange}
        />
        <CrosswordGrid
          grid={grid}
          size={GRID_SIZE}
          onUpdateCell={updateCell}
          onSelectionChange={handleSelectionChange}
        />
      </main>
    </div>
  )
}
