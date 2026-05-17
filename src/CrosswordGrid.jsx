import { useState, useRef, useCallback, useEffect } from 'react'
import { computeClueNumbers, isOpen } from './gridUtils'
import './CrosswordGrid.css'

export default function CrosswordGrid({ grid, size, onUpdateCell, onSelectionChange }) {
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('across') // 'across' | 'down'
  const [suggestions, setSuggestions] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [minLen, setMinLen] = useState(2)
  const [maxLen, setMaxLen] = useState(12)
  const cellRefs = useRef({})

  const getRef = (row, col) => {
    const key = `${row}-${col}`
    if (!cellRefs.current[key]) cellRefs.current[key] = { current: null }
    return cellRefs.current[key]
  }

  const focus = useCallback((row, col) => {
    const key = `${row}-${col}`
    cellRefs.current[key]?.current?.focus()
  }, [])

  const move = useCallback((row, col, dr, dc) => {
    const newRow = row + dr
    const newCol = col + dc
    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
      setSelected({ row: newRow, col: newCol })
      focus(newRow, newCol)
    }
  }, [size, focus])

  const handleClick = useCallback((row, col) => {
    if (selected && selected.row === row && selected.col === col) {
      setDirection(d => d === 'across' ? 'down' : 'across')
    } else {
      setSelected({ row, col })
    }
    focus(row, col)
  }, [selected, focus])

  const handleKeyDown = useCallback((e, row, col) => {
    const cell = grid[row][col]

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (cell.letter) {
        onUpdateCell(row, col, { letter: '' })
      } else {
        if (direction === 'across') move(row, col, 0, -1)
        else move(row, col, -1, 0)
      }
      return
    }

    if (e.key === 'Delete') {
      e.preventDefault()
      onUpdateCell(row, col, { letter: '' })
      return
    }

    if (e.key === 'ArrowRight') { e.preventDefault(); setDirection('across'); move(row, col, 0, 1); return }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setDirection('across'); move(row, col, 0, -1); return }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setDirection('down'); move(row, col, 1, 0); return }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setDirection('down'); move(row, col, -1, 0); return }

    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault()
      onUpdateCell(row, col, { letter: e.key.toUpperCase() })
      if (direction === 'across') move(row, col, 0, 1)
      else move(row, col, 1, 0)
    }
  }, [grid, direction, move, onUpdateCell])

  const fetchSuggestions = useCallback(async () => {
    const info = getWordInfo(grid, selected, direction, size)
    if (!info) return

    const offset = direction === 'across'
      ? selected.col - info.startCol
      : selected.row - info.startRow
    const cellsFromHere = info.cells.slice(offset)
    const maxPossible = cellsFromHere.length
    const lengths = []
    for (let L = minLen; L <= Math.min(maxLen, maxPossible); L++) lengths.push(L)
    if (lengths.length === 0) { setSuggestions([]); return }

    setIsLoading(true)
    setSuggestions(null)
    try {
      const perLength = 8
      const allResults = await Promise.all(
        lengths.map(async L => {
          const pattern = buildPattern(cellsFromHere.slice(0, L))
          const res = await fetch(`https://api.datamuse.com/words?sp=${pattern}&max=${perLength}`)
          const data = await res.json()
          return data
            .map(d => d.word.replace(/\s+/g, '').toUpperCase())
            .filter(w => w.length === L)
            .slice(0, perLength)
        })
      )
      const seen = new Set()
      const results = []
      for (const words of allResults) {
        for (const word of words) {
          if (!seen.has(word)) { seen.add(word); results.push(word) }
        }
      }
      setSuggestions(results)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [grid, selected, direction, size, minLen, maxLen])

  const applyWord = useCallback((word) => {
    const info = getWordInfo(grid, selected, direction, size)
    if (!info) return
    if (info.direction === 'across') {
      word.split('').forEach((ch, i) =>
        onUpdateCell(info.row, selected.col + i, { letter: ch })
      )
    } else {
      word.split('').forEach((ch, i) =>
        onUpdateCell(selected.row + i, info.col, { letter: ch })
      )
    }
    setSuggestions(null)
  }, [grid, selected, direction, size, onUpdateCell])

  useEffect(() => {
    onSelectionChange?.(selected, direction)
  }, [selected, direction])

  // Compute clue numbers
  const clueNumbers = computeClueNumbers(grid, size)

  return (
    <div className="grid-wrapper">
      <div
        className="crossword-grid"
        style={{ '--size': size }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selected?.row === r && selected?.col === c
            const inWord = selected && isInWord(grid, selected, direction, r, c)
            const num = clueNumbers.numbers[r]?.[c]
            const ref = getRef(r, c)

            return (
              <div
                key={`${r}-${c}`}
                className={[
                  'cell',
                  !cell.letter ? 'empty' : '',
                  isSelected ? 'selected' : '',
                  (inWord && !isSelected) ? 'highlighted' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleClick(r, c)}
              >
                <>
                  {num && <span className="cell-number">{num}</span>}
                  <input
                    ref={el => { ref.current = el }}
                    className="cell-input"
                    type="text"
                    maxLength={1}
                    value={cell.letter}
                    readOnly
                    onFocus={() => setSelected({ row: r, col: c })}
                    onKeyDown={e => handleKeyDown(e, r, c)}
                    tabIndex={isSelected ? 0 : -1}
                    aria-label={`Row ${r + 1}, Column ${c + 1}`}
                  />
                </>
              </div>
            )
          })
        )}
      </div>
      <div className="suggest-bar">
        <div className="word-length-filter">
          <label>
            Min length
            <input
              type="number"
              className="length-input"
              min={1}
              max={maxLen}
              value={minLen}
              onChange={e => setMinLen(Math.max(1, Math.min(Number(e.target.value), maxLen)))}
            />
          </label>
          <label>
            Max length
            <input
              type="number"
              className="length-input"
              min={minLen}
              max={20}
              value={maxLen}
              onChange={e => setMaxLen(Math.max(minLen, Math.min(Number(e.target.value), 20)))}
            />
          </label>
        </div>
        <button
          className="btn-suggest"
          onClick={fetchSuggestions}
          disabled={!selected || isLoading}
        >
          {isLoading ? 'Loading…' : 'Suggest Word'}
        </button>
        {suggestions !== null && (
          <div className="suggestions-panel">
            {suggestions.length === 0
              ? <span className="no-suggestions">No suggestions found</span>
              : suggestions.map(w => (
                  <button key={w} className="suggestion-word" onClick={() => applyWord(w)}>
                    {w}
                  </button>
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

function isInWord(grid, selected, direction, r, c) {
  if (direction === 'across') return r === selected.row
  return c === selected.col
}

function buildPattern(cells) {
  return cells.map(c => c || '?').join('')
}


function getWordInfo(grid, selected, direction, size) {
  if (!selected) return null
  const { row, col } = selected
  if (direction === 'across') {
    let start = col
    while (start > 0 && !grid[row][start - 1].black) start--
    let end = col
    while (end < size - 1 && !grid[row][end + 1].black) end++
    const cells = Array.from({ length: end - start + 1 }, (_, i) =>
      grid[row][start + i].letter.toLowerCase()
    )
    return { cells, pattern: buildPattern(cells), direction: 'across', row, startCol: start }
  } else {
    let start = row
    while (start > 0 && !grid[start - 1][col].black) start--
    let end = row
    while (end < size - 1 && !grid[end + 1][col].black) end++
    const cells = Array.from({ length: end - start + 1 }, (_, i) =>
      grid[start + i][col].letter.toLowerCase()
    )
    return { cells, pattern: buildPattern(cells), direction: 'down', col, startRow: start }
  }
}

