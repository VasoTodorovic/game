import { useRef, useCallback, useEffect } from 'react'
import { Sprite, Container, useTick } from '@pixi/react'
import {
  ANIMATION_SPEED,
  DEFAULT_X_POS_CAT,
  DEFAULT_Y_POS_CAT,
  MOVE_SPEED,
} from '../../constants/game-world'
import { useCatControls} from '../Hero/useHeroControls'
import { Texture } from 'pixi.js'
import {
  calculateNewTarget,
  checkCanMove,
  handleMovement,
} from '../../helpers/common'
import { useCatAnimation2 } from './useCatAnimation2'
import { Direction } from '../../types/game-world'

interface IHeroProps {
  texture: Texture
  onMove: (gridX: number, gridY: number) => void
}

export const Cat2 = ({ texture, onMove }: IHeroProps) => {
  const position = useRef({ x: DEFAULT_X_POS_CAT, y: DEFAULT_Y_POS_CAT })
  const targetPosition = useRef<{ x: number; y: number } | null>(null)
  const currentDirection = useRef<Direction | null>(null)
  const { getCatDirection} = useCatControls()
  const isMoving = useRef(false)

  const { sprite, updateSprite } = useCatAnimation2({
    texture,
    frameWidth: 64,
    frameHeight: 64,
    totalFrames: 8,
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
          tint={0xff7700}
          scale={0.5}
          anchor={[-0.3, 0.1]}
        />
      )}
    </Container>
  )
}
