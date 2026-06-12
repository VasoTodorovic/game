import { useRef, PropsWithChildren } from 'react'
import { Container, useTick } from '@pixi/react'
import { Graphics as PIXIGraphics } from 'pixi.js'
import { TILE_SIZE, getZoom } from '../../constants/game-world'

interface ICameraProps {
  heroPosition: { x: number; y: number }
  canvasSize: { width: number; height: number }
}

const lerp = (start: number, end: number) => {
  return start + (end - start) * 0.03
}

export const Camera = ({
  heroPosition,
  canvasSize,
  children,
}: PropsWithChildren<ICameraProps>) => {
  const containerRef = useRef<PIXIGraphics>(null)
  const zoom = getZoom()

  const cameraPosition = useRef<{ x: number; y: number }>({
    x: canvasSize.width / 2,
    y: canvasSize.height / 2,
  })

  useTick(() => {
    if (containerRef.current) {
      const targetX =
        canvasSize.width / 2 - heroPosition.x * TILE_SIZE * zoom - TILE_SIZE
      const targetY =
        canvasSize.height / 2 - heroPosition.y * TILE_SIZE * zoom - TILE_SIZE

      cameraPosition.current.x = lerp(cameraPosition.current.x, targetX)
      cameraPosition.current.y = lerp(cameraPosition.current.y, targetY)

      containerRef.current.x = cameraPosition.current.x
      containerRef.current.y = cameraPosition.current.y
    }
  })

  return (
    <Container ref={containerRef} scale={zoom}>
      {children}
    </Container>
  )
}
