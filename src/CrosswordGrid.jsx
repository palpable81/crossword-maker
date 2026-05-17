import { useState, useRef, useCallback, useEffect } from 'react'
import { computeClueNumbers, isOpen } from './gridUtils'
import './CrosswordGrid.css'

export default function CrosswordGrid({ grid, size, onUpdateCell, onSelectionChange }) {
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('across') // 'across' | 'down'
  const [suggestions, setSuggestions] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
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

    if (e.key === ' ' || e.key === '.') {
      e.preventDefault()
      onUpdateCell(row, col, { black: !cell.black, letter: '' })
      return
    }

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
      if (!cell.black) {
        onUpdateCell(row, col, { letter: e.key.toUpperCase() })
        if (direction === 'across') move(row, col, 0, 1)
        else move(row, col, 1, 0)
      }
    }
  }, [grid, direction, move, onUpdateCell])

  const fetchSuggestions = useCallback(async () => {
    const info = getWordInfo(grid, selected, direction, size)
    if (!info) return
    setIsLoading(true)
    setSuggestions(null)
    try {
      const res = await fetch(`https://api.datamuse.com/words?sp=${info.pattern}&max=50`)
      const data = await res.json()
      const seen = new Set()
      const results = []
      for (const d of data) {
        const word = d.word.replace(/\s+/g, '').toUpperCase()
        if (word.length >= 2 && !seen.has(word) && wordMatchesSlot(word.toLowerCase(), info.cells)) {
          seen.add(word)
          results.push(word)
        }
      }
      setSuggestions(results)
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [grid, selected, direction, size])

  const applyWord = useCallback((word) => {
    const info = getWordInfo(grid, selected, direction, size)
    if (!info) return
    if (info.direction === 'across') {
      word.split('').forEach((ch, i) =>
        onUpdateCell(info.row, info.startCol + i, { letter: ch })
      )
    } else {
      word.split('').forEach((ch, i) =>
        onUpdateCell(info.startRow + i, info.col, { letter: ch })
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
            const inWord = selected && isInWord(grid, selected, direction, r, c, size)
            const num = clueNumbers.numbers[r]?.[c]
            const ref = getRef(r, c)

            return (
              <div
                key={`${r}-${c}`}
                className={[
                  'cell',
                  cell.black ? 'black' : '',
                  (!cell.black && !cell.letter) ? 'empty' : '',
                  isSelected ? 'selected' : '',
                  (!cell.black && inWord && !isSelected) ? 'highlighted' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleClick(r, c)}
              >
                {!cell.black && (
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
                )}
              </div>
            )
          })
        )}
      </div>
      <div className="suggest-bar">
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

function isInWord(grid, selected, direction, r, c, size) {
  if (direction === 'across') {
    if (r !== selected.row) return false
    // Find word bounds for selected cell
    let start = selected.col
    while (start > 0 && !grid[r][start - 1].black) start--
    let end = selected.col
    while (end < size - 1 && !grid[r][end + 1].black) end++
    return c >= start && c <= end
  } else {
    if (c !== selected.col) return false
    let start = selected.row
    while (start > 0 && !grid[start - 1][c].black) start--
    let end = selected.row
    while (end < size - 1 && !grid[end + 1][c].black) end++
    return r >= start && r <= end
  }
}

function buildPattern(cells) {
  // Use known letters as anchors; trailing empty cells become * so shorter words are returned too
  const lastFilled = cells.reduce((acc, c, i) => (c ? i : acc), -1)
  if (lastFilled === -1) return '??*' // all empty: return common words of any length ≥ 2
  return cells.slice(0, lastFilled + 1).map(c => c || '?').join('') + '*'
}

function wordMatchesSlot(word, cells) {
  // word has already had spaces stripped and is lowercase; cells are lowercase or ''
  if (word.length > cells.length) return false
  for (let i = 0; i < word.length; i++) {
    if (cells[i] && cells[i] !== word[i]) return false
  }
  return true
}

function getWordInfo(grid, selected, direction, size) {
  if (!selected) return null
  const { row, col } = selected
  if (direction === 'across') {
    let start = col
    while (start > 0 && isOpen(grid, row, start - 1, size)) start--
    let end = col
    while (end < size - 1 && !grid[row][end + 1].black) end++
    const cells = Array.from({ length: end - start + 1 }, (_, i) =>
      grid[row][start + i].letter.toLowerCase()
    )
    return { cells, pattern: buildPattern(cells), direction: 'across', row, startCol: start }
  } else {
    let start = row
    while (start > 0 && isOpen(grid, start - 1, col, size)) start--
    let end = row
    while (end < size - 1 && !grid[end + 1][col].black) end++
    const cells = Array.from({ length: end - start + 1 }, (_, i) =>
      grid[start + i][col].letter.toLowerCase()
    )
    return { cells, pattern: buildPattern(cells), direction: 'down', col, startRow: start }
  }
}

