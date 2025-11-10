import { useRef } from 'react'
import { Sprite, Container, useTick } from '@pixi/react'
import { Texture } from 'pixi.js'
import { Direction } from '../../types/game-world'
import { useCatControls} from '../Hero/useHeroControls'
import { useCakeAnimation } from './useCakeAnimation'
import { useCallback } from 'react'
import {
  calculateNewTarget,
  checkCanMove,
  handleMovement,
} from '../../helpers/common'
import {
  DEFAULT_X_POS_CAT,
  DEFAULT_Y_POS_CAT,
  MOVE_SPEED,
  TILE_SIZE,
} from '../../constants/game-world'

interface ICakeProps {
  texture: Texture
  onMove: (gridX: number, gridY: number) => void
 x_start: number;
 y_start: number;
}

const ANIMATION_SPEED = 0.2

export const Cake = ({ texture, onMove,x_start,y_start }: ICakeProps) => {
  const rotation = useRef(0)
 const position = useRef({ x:x_start, y: y_start })
  const targetPosition = useRef<{ x: number; y: number } | null>(null)
  const currentDirection = useRef<Direction | null>(null)
  const { getCatDirection} = useCatControls()
  const isMoving = useRef(false)
  const { sprite, updateSprite } = useCakeAnimation({
    texture,
    frameWidth: 91,
    frameHeight: 127,
    totalFrames: 5, // ✅ Changed to 8 for 8 columns
    animationSpeed: ANIMATION_SPEED,
  })

  useTick((delta) => {
    const direction = getCatDirection()
    if (direction) {
      setNextTarget(direction)
    }
    if (targetPosition.current) {
      const { position: newPosition, completed } = handleMovement(
        position.current,
        targetPosition.current,
        MOVE_SPEED,
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

    updateSprite(currentDirection.current!, isMoving.current)
  })
  

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
    const direction = getCatDirection()
    if (direction) {
      setNextTarget(direction)
    }
    if (targetPosition.current) {
      const { position: newPosition, completed } = handleMovement(
        position.current,
        targetPosition.current,
        MOVE_SPEED,
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

    updateSprite(currentDirection.current!, isMoving.current)
  })

  return (
    <Container>
      {sprite && (
        <Sprite
          texture={sprite.texture}
          x={position.current.x}
          y={position.current.y}
          scale={0.3}
          anchor={[-0.1, 0.2]}
        />
      )}
    </Container>
  )
}