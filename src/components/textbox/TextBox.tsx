import { Text, Graphics, Container } from '@pixi/react'
import { useCallback, useEffect } from 'react'
import * as PIXI from 'pixi.js'

interface TextBoxProps {
  x?: number
  y?: number
  width?: number
  height?: number
  content: string
  visible: boolean
  onClose?: () => void
}

export default function TextBox({
  x = 100,
  y = 100,
  width = 300,
  height = 100,
  content,
  visible,
  onClose,
}: TextBoxProps) {
  const drawBox = useCallback(
    (g: PIXI.Graphics) => {
      g.clear()
      g.beginFill(0x000000, 0.7)
      g.lineStyle(2, 0xffffff, 1)
      g.drawRoundedRect(0, 0, width, height, 10)
      g.endFill()
    },
    [width, height]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && visible) {
        onClose?.()
      }
    },
    [visible, onClose]
  )

  // add space-to-close listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!visible) return null

  return (
    <Container x={x} y={y} zIndex={999}>
      <Graphics draw={drawBox} />
      <Text
        text={content}
        x={40}
        y={20}
        style={
          new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 16,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: width - 40,
          })
        }
      />
    </Container>
  )
}
