import { useRef, useCallback, useState } from 'react'
import { Sprite, Container, useTick } from '@pixi/react'
import { Texture } from 'pixi.js'
import { Direction } from '../../types/game-world'
import { useCakeAnimation } from './useCakeAnimation'
import {
  calculateNewTarget,
  checkCanMove,
  handleMovement,
} from '../../helpers/common'
import { MOVE_SPEED, TILE_SIZE } from '../../constants/game-world'

interface ICakeProps {
  texture: Texture
  onMove: (gridX: number, gridY: number) => void
  x_start: number
  y_start: number
  heroPosition: { x: number; y: number }
  fleeing?: boolean
  speedMultiplier?: number
}

const ANIMATION_SPEED = 0.2
const CAKE_SPEED = MOVE_SPEED * 0.8
const WANDER_CHANCE = 0.25

// Cakes only notice the hero within this many tiles; beyond it they just wander
const CHASE_RADIUS = 5

// Sugar rush: random short sprint, tinted pink as a warning
const RUSH_MULTIPLIER = 2
const RUSH_DURATION_MS = 1500
const RUSH_TINT = 0xff5577
const nextRushDelay = () => 5000 + Math.random() * 5000

const ALL_DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT']

const OPPOSITE: Record<Exclude<Direction, undefined>, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

const shuffle = (dirs: Direction[]) => {
  const result = [...dirs]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const Cake = ({
  texture,
  onMove,
  x_start,
  y_start,
  heroPosition,
  fleeing = false,
  speedMultiplier = 1,
}: ICakeProps) => {
  const position = useRef({ x: x_start, y: y_start })
  const targetPosition = useRef<{ x: number; y: number } | null>(null)
  const currentDirection = useRef<Direction | null>(null)
  const isMoving = useRef(false)
  const heroRef = useRef(heroPosition)
  heroRef.current = heroPosition
  const fleeingRef = useRef(fleeing)
  fleeingRef.current = fleeing
  const speedRef = useRef(speedMultiplier)
  speedRef.current = speedMultiplier
  const [isRushing, setIsRushing] = useState(false)
  const rushingRef = useRef(false)
  const rushEndsAt = useRef(0)
  const nextRushAt = useRef(Date.now() + nextRushDelay())

  const { sprite, updateSprite } = useCakeAnimation({
    texture,
    frameWidth: 91,
    frameHeight: 127,
    totalFrames: 5,
    animationSpeed: ANIMATION_SPEED,
  })

  const chooseDirection = useCallback((): Direction | null => {
    const tileX = Math.round(position.current.x / TILE_SIZE)
    const tileY = Math.round(position.current.y / TILE_SIZE)
    const dx = heroRef.current.x - tileX
    const dy = heroRef.current.y - tileY

    // When fleeing (chase mode), run away from the hero instead of toward him
    const horizontal: Direction = (dx > 0) !== fleeingRef.current ? 'RIGHT' : 'LEFT'
    const vertical: Direction = (dy > 0) !== fleeingRef.current ? 'DOWN' : 'UP'

    const heroIsFar = Math.hypot(dx, dy) > CHASE_RADIUS

    let candidates: Direction[]
    if (heroIsFar || Math.random() < WANDER_CHANCE) {
      candidates = shuffle(ALL_DIRECTIONS)
    } else {
      const primary = Math.abs(dx) >= Math.abs(dy) ? horizontal : vertical
      const secondary = primary === horizontal ? vertical : horizontal
      candidates = [
        primary,
        secondary,
        ...shuffle(ALL_DIRECTIONS.filter((d) => d !== primary && d !== secondary)),
      ]
    }

    // Capped turn: never reverse 180° — dodging past the cake makes it overshoot
    const reverse = currentDirection.current
      ? OPPOSITE[currentDirection.current]
      : null
    const ordered = [
      ...candidates.filter((d) => d !== reverse),
      ...(reverse ? [reverse] : []),
    ]

    for (const dir of ordered) {
      if (checkCanMove(calculateNewTarget(position.current.x, position.current.y, dir))) {
        return dir
      }
    }
    return null
  }, [])

  useTick((delta) => {
    const now = Date.now()
    if (!rushingRef.current && now >= nextRushAt.current) {
      rushingRef.current = true
      rushEndsAt.current = now + RUSH_DURATION_MS
      setIsRushing(true)
    } else if (rushingRef.current && now >= rushEndsAt.current) {
      rushingRef.current = false
      nextRushAt.current = now + nextRushDelay()
      setIsRushing(false)
    }

    if (!targetPosition.current) {
      const direction = chooseDirection()
      if (direction) {
        currentDirection.current = direction
        targetPosition.current = calculateNewTarget(
          position.current.x,
          position.current.y,
          direction
        )
      }
    }

    if (targetPosition.current) {
      const { position: newPosition, completed } = handleMovement(
        position.current,
        targetPosition.current,
        CAKE_SPEED * speedRef.current * (rushingRef.current ? RUSH_MULTIPLIER : 1),
        delta
      )

      position.current = newPosition
      isMoving.current = true

      if (completed) {
        const { x, y } = position.current
        onMove(x, y)
        targetPosition.current = null
        isMoving.current = false
      }
    }

    updateSprite(currentDirection.current, isMoving.current)
  })

  return (
    <Container>
      {sprite && (
        <Sprite
          texture={sprite.texture}
          x={position.current.x}
          y={position.current.y}
          tint={isRushing ? RUSH_TINT : 0xffffff}
          scale={isRushing ? 0.35 : 0.3}
          anchor={[-0.1, 0.2]}
        />
      )}
    </Container>
  )
}