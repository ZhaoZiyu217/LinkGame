/**
 * 连连看核心算法
 */
export class LinkGame {
  constructor(grid, rows, cols) {
    this.grid = grid.map(row => [...row])
    this.rows = rows
    this.cols = cols
  }

  canConnect(x1, y1, x2, y2) {
    if (x1 === x2 && y1 === y2) return false
    if (this.grid[x1][y1] !== this.grid[x2][y2]) return false
    if (this.grid[x1][y1] === 0) return false

    if (this.isLineEmpty(x1, y1, x2, y2)) return true
    if (this.isOneCorner(x1, y1, x2, y2)) return true
    if (this.isTwoCorner(x1, y1, x2, y2)) return true

    return false
  }

  getPath(x1, y1, x2, y2) {
    if (x1 === x2 || y1 === y2) {
      return [{ x: x1, y: y1 }, { x: x2, y: y2 }]
    }

    if (this.grid[x1][y2] === 0) {
      if (this.isLineEmpty(x1, y1, x1, y2) && this.isLineEmpty(x1, y2, x2, y2)) {
        return [{ x: x1, y: y1 }, { x: x1, y: y2 }, { x: x2, y: y2 }]
      }
    }
    if (this.grid[x2][y1] === 0) {
      if (this.isLineEmpty(x1, y1, x2, y1) && this.isLineEmpty(x2, y1, x2, y2)) {
        return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }]
      }
    }

    for (let y = 0; y < this.cols; y++) {
      if (y === y1 || y === y2) continue
      if (this.grid[x1][y] === 0 && this.grid[x2][y] === 0) {
        if (this.isLineEmpty(x1, y1, x1, y) && 
            this.isLineEmpty(x1, y, x2, y) && 
            this.isLineEmpty(x2, y, x2, y2)) {
          return [{ x: x1, y: y1 }, { x: x1, y: y }, { x: x2, y: y }, { x: x2, y: y2 }]
        }
      }
    }

    for (let x = 0; x < this.rows; x++) {
      if (x === x1 || x === x2) continue
      if (this.grid[x][y1] === 0 && this.grid[x][y2] === 0) {
        if (this.isLineEmpty(x1, y1, x, y1) && 
            this.isLineEmpty(x, y1, x, y2) && 
            this.isLineEmpty(x, y2, x2, y2)) {
          return [{ x: x1, y: y1 }, { x: x, y: y1 }, { x: x, y: y2 }, { x: x2, y: y2 }]
        }
      }
    }

    return null
  }

  isLineEmpty(x1, y1, x2, y2) {
    if (x1 === x2) {
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)
      for (let y = minY + 1; y < maxY; y++) {
        if (this.grid[x1][y] !== 0) return false
      }
      return true
    } else if (y1 === y2) {
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      for (let x = minX + 1; x < maxX; x++) {
        if (this.grid[x][y1] !== 0) return false
      }
      return true
    }
    return false
  }

  isOneCorner(x1, y1, x2, y2) {
    if (this.grid[x1][y2] === 0) {
      if (this.isLineEmpty(x1, y1, x1, y2) && this.isLineEmpty(x1, y2, x2, y2)) {
        return true
      }
    }
    if (this.grid[x2][y1] === 0) {
      if (this.isLineEmpty(x1, y1, x2, y1) && this.isLineEmpty(x2, y1, x2, y2)) {
        return true
      }
    }
    return false
  }

  isTwoCorner(x1, y1, x2, y2) {
    for (let y = 0; y < this.cols; y++) {
      if (y === y1 || y === y2) continue
      if (this.grid[x1][y] === 0 && this.grid[x2][y] === 0) {
        if (this.isLineEmpty(x1, y1, x1, y) && 
            this.isLineEmpty(x1, y, x2, y) && 
            this.isLineEmpty(x2, y, x2, y2)) {
          return true
        }
      }
    }
    for (let x = 0; x < this.rows; x++) {
      if (x === x1 || x === x2) continue
      if (this.grid[x][y1] === 0 && this.grid[x][y2] === 0) {
        if (this.isLineEmpty(x1, y1, x, y1) && 
            this.isLineEmpty(x, y1, x, y2) && 
            this.isLineEmpty(x, y2, x2, y2)) {
          return true
        }
      }
    }
    return false
  }

  hasValidPair() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (this.grid[i][j] === 0) continue
        for (let m = 0; m < this.rows; m++) {
          for (let n = 0; n < this.cols; n++) {
            if (i === m && j === n) continue
            if (this.grid[m][n] === 0) continue
            if (this.grid[i][j] !== this.grid[m][n]) continue
            if (this.canConnect(i, j, m, n)) {
              return true
            }
          }
        }
      }
    }
    return false
  }
}