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

export function remapClues(oldGrid, newGrid, oldClues, size) {
  if (!oldClues || Object.keys(oldClues).length === 0) return {}

  const oldData = computeClueNumbers(oldGrid, size)
  const newData = computeClueNumbers(newGrid, size)

  const numToPos = {}
  for (const r in oldData.numbers) {
    for (const c in oldData.numbers[r]) {
      numToPos[oldData.numbers[r][c]] = { row: Number(r), col: Number(c) }
    }
  }

  const oldAcrossSet = new Set(oldData.acrossNums)
  const oldDownSet   = new Set(oldData.downNums)
  const newAcrossSet = new Set(newData.acrossNums)
  const newDownSet   = new Set(newData.downNums)

  const newClues = {}

  for (const [oldKey, text] of Object.entries(oldClues)) {
    if (!text) continue
    const dashIdx = oldKey.lastIndexOf('-')
    const num = Number(oldKey.slice(0, dashIdx))
    const dir = oldKey.slice(dashIdx + 1)

    if (dir === 'across' ? !oldAcrossSet.has(num) : !oldDownSet.has(num)) continue

    const pos = numToPos[num]
    if (!pos) continue

    const newNum = newData.numbers[pos.row]?.[pos.col]
    if (newNum == null) continue

    if (dir === 'across' ? !newAcrossSet.has(newNum) : !newDownSet.has(newNum)) continue

    const newKey = `${newNum}-${dir}`
    if (!(newKey in newClues)) newClues[newKey] = text
  }

  return newClues
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
