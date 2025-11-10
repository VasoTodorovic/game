import { useRef } from 'react'
import { Sprite, Container, useTick } from '@pixi/react'
import { Texture } from 'pixi.js'

import { TILE_SIZE } from '../../constants/game-world'
import { useCakeAnimation } from './useCakeAnimation'

interface ICakeProps {
  texture: Texture
  x: number
  y: number
  animationRow?: number // ✅ Optional row parameter
}

const ANIMATION_SPEED = 0.15

export const Cake = ({ texture, x, y, animationRow = 0 }: ICakeProps) => {
  const rotation = useRef(0)

  const { sprite, updateSprite } = useCakeAnimation({
    texture,
    frameWidth: 91,
    frameHeight: 127,
    totalFrames: 8, // ✅ Changed to 8 for 8 columns
    animationSpeed: ANIMATION_SPEED,
    row: animationRow, // ✅ Pass the row to the hook
  })

  useTick((delta) => {
    updateSprite(delta)
  })

  return (
    <Container  x={x * TILE_SIZE} y={y * TILE_SIZE}>
      {sprite && (
        <Sprite texture={sprite.texture} scale={0.3}   anchor={[-0.1, 0.2]}/>
      )}
    </Container>
  )
}