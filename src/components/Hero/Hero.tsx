import { useRef, useCallback, useEffect, useState } from 'react'
import { Sprite, Container, useTick } from '@pixi/react'
import {
  ANIMATION_SPEED,
  DEFAULT_X_POS,
  DEFAULT_Y_POS,
  MOVE_SPEED,
} from '../../constants/game-world'
import { useHeroControls } from './useHeroControls'
import { Texture } from 'pixi.js'
import {
  calculateNewTarget,
  checkCanMove,
  handleMovement,
} from '../../helpers/common'
import { useHeroAnimation } from './useHeroAnimation'
import { Direction } from '../../types/game-world'

interface IHeroProps {
  texture: Texture
  onMove: (gridX: number, gridY: number) => void
  speedMultiplier?: number
  onSprintChange?: (tilesLeft: number, rechargeSecondsLeft: number) => void
}

// Sprint: double-tap a direction → 2x speed for the next 4 tiles, then recharge
const SPRINT_MULTIPLIER = 2
export const SPRINT_TILES = 4
export const SPRINT_RECHARGE_SECONDS = 5
const SPRINT_RECHARGE_MS = SPRINT_RECHARGE_SECONDS * 1000
const SPRINT_TINT = 0x99ddff

export const Hero = ({
  texture,
  onMove,
  speedMultiplier = 1,
  onSprintChange,
}: IHeroProps) => {
  const position = useRef({ x: DEFAULT_X_POS, y: DEFAULT_Y_POS })
  const targetPosition = useRef<{ x: number; y: number } | null>(null)
  const currentDirection = useRef<Direction | null>(null)
  const { getControlsDirection, consumeSprintRequest } = useHeroControls()
  const isMoving = useRef(false)
  const sprintTilesLeft = useRef(0)
  const sprintReadyAt = useRef(0)
  const [isSprinting, setIsSprinting] = useState(false)

  const { sprite, updateSprite } = useHeroAnimation({
    texture,
    frameWidth: 64,
    frameHeight: 64,
    //on koristi 9 slika a 8 red ima za sva cetiri pravca
    totalFrames: 9,
    animationSpeed: ANIMATION_SPEED,
  })

  useEffect(() => {
    onMove(position.current.x, position.current.y)
  }, [onMove])

  const setNextTarget = useCallback((direction: Direction) => {
    if (targetPosition.current) return
    const { x, y } = position.current
    currentDirection.current = direction
    const newTarget = calculateNewTarget(x, y, direction)

    if (checkCanMove(newTarget)) {
      targetPosition.current = newTarget
    }
  }, [])

  useTick((delta) => {
    if (
      consumeSprintRequest() &&
      sprintTilesLeft.current === 0 &&
      Date.now() >= sprintReadyAt.current
    ) {
      sprintTilesLeft.current = SPRINT_TILES
      setIsSprinting(true)
      onSprintChange?.(SPRINT_TILES, 0)
    }

    const direction = getControlsDirection()
    if (direction) {
      setNextTarget(direction)
    }
    if (targetPosition.current) {
      const { position: newPosition, completed } = handleMovement(
        position.current,
        targetPosition.current,
        MOVE_SPEED *
          speedMultiplier *
          (sprintTilesLeft.current > 0 ? SPRINT_MULTIPLIER : 1),
        delta
      )

      position.current = newPosition
      isMoving.current = true

      if (completed) {
        const { x, y } = position.current
        onMove(x, y)

        if (sprintTilesLeft.current > 0) {
          sprintTilesLeft.current -= 1
          if (sprintTilesLeft.current === 0) {
            sprintReadyAt.current = Date.now() + SPRINT_RECHARGE_MS
            setIsSprinting(false)
            onSprintChange?.(0, SPRINT_RECHARGE_SECONDS)
          } else {
            onSprintChange?.(sprintTilesLeft.current, 0)
          }
        }

        targetPosition.current = null
        isMoving.current = false
      }
    }

    updateSprite(currentDirection.current!, isMoving.current)
  })

  return (
    <Container>
      {sprite && (
        <Sprite
          texture={sprite.texture}
          x={position.current.x}
          y={position.current.y}
          tint={isSprinting ? SPRINT_TINT : 0xffffff}
          scale={0.5}
          anchor={[0, 0.4]}
        />
      )}
    </Container>
  )
}
