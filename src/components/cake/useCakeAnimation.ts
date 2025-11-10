import { useRef, useState } from 'react'
import { Sprite, Texture, Rectangle } from 'pixi.js'

interface UseCakeAnimationProps {
  texture: Texture
  frameWidth: number
  frameHeight: number
  totalFrames: number
  animationSpeed: number
  row?: number // ✅ Added row parameter (0-indexed)
}

export const useCakeAnimation = ({
  texture,
  frameWidth,
  frameHeight,
  totalFrames,
  animationSpeed,
  row = 0, // ✅ Default to first row (0)
}: UseCakeAnimationProps) => {
  const [currentTexture, setCurrentTexture] = useState(
    new Texture(
      texture.baseTexture,
      new Rectangle(0, row * frameHeight, frameWidth, frameHeight) // ✅ Use row for y-coordinate
    )
  )

  const spriteRef = useRef<Sprite>(new Sprite(currentTexture))
  const frameRef = useRef(0)
  const elapsedTimeRef = useRef(0)

  const updateSprite = (delta: number) => {
    elapsedTimeRef.current += delta

    const frameDuration = 1 / animationSpeed

    if (elapsedTimeRef.current >= frameDuration) {
      elapsedTimeRef.current = 0
      frameRef.current = (frameRef.current + 1) % totalFrames

      const newFrame = new Rectangle(
        frameRef.current * frameWidth,
        row * frameHeight, // ✅ Use row for y-coordinate
        frameWidth,
        frameHeight
      )

      const newTexture = new Texture(texture.baseTexture, newFrame)
      spriteRef.current.texture = newTexture
      setCurrentTexture(newTexture)
    }
  }

  return {
    sprite: spriteRef.current,
    updateSprite,
  }
}