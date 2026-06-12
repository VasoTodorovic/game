import { useRef, useState } from 'react'
import { Sprite as PixiSprite, Texture, Rectangle } from 'pixi.js'
import { Sprite, Container, useTick } from '@pixi/react'
import { TILE_SIZE } from '../../constants/game-world'

interface VinylProps {
  texture: Texture
  tileX: number
  tileY: number
}

const FRAME_WIDTH  = 512
const FRAME_HEIGHT = 512
const TOTAL_FRAMES = 4
const ANIMATION_SPEED = 0.07 // slow spin

export const Vinyl = ({ texture, tileX, tileY }: VinylProps) => {
  const [currentTexture, setCurrentTexture] = useState(
    new Texture(texture.baseTexture, new Rectangle(0, 0, FRAME_WIDTH, FRAME_HEIGHT))
  )
  const spriteRef   = useRef<PixiSprite>(new PixiSprite(currentTexture))
  const frameRef    = useRef(0)
  const elapsedRef  = useRef(0)

  useTick((delta) => {
    elapsedRef.current += delta
    if (elapsedRef.current >= 1 / ANIMATION_SPEED) {
      elapsedRef.current = 0
      frameRef.current = (frameRef.current + 1) % TOTAL_FRAMES
      const next = new Texture(
        texture.baseTexture,
        new Rectangle(frameRef.current * FRAME_WIDTH, 0, FRAME_WIDTH, FRAME_HEIGHT)
      )
      spriteRef.current.texture = next
      setCurrentTexture(next)
    }
  })

  const scale = (TILE_SIZE * 2) / FRAME_WIDTH // display as 2×2 tiles

  return (
    <Container x={tileX * TILE_SIZE} y={tileY * TILE_SIZE}>
      <Sprite
          width={40}
          height={40}
        texture={currentTexture}
        scale={scale}
        anchor={0}
      />
    </Container>
  )
}
