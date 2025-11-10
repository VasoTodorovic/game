import { COLLISION_MAP } from './collision-map'

export const TILE_SIZE = 32
export const COLS = 26
export const ROWS = 17

export const GAME_WIDTH = TILE_SIZE * COLS - TILE_SIZE * 2
export const GAME_HEIGHT = TILE_SIZE * ROWS - TILE_SIZE * 2

export const OFFSET_X = TILE_SIZE
export const OFFSET_Y = TILE_SIZE / 2

export const MOVE_SPEED = 0.03
export const ANIMATION_SPEED = 0.2
export const DEFAULT_X_POS = TILE_SIZE * 10
export const DEFAULT_Y_POS = TILE_SIZE * 14

export const DEFAULT_X_POS_CAT = TILE_SIZE * 4
export const DEFAULT_Y_POS_CAT = TILE_SIZE * 15
export const ZOOM = 3

// ------------------------
// Types
// ------------------------
export interface IPosition {
  x: number
  y: number
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | undefined

// ------------------------
// Helpers
// ------------------------
export const calculateNewTarget = (x: number, y: number, direction: Direction): IPosition => ({
  x: (x / TILE_SIZE) * TILE_SIZE + (direction === 'LEFT' ? -TILE_SIZE : direction === 'RIGHT' ? TILE_SIZE : 0),
  y: (y / TILE_SIZE) * TILE_SIZE + (direction === 'UP' ? -TILE_SIZE : direction === 'DOWN' ? TILE_SIZE : 0),
})

export const checkCanMove = (target: IPosition) => {
  const row = Math.floor(target.y / TILE_SIZE)
  const col = Math.floor(target.x / TILE_SIZE)
  const index = COLS * row + col

  if (index < 0 || index >= COLLISION_MAP.length) return false

  return COLLISION_MAP[index] !== 1
}

export const moveTowards = (current: number, target: number, maxStep: number) =>
  current + Math.sign(target - current) * Math.min(Math.abs(target - current), maxStep)

export const continueMovement = (currentPosition: IPosition, targetPosition: IPosition, step: number): IPosition => ({
  x: moveTowards(currentPosition.x, targetPosition.x, step),
  y: moveTowards(currentPosition.y, targetPosition.y, step),
})

export const handleMovement = (
  currentPosition: IPosition,
  targetPosition: IPosition,
  moveSpeed: number,
  delta: number
): { position: IPosition; completed: boolean } => {
  const step = moveSpeed * TILE_SIZE * delta
  const distance = Math.hypot(targetPosition.x - currentPosition.x, targetPosition.y - currentPosition.y)

  if (distance <= step) {
    return { position: targetPosition, completed: true }
  }

  return { position: continueMovement(currentPosition, targetPosition, step), completed: false }
}
