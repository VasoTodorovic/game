import { useCallback, useEffect, useState, useRef } from 'react'
import { Direction } from '../../types/game-world'

const DIRECTION_KEYS: Record<string, Direction> = {
  KeyW: 'UP',
  KeyS: 'DOWN',
  KeyA: 'LEFT',
  KeyD: 'RIGHT',
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
}

export const useCatControls = () => {
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']
  const [catDirection, setCatDirection] = useState<Direction>('DOWN')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * directions.length)
      setCatDirection(directions[randomIndex])
    }, 2000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const getCatDirection = useCallback(() => catDirection, [catDirection])

  return { getCatDirection }
}

export const useHeroControls = () => {
  const [heldDirections, setHeldDirections] = useState<Direction[]>([])

  const handleKey = useCallback((e: KeyboardEvent, isKeyDown: boolean) => {
    const direction = DIRECTION_KEYS[e.code]
    if (!direction) return

    setHeldDirections((prev) => {
      if (isKeyDown) {
        return prev.includes(direction) ? prev : [direction, ...prev]
      }
      return prev.filter((dir) => dir !== direction)
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKey(e, true)
    const handleKeyUp = (e: KeyboardEvent) => handleKey(e, false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKey])

  const getControlsDirection = useCallback(
    (): Direction | null => heldDirections[0] || null,
    [heldDirections]
  )

  return { getControlsDirection }
}
