import { DEFAULT_X_POS, DEFAULT_Y_POS } from '../constants/game-world'

// Mutated every tick by Hero and Camera; read by the MobileControls
// overlay via requestAnimationFrame, so no React re-renders at 60fps.
export const screenPositionStore = {
  hero: { x: DEFAULT_X_POS, y: DEFAULT_Y_POS },
  camera: { x: 0, y: 0 },
}