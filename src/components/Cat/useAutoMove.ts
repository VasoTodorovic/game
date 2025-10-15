import { useState, useEffect, useRef } from 'react'
import { IPosition, Direction, TILE_SIZE, checkCanMove, calculateNewTarget, handleMovement } from '../../constants/game-world'

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']

interface IUseAutoMoveProps {
  startX: number // in tiles
  startY: number // in tiles
  tilesToMove: number
  moveSpeed: number
}

export const useAutoMove = ({ startX, startY, tilesToMove = 3, moveSpeed }: IUseAutoMoveProps) => {
  const [position, setPosition] = useState<IPosition>({ x: startX, y: startY }) // tile coordinates
  const [target, setTarget] = useState<IPosition | null>(null) // pixel coordinates
  const movedTilesRef = useRef(0)
  const directionRef = useRef<Direction>('UP')

  // Pick a new walkable direction
  const chooseNewDirection = (current: IPosition): Direction => {
    const shuffled = [...DIRECTIONS].sort(() => Math.random() - 0.5)
    for (const dir of shuffled) {
      const nextTarget = calculateNewTarget(current.x * TILE_SIZE, current.y * TILE_SIZE, dir)
      if (checkCanMove(nextTarget)) return dir
    }
    return undefined
  }

  useEffect(() => {
    if (movedTilesRef.current >= tilesToMove) return

    let animationFrame: number

    const step = () => {
      if (!target) {
        // pick new direction
        const dir = chooseNewDirection(position)
        if (!dir) return // stuck
        directionRef.current = dir
        setTarget(calculateNewTarget(position.x * TILE_SIZE, position.y * TILE_SIZE, dir))
      } else {
        const result = handleMovement(positionToPixels(position), target, moveSpeed, 1)
        const newPos = pixelsToTile(result.position)
        setPosition(newPos)
        if (result.completed) {
          movedTilesRef.current += 1
          setTarget(null)
        }
      }
      animationFrame = requestAnimationFrame(step)
    }

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [position, target, moveSpeed])

  const positionToPixels = (pos: IPosition) => ({ x: pos.x * TILE_SIZE, y: pos.y * TILE_SIZE })
  const pixelsToTile = (pos: IPosition) => ({ x: Math.round(pos.x / TILE_SIZE), y: Math.round(pos.y / TILE_SIZE) })

  return position
}
