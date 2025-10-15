import { useRef, useState } from 'react'
import { Texture, Rectangle, Sprite } from 'pixi.js'

interface UseCatAnimationProps {
  texture: Texture
  frameWidth: number
  frameHeight: number
  totalFrames: number
  animationSpeed: number
}

export const useCatAnimation = ({
  texture,
  frameWidth,
  frameHeight,
  totalFrames,
  animationSpeed,
}: UseCatAnimationProps) => {
  const [currentTexture, setCurrentTexture] = useState(
    new Texture(texture.baseTexture, new Rectangle(0, 0, frameWidth, frameHeight))
  )

  const spriteRef = useRef<Sprite>(new Sprite(currentTexture))
  const frameRef = useRef(0)
  const elapsedTimeRef = useRef(0)

  const update = (delta: number) => {
    elapsedTimeRef.current += delta
    const frameDuration = 1 / animationSpeed

    if (elapsedTimeRef.current >= frameDuration) {
      elapsedTimeRef.current = 0
      frameRef.current = (frameRef.current + 1) % totalFrames

      const newFrame = new Rectangle(
        frameRef.current * frameWidth,
        0,
        frameWidth,
        frameHeight
      )

      const newTexture = new Texture(texture.baseTexture, newFrame)
      spriteRef.current.texture = newTexture
      setCurrentTexture(newTexture)
    }
  }

  return {
    currentTexture,
    update,
  }
}
