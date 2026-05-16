import { useState, useRef, useCallback } from 'react'
import './CrosswordGrid.css'

export default function CrosswordGrid({ grid, size, onUpdateCell }) {
  const [selected, setSelected] = useState(null)
  const [direction, setDirection] = useState('across') // 'across' | 'down'
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
            const num = clueNumbers[r]?.[c]
            const ref = getRef(r, c)

            return (
              <div
                key={`${r}-${c}`}
                className={[
                  'cell',
                  cell.black ? 'black' : '',
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

function computeClueNumbers(grid, size) {
  const numbers = {}
  let n = 1
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].black) continue
      const acrossStart = (c === 0 || grid[r][c - 1].black) && c < size - 1 && !grid[r][c + 1].black
      const downStart   = (r === 0 || grid[r - 1][c].black) && r < size - 1 && !grid[r + 1][c].black
      if (acrossStart || downStart) {
        if (!numbers[r]) numbers[r] = {}
        numbers[r][c] = n++
      }
    }
  }
  return numbers
}
