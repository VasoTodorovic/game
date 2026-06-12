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

const DOUBLE_TAP_MS = 300

export const useHeroControls = () => {
  const [heldDirections, setHeldDirections] = useState<Direction[]>([])
  const sprintRequested = useRef(false)
  const lastTap = useRef<{ direction: Direction; time: number }>({
    direction: undefined,
    time: 0,
  })

  const handleKey = useCallback((e: KeyboardEvent, isKeyDown: boolean) => {
    const direction = DIRECTION_KEYS[e.code]
    if (!direction) return

    // Double-tap same direction → sprint (ignore held-key auto-repeat)
    if (isKeyDown && !e.repeat) {
      const now = Date.now()
      if (
        lastTap.current.direction === direction &&
        now - lastTap.current.time < DOUBLE_TAP_MS
      ) {
        sprintRequested.current = true
      }
      lastTap.current = { direction, time: now }
    }

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

  const consumeSprintRequest = useCallback(() => {
    const requested = sprintRequested.current
    sprintRequested.current = false
    return requested
  }, [])

  return { getControlsDirection, consumeSprintRequest }
}
