import { useEffect, useRef, useState } from 'react'
import { TILE_SIZE, ZOOM } from '../../constants/game-world'
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

export const MobileControls = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const padRef = useRef<HTMLDivElement>(null)

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
      const { hero, camera } = screenPositionStore
      const x = camera.x + (hero.x + TILE_SIZE / 2) * ZOOM
      const y = camera.y + (hero.y + TILE_SIZE / 2) * ZOOM
      if (padRef.current) {
        padRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(followHero)
    }
    raf = requestAnimationFrame(followHero)
    return () => cancelAnimationFrame(raf)
  }, [isTouchDevice])

  if (!isTouchDevice) return null

  return (
    <div className="mobile-controls" ref={padRef}>
      {ARROWS.map(({ code, label, area }) => (
        <button
          key={code}
          className="mobile-controls__button"
          style={{ gridArea: area }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            dispatchKey('keydown', code)
          }}
          onPointerUp={() => dispatchKey('keyup', code)}
          onPointerCancel={() => dispatchKey('keyup', code)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {label}
        </button>
      ))}
    </div>
  )
}