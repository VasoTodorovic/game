import { useRef, useCallback, useEffect } from 'react'
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
import { screenPositionStore } from '../../helpers/screen-position'

interface IHeroProps {
  texture: Texture
  onMove: (gridX: number, gridY: number) => void
}

export const Hero = ({ texture, onMove }: IHeroProps) => {
  const position = useRef({ x: DEFAULT_X_POS, y: DEFAULT_Y_POS })
  const targetPosition = useRef<{ x: number; y: number } | null>(null)
  const currentDirection = useRef<Direction | null>(null)
  const { getControlsDirection } = useHeroControls()
  const isMoving = useRef(false)

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
    const direction = getControlsDirection()
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

    screenPositionStore.hero.x = position.current.x
    screenPositionStore.hero.y = position.current.y

    updateSprite(currentDirection.current!, isMoving.current)
  })

  return (
    <Container>
      {sprite && (
        <Sprite
          texture={sprite.texture}
          x={position.current.x}
          y={position.current.y}
          scale={0.5}
          anchor={[0, 0.4]}
        />
      )}
    </Container>
  )
}
