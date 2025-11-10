import { useState, useRef } from 'react'
import { TILE_SIZE } from '../../constants/game-world'
import { Rectangle, Sprite, Texture } from 'pixi.js'
import { Direction } from '../../types/game-world'

interface UseSpriteAnimationProps {
  texture: Texture
  frameWidth: number
  frameHeight: number
  totalFrames: number
  animationSpeed: number
}

export const useCatAnimation2 = ({
  texture,
  frameWidth,
  frameHeight,
  totalFrames,
  animationSpeed,
}: UseSpriteAnimationProps) => {
  const [sprite, setSprite] = useState<Sprite | null>(null)
  const frameRef = useRef(0)
  const elapsedTimeRef = useRef(0)

  const getRowByDirection = (direction: Direction | null) => {
    switch (direction) {
      case 'UP':
        return 4
      case 'LEFT':
        return 3
      case 'DOWN':
        return 1
      case 'RIGHT':
        return 2
      default:
        return 1
    }
  }

  const createSprite = (row: number, column: number) => {
    const frame = new Texture(
      texture.baseTexture,
      new Rectangle(
        column * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight
      )
    )

    const newSprite = new Sprite(frame)
    newSprite.width = TILE_SIZE
    newSprite.height = TILE_SIZE

    return newSprite
  }

  const updateSprite = (direction: Direction | null, isMoving: boolean) => {
    const row = getRowByDirection(direction)
    let column = 0

    if (isMoving) {
      elapsedTimeRef.current += animationSpeed

      if (elapsedTimeRef.current >= 1) {
        elapsedTimeRef.current = 0
        frameRef.current = (frameRef.current + 1) % totalFrames
      }

      column = frameRef.current
    }

    const newSprite = createSprite(row, column)
    setSprite(newSprite)
  }

  return { sprite, updateSprite }
}
