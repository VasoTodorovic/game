import { useEffect, useRef, useState } from 'react'
import { TILE_SIZE, getZoom } from '../../constants/game-world'
import { screenPositionStore } from '../../helpers/screen-position'
import './MobileControls.css'

const ARROWS = [
  { code: 'ArrowUp', label: '▲', area: 'up' },
  { code: 'ArrowLeft', label: '◀', area: 'left' },
  { code: 'ArrowDown', label: '▼', area: 'down' },
  { code: 'ArrowRight', label: '▶', area: 'right' },
]

const dispatchKey = (type: 'keydown' | 'keyup', code: string) => {
  window.dispatchEvent(new KeyboardEvent(type, { code }))
}

const heroScreenPosition = () => {
  const { hero, camera } = screenPositionStore
  const zoom = getZoom()
  return {
    x: camera.x + (hero.x + TILE_SIZE / 2) * zoom,
    y: camera.y + (hero.y + TILE_SIZE / 2) * zoom,
  }
}

const directionFor = (touchX: number, touchY: number) => {
  const { x, y } = heroScreenPosition()
  const dx = touchX - x
  const dy = touchY - y
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'ArrowRight' : 'ArrowLeft'
  }
  return dy > 0 ? 'ArrowDown' : 'ArrowUp'
}

export const MobileControls = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const padRef = useRef<HTMLDivElement>(null)
  const heldCode = useRef<string | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    setIsTouchDevice(media.matches)

    const onChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isTouchDevice) return

    let raf: number
    const followHero = () => {
      const { x, y } = heroScreenPosition()
      if (padRef.current) {
        padRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(followHero)
    }
    raf = requestAnimationFrame(followHero)
    return () => cancelAnimationFrame(raf)
  }, [isTouchDevice])

  if (!isTouchDevice) return null

  const press = (code: string) => {
    heldCode.current = code
    setActiveCode(code)
    dispatchKey('keydown', code)
  }

  const release = () => {
    if (heldCode.current) dispatchKey('keyup', heldCode.current)
    heldCode.current = null
    setActiveCode(null)
  }

  return (
    <>
      <div
        className="mobile-controls__touch"
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          press(directionFor(e.clientX, e.clientY))
        }}
        onPointerMove={(e) => {
          if (!heldCode.current) return
          const code = directionFor(e.clientX, e.clientY)
          if (code !== heldCode.current) {
            dispatchKey('keyup', heldCode.current)
            press(code)
          }
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="mobile-controls" ref={padRef}>
        {ARROWS.map(({ code, label, area }) => (
          <span
            key={code}
            className={`mobile-controls__button${
              activeCode === code ? ' mobile-controls__button--active' : ''
            }`}
            style={{ gridArea: area }}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  )
}
