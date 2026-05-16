export function isOpen(grid, r, c, size) {
  return r >= 0 && r < size && c >= 0 && c < size && !grid[r][c].black && !!grid[r][c].letter
}

export function computeClueNumbers(grid, size) {
  const numbers = {}
  const acrossNums = []
  const downNums = []
  let n = 1
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isOpen(grid, r, c, size)) continue
      const acrossStart = !isOpen(grid, r, c - 1, size) && isOpen(grid, r, c + 1, size)
      const downStart   = !isOpen(grid, r - 1, c, size) && isOpen(grid, r + 1, c, size)
      if (acrossStart || downStart) {
        if (!numbers[r]) numbers[r] = {}
        numbers[r][c] = n
        if (acrossStart) acrossNums.push(n)
        if (downStart)   downNums.push(n)
        n++
      }
    }
  }
  return { numbers, acrossNums, downNums }
}

export function findActiveClueNum(grid, selected, direction, numbers, size) {
  if (!selected) return null
  const { row, col } = selected
  if (direction === 'across') {
    let c = col
    while (c > 0 && isOpen(grid, row, c - 1, size)) c--
    return numbers[row]?.[c] ?? null
  } else {
    let r = row
    while (r > 0 && isOpen(grid, r - 1, col, size)) r--
    return numbers[r]?.[col] ?? null
  }
}
