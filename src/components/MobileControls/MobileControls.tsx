import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    setIsTouchDevice(media.matches)

    const onChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  if (!isTouchDevice) return null

  return (
    <div className="mobile-controls">
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
