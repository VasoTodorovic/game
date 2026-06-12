import { useState, useMemo, PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { Texture, TextStyle } from 'pixi.js'
import { Container, Sprite, Text, Graphics } from '@pixi/react'
import { TILE_SIZE, COLS } from '../../../constants/game-world'
import { COLLISION_MAP } from '../../../constants/collision-map'
import { Hero, SPRINT_TILES, SPRINT_RECHARGE_SECONDS } from '../../Hero/Hero'
import { Level } from '../../Levels/Level'
import { Camera } from '../../Camera/Camera'
import { Coin } from '../../Coin/Coin'
import backgroundAsset from '@/assets/city.jpg'
import heroAsset from '@/assets/hero.png'
import coinRedAsset from '@/assets/coin-red.png'
import cakeAsset from "@/assets/cake.png"
import catAsset from "@/assets/cat.png"
// import hindusiSound from '@/assets/Hero sound Hindusi random.mpeg'
import belaCigankaSound from '@/assets/Hero sound Bela Ciganka radnom.mpeg'
import oliverSound from '@/assets/Hero Sound Vinyl.mpeg'
import cakeEffectSound from '@/assets/Game effect cake colision.mpeg'
import completedEffectSound from '@/assets/Game effect completed.mpeg'
import background1 from '@/assets/background 1.mp3'
import background2 from '@/assets/background 2.mp3'
import background3 from '@/assets/background 3.mp3'
import { Cake } from '../../cake/Cake'
import { Cat2 } from '../../Cat/Cat2'
import { Vinyl } from '../../Vinyl/Vinyl'
import vinylAsset from '@/assets/Vinyl.png'

interface IMainContainerProps {
  canvasSize: { width: number; height: number }
}

const VINYL_TILE = { x: 22, y: 11 }
const VINYL2_TILE = { x: 2, y: 15 }
const VINYL_SONGS = [background1, background2, background3]

const ALL_COIN_POSITIONS = COLLISION_MAP
  .reduce<{ x: number; y: number }[]>((acc, cell, index) => {
    const x = index % COLS
    const y = Math.floor(index / COLS)
    if (
      cell === 0 &&
      !(x === VINYL_TILE.x && y === VINYL_TILE.y) &&
      !(x === VINYL2_TILE.x && y === VINYL2_TILE.y)
    ) acc.push({ x, y })
    return acc
  }, [])
  .filter((_, i) => i % 3 === 0)

const CHASE_THRESHOLD = Math.floor(ALL_COIN_POSITIONS.length / 7)
const MAX_LIVES = 3
const ORANGE_CAT_INDEX = 0
const ORANGE_BOOST_SECONDS = 10
const CAT_BOOST_SECONDS = 5

type Difficulty = 'EASY' | 'NORMAL' | 'HARD'
const DIFFICULTIES: Record<
  Difficulty,
  { label: string; heroSpeed: number; cakeSpeed: number; color: number }
> = {
  EASY:   { label: '🐢 Easy',   heroSpeed: 1.2, cakeSpeed: 0.7, color: 0x66ff99 },
  NORMAL: { label: '🙂 Normal', heroSpeed: 1,   cakeSpeed: 1,   color: 0xffe066 },
  HARD:   { label: '🔥 Hard',   heroSpeed: 1,   cakeSpeed: 1.4, color: 0xff6666 },
}
const DIFFICULTY_ORDER: Difficulty[] = ['EASY', 'NORMAL', 'HARD']

const CAT_STARTS = [
  { x: TILE_SIZE * 4,  y: TILE_SIZE * 15 },
  { x: TILE_SIZE * 22, y: TILE_SIZE * 4  },
  { x: TILE_SIZE * 12, y: TILE_SIZE * 8  },
  { x: TILE_SIZE * 18, y: TILE_SIZE * 12 },
  { x: TILE_SIZE * 7,  y: TILE_SIZE * 5  },
]

const CAKE_STARTS = [
  { x: TILE_SIZE * 1,  y: TILE_SIZE * 1  },
  { x: TILE_SIZE * 7,  y: TILE_SIZE * 4  },
  { x: TILE_SIZE * 7,  y: TILE_SIZE * 4  },
  { x: TILE_SIZE * 21, y: TILE_SIZE * 3  },
  { x: TILE_SIZE * 24, y: TILE_SIZE * 3  },
  { x: TILE_SIZE * 1,  y: TILE_SIZE * 14 },
  { x: TILE_SIZE * 18, y: TILE_SIZE * 10 },
]

const catAlertStyle    = new TextStyle({ fill: 0xffffff, fontSize: 26, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 4 })
const cakeAlertStyle   = new TextStyle({ fill: 0xffe066, fontSize: 26, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 4 })
const scoreStyle       = new TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const livesStyle       = new TextStyle({ fill: 0xff4444, fontSize: 22, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const gameOverSubStyle = new TextStyle({ fill: 0xffffff, fontSize: 22, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const heroSpeakingStyle    = new TextStyle({ fontSize: 36, fill: 0xffffff, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const instrTitleStyle      = new TextStyle({ fill: 0xffe066, fontSize: 36, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 5 })
const instrTextStyle       = new TextStyle({ fill: 0xffffff, fontSize: 22, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3, lineHeight: 38 })
const instrPromptStyle     = new TextStyle({ fill: 0xaaaaaa, fontSize: 18, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2 })
const difficultyStyles = Object.fromEntries(
  DIFFICULTY_ORDER.map(level => [
    level,
    new TextStyle({ fill: DIFFICULTIES[level].color, fontSize: 28, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 4 }),
  ])
) as Record<Difficulty, TextStyle>
const difficultyDimStyle = new TextStyle({ fill: 0x888888, fontSize: 24, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const startStyle         = new TextStyle({ fill: 0x00ff88, fontSize: 32, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 5 })

export const MainContainer = ({
  canvasSize,
  children,
}: PropsWithChildren<IMainContainerProps>) => {
  const [showInstructions, setShowInstructions] = useState(true)
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL')
  const [heroPosition, setHeroPosition]   = useState({ x: 1, y: 0 })
  const [catPositions, setCatPositions]   = useState<{ x: number; y: number }[]>(
    CAT_STARTS.map(s => ({ x: Math.floor(s.x / TILE_SIZE), y: Math.floor(s.y / TILE_SIZE) }))
  )
  const [cakePositions, setCakePositions] = useState<{ x: number; y: number }[]>(
    CAKE_STARTS.map(s => ({ x: Math.floor(s.x / TILE_SIZE), y: Math.floor(s.y / TILE_SIZE) }))
  )
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(new Set())
  const [deadCakes, setDeadCakes]           = useState<Set<number>>(new Set())
  const [chaseMode, setChaseMode]           = useState(false)
  const [lives, setLives]                   = useState(MAX_LIVES)
  const [gameOver, setGameOver]             = useState(false)
  const [catMessage, setCatMessage]         = useState<string | null>(null)
  const [cakeMessage, setCakeMessage]       = useState<string | null>(null)
  const [heroSpeaking, setHeroSpeaking]     = useState(false)
  const [boostTimeLeft, setBoostTimeLeft]   = useState(0)
  const [sprintTiles, setSprintTiles]       = useState(SPRINT_TILES)
  const [sprintRecharge, setSprintRecharge] = useState(0)
  const [oliverBoost, setOliverBoost]       = useState(false)
  const [finishSeconds, setFinishSeconds]   = useState<number | null>(null)
  const gameStartRef                        = useRef<number | null>(null)
  const oliverBoostRef                      = useRef(false)
  const catTimeout      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cakeTimeout     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const invincibleRef        = useRef(false)
  const playOliverRef        = useRef<(() => void) | null>(null)
  const interruptRandomRef   = useRef<(() => void) | null>(null)
  const playCakeEffectRef    = useRef<(() => void) | null>(null)
  const playCompletedRef     = useRef<(() => void) | null>(null)
  const completedPlayedRef   = useRef(false)

  useEffect(() => {
    if (!showInstructions) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Digit1' || e.code === 'Numpad1') setDifficulty('EASY')
      else if (e.code === 'Digit2' || e.code === 'Numpad2') setDifficulty('NORMAL')
      else if (e.code === 'Digit3' || e.code === 'Numpad3') setDifficulty('HARD')
      else if (e.code === 'Enter' || e.code === 'Space') setShowInstructions(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showInstructions])

  // Start the clock when the instructions are dismissed
  useEffect(() => {
    if (!showInstructions && gameStartRef.current === null) {
      gameStartRef.current = Date.now()
    }
  }, [showInstructions])

  useEffect(() => {
    let papeTimer:        ReturnType<typeof setTimeout>
    let randomSoundTimer: ReturnType<typeof setTimeout>
    let randomAudio: HTMLAudioElement | null = null
    let oliverPlaying = false

    // Random sounds: Bela Ciganka ×2 + Hindusi ×2, shuffled, looping forever.
    // Completely independent — not tied to vinyl or Pape.
    // If a hero sound is active, back off and retry in 3s.
    const playRandomQueue = (queue: string[], index: number) => {
      if (index >= queue.length) {
        // Reshuffle and loop
        const next = [belaCigankaSound, belaCigankaSound /*, hindusiSound, hindusiSound */]
        for (let i = next.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[next[i], next[j]] = [next[j], next[i]]
        }
        playRandomQueue(next, 0)
        return
      }
      const delay = index === 0 ? Math.random() * 25000 + 15000 : Math.random() * 8000 + 4000
      randomSoundTimer = setTimeout(() => {
        if (oliverPlaying) {
          randomSoundTimer = setTimeout(() => playRandomQueue(queue, index), 3000)
          return
        }
        randomAudio = new Audio(queue[index])
        setHeroSpeaking(true)
        randomAudio.play().catch(() => {})
        randomAudio.addEventListener('ended', () => {
          setHeroSpeaking(false)
          playRandomQueue(queue, index + 1)
        })
      }, delay)
    }

    // Kick off random queue immediately on mount
    const initialQueue = [belaCigankaSound, belaCigankaSound /*, hindusiSound, hindusiSound */]
    for (let i = initialQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[initialQueue[i], initialQueue[j]] = [initialQueue[j], initialQueue[i]]
    }
    playRandomQueue(initialQueue, 0)

    // After the vinyl sequence: a random song from the pool, no icon
    const poolAudios = VINYL_SONGS.map(src => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      return audio
    })
    let currentPoolSong: HTMLAudioElement | null = null

    const startPoolSong = () => {
      papeTimer = setTimeout(() => {
        currentPoolSong?.pause()
        currentPoolSong = poolAudios[Math.floor(Math.random() * poolAudios.length)]
        currentPoolSong.currentTime = 0
        currentPoolSong.play().catch(() => {})
      }, 1500)
    }

    // Oliver boost is active only while a pool background song plays
    const boostOn = () => {
      setOliverBoost(true)
      oliverBoostRef.current = true
    }
    const boostOff = () => {
      setOliverBoost(false)
      oliverBoostRef.current = false
    }
    poolAudios.forEach(audio => {
      audio.addEventListener('play', boostOn)
      audio.addEventListener('pause', boostOff)
      audio.addEventListener('ended', boostOff)
    })

    let oliverDone = false
    const afterOliver = () => {
      if (oliverDone) return
      oliverDone = true
      oliverPlaying = false
      setHeroSpeaking(false)
      oliverDone = false
      startPoolSong()
    }

    // Hero Sound Vinyl — triggered only by vinyl collision
    const oliver = new Audio(oliverSound)
    oliver.preload = 'auto'
    oliver.addEventListener('ended', afterOliver)
    oliver.addEventListener('error', afterOliver)

    playOliverRef.current = () => {
      if (oliverPlaying) return
      oliverPlaying = true
      clearTimeout(papeTimer)
      currentPoolSong?.pause()
      currentPoolSong = null
      oliver.currentTime = 0
      setHeroSpeaking(true)
      oliver.play().catch(afterOliver)
    }

    interruptRandomRef.current = () => {
      clearTimeout(randomSoundTimer)
      if (randomAudio) {
        randomAudio.pause()
        randomAudio = null
      }
      setHeroSpeaking(false)
    }

    return () => {
      clearTimeout(papeTimer)
      clearTimeout(randomSoundTimer)
      poolAudios.forEach(audio => audio.pause())
      oliver.pause()
      randomAudio?.pause()
      setHeroSpeaking(false)
      playOliverRef.current = null
      interruptRandomRef.current = null
    }
  }, [])

  useEffect(() => {
    const cakeAudio = new Audio(cakeEffectSound)
    cakeAudio.preload = 'auto'
    playCakeEffectRef.current = () => {
      interruptRandomRef.current?.()
      cakeAudio.currentTime = 0
      cakeAudio.play().catch(() => {})
    }

    const completedAudio = new Audio(completedEffectSound)
    completedAudio.preload = 'auto'
    playCompletedRef.current = () => {
      interruptRandomRef.current?.()
      completedAudio.currentTime = 0
      completedAudio.play().catch(() => {})
    }

    return () => {
      cakeAudio.pause()
      completedAudio.pause()
      playCakeEffectRef.current = null
      playCompletedRef.current = null
    }
  }, [])

  const showCatMsg = (msg: string) => {
    setCatMessage(msg)
    if (catTimeout.current) clearTimeout(catTimeout.current)
    catTimeout.current = setTimeout(() => setCatMessage(null), 2000)
  }

  const showCakeMsg = (msg: string) => {
    setCakeMessage(msg)
    if (cakeTimeout.current) clearTimeout(cakeTimeout.current)
    cakeTimeout.current = setTimeout(() => setCakeMessage(null), 2000)
  }

  const catUpdaters = useMemo(
    () =>
      CAT_STARTS.map((_, i) => (x: number, y: number) => {
        setCatPositions(prev => {
          const next = [...prev]
          next[i] = { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) }
          return next
        })
      }),
    []
  )

  const updateHeroPosition = useCallback((x: number, y: number) => {
    setHeroPosition({ x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) })
  }, [])

  const cakeUpdaters = useMemo(
    () =>
      CAKE_STARTS.map((_, i) => (x: number, y: number) => {
        setCakePositions(prev => {
          const next = [...prev]
          next[i] = { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) }
          return next
        })
      }),
    []
  )

  const chaseBannerStyle = useMemo(
    () =>
      new TextStyle({
        fill: 0xff4488,
        fontSize: Math.max(16, Math.min(30, canvasSize.width / 24)),
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 5,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: canvasSize.width - 32,
      }),
    [canvasSize.width]
  )

  const gameOverStyle = useMemo(
    () =>
      new TextStyle({
        fill: 0xff2222,
        fontSize: Math.max(24, Math.min(52, canvasSize.width / 14)),
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 6,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: canvasSize.width - 32,
      }),
    [canvasSize.width]
  )

  const winStyle = useMemo(
    () =>
      new TextStyle({
        fill: 0x00ff88,
        fontSize: Math.max(20, Math.min(40, canvasSize.width / 18)),
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 5,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: canvasSize.width - 32,
      }),
    [canvasSize.width]
  )

  const drawInstrOverlay = useCallback((g: any) => {
    g.clear()
    g.beginFill(0x000000, 0.88)
    g.drawRoundedRect(canvasSize.width / 2 - 280, canvasSize.height / 2 - 200, 560, 400, 18)
    g.endFill()
  }, [canvasSize.width, canvasSize.height])

  const drawOverlay = useCallback((g: any) => {
    g.clear()
    g.beginFill(0x000000, 0.75)
    g.drawRect(0, 0, canvasSize.width, canvasSize.height)
    g.endFill()
  }, [canvasSize.width, canvasSize.height])

  // Coin collection — only in normal mode and alive
  useEffect(() => {
    if (gameOver || chaseMode) return
    const index = ALL_COIN_POSITIONS.findIndex(
      c => c.x === heroPosition.x && c.y === heroPosition.y
    )
    if (index !== -1 && !collectedCoins.has(index)) {
      const newSize = collectedCoins.size + 1
      setCollectedCoins(prev => new Set([...prev, index]))
      if (CHASE_THRESHOLD > 0 && newSize % CHASE_THRESHOLD === 0) {
        setChaseMode(true)
      }
    }
  }, [heroPosition])

  // Vinyl collision — hero steps on vinyl tile → play Oliver
  useEffect(() => {
    if (heroPosition.x === VINYL_TILE.x && heroPosition.y === VINYL_TILE.y) {
      playOliverRef.current?.()
    }
  }, [heroPosition])

  // Vinyl 2 collision — same sequence: Oliver, then a random pool song
  useEffect(() => {
    if (heroPosition.x === VINYL2_TILE.x && heroPosition.y === VINYL2_TILE.y) {
      playOliverRef.current?.()
    }
  }, [heroPosition])

  // Cat collision — always active while alive
  useEffect(() => {
    if (gameOver) return
    const catIndex = catPositions.findIndex(
      c => heroPosition.x === c.x && heroPosition.y === c.y
    )
    if (catIndex !== -1) {
      if (catIndex === ORANGE_CAT_INDEX) {
        showCatMsg('🐾 Pet the cat! ⚡ Speed boost! ova macka je ulizica')
        setBoostTimeLeft(ORANGE_BOOST_SECONDS)
      } else {
        showCatMsg('🐾 Pet the cat! ⚡ Speed boost')
        setBoostTimeLeft(CAT_BOOST_SECONDS)
      }
    }
  }, [heroPosition, catPositions])

  // Speed boost countdown — tick down once per second
  useEffect(() => {
    if (boostTimeLeft <= 0) return
    const timer = setTimeout(() => setBoostTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [boostTimeLeft])

  // Sprint stamina recharge countdown — refill bar when it reaches 0
  const handleSprintChange = useCallback((tilesLeft: number, rechargeSeconds: number) => {
    setSprintTiles(tilesLeft)
    setSprintRecharge(rechargeSeconds)
  }, [])

  useEffect(() => {
    if (sprintRecharge <= 0) return
    const timer = setTimeout(() => {
      setSprintRecharge((s) => {
        const next = s - 1
        if (next <= 0) setSprintTiles(SPRINT_TILES)
        return next
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [sprintRecharge])

  // Cake collision — catch in chase mode, lose life in normal mode
  useEffect(() => {
    if(!showInstructions)
{
    if (gameOver) return
    const hitIndex = cakePositions.findIndex(
      (c, i) => !deadCakes.has(i) && c.x === heroPosition.x && c.y === heroPosition.y
    )
    if (hitIndex === -1) return

    if (chaseMode) {
      setDeadCakes(prev => new Set([...prev, hitIndex]))
      setChaseMode(false)
      playCakeEffectRef.current?.()
      showCakeMsg('🎂 Cake caught!')
    } else if (!invincibleRef.current) {
      invincibleRef.current = true
      setTimeout(() => { invincibleRef.current = false }, 2000)
      playCakeEffectRef.current?.()
      showCakeMsg('🎂 Cake got you!')
      setLives(prev => {
        const next = prev - (oliverBoostRef.current ? 0.5 : 1)
        if (next <= 0) setGameOver(true)
        return next
      })
    }
 }
  }, [heroPosition, chaseMode, cakePositions])

  // All coins collected — play completion effect once
  useEffect(() => {
    if (collectedCoins.size === ALL_COIN_POSITIONS.length && ALL_COIN_POSITIONS.length > 0 && !completedPlayedRef.current) {
      completedPlayedRef.current = true
      playCompletedRef.current?.()
      if (gameStartRef.current !== null) {
        setFinishSeconds(Math.round((Date.now() - gameStartRef.current) / 1000))
      }
    }
  }, [collectedCoins])

  const heroTexture       = useMemo(() => Texture.from(heroAsset), [])
  const coinTexture       = useMemo(() => Texture.from(coinRedAsset), [])
  const cackeTexture      = useMemo(() => Texture.from(cakeAsset), [])
  const catTexture        = useMemo(() => Texture.from(catAsset), [])
  const backgroundTexture = useMemo(() => Texture.from(backgroundAsset), [])
  const vinylTexture      = useMemo(() => Texture.from(vinylAsset), [])

  const allCollected = collectedCoins.size === ALL_COIN_POSITIONS.length
  const heartsText =
    '❤️'.repeat(Math.floor(lives)) +
    (lives % 1 !== 0 ? '💔' : '') +
    '🖤'.repeat(Math.floor(MAX_LIVES - lives))

  return (
    <>
      <Container>
        <Sprite texture={backgroundTexture} width={canvasSize.width} height={canvasSize.height} />
        {children}
        <Camera heroPosition={heroPosition} canvasSize={canvasSize}>
          <Level />
          {ALL_COIN_POSITIONS.map((coin, i) =>
            !collectedCoins.has(i) ? (
              <Coin key={i} texture={coinTexture} x={coin.x} y={coin.y} />
            ) : null
          )}
          <Hero
            texture={heroTexture}
            onMove={updateHeroPosition}
            speedMultiplier={(boostTimeLeft > 0 ? 2 : 1) * DIFFICULTIES[difficulty].heroSpeed}
            onSprintChange={handleSprintChange}
          />
          {CAKE_STARTS.map((start, i) =>
            !deadCakes.has(i) ? (
              <Cake key={i} texture={cackeTexture} x_start={start.x} y_start={start.y} onMove={cakeUpdaters[i]} heroPosition={heroPosition} fleeing={chaseMode} speedMultiplier={DIFFICULTIES[difficulty].cakeSpeed} />
            ) : null
          )}
          <Vinyl texture={vinylTexture} tileX={VINYL_TILE.x} tileY={VINYL_TILE.y} />
          <Vinyl texture={vinylTexture} tileX={VINYL2_TILE.x} tileY={VINYL2_TILE.y} />
          {CAT_STARTS.map((start, i) => (
            <Cat2
              key={i}
              texture={catTexture}
              onMove={catUpdaters[i]}
              startX={start.x}
              startY={start.y}
              tint={i === ORANGE_CAT_INDEX ? 0xff7700 : undefined}
            />
          ))}
        </Camera>

        {/* Score — upper right, coins until next chase mode */}
        <Text
          text={`🪙 ${collectedCoins.size % CHASE_THRESHOLD} / ${CHASE_THRESHOLD} till chase mode`}
          x={canvasSize.width - 10}
          y={10}
          anchor={{ x: 1, y: 0 }}
          style={scoreStyle}
        />

        {/* Lives — upper right, below score */}
        <Text
          text={heartsText}
          x={canvasSize.width - 10}
          y={38}
          anchor={{ x: 1, y: 0 }}
          style={livesStyle}
        />

        {/* Cakes remaining — upper right, below lives */}
        <Text
          text={`🎂 ${deadCakes.size} / ${CAKE_STARTS.length}`}
          x={canvasSize.width - 10}
          y={66}
          anchor={{ x: 1, y: 0 }}
          style={cakeAlertStyle}
        />

        {/* Sprint stamina bar — upper right, below cakes */}
        {!gameOver && (
          <Text
            text={(() => {
              const filled =
                sprintRecharge > 0
                  ? Math.floor(
                      ((SPRINT_RECHARGE_SECONDS - sprintRecharge) /
                        SPRINT_RECHARGE_SECONDS) *
                        SPRINT_TILES
                    )
                  : sprintTiles
              const bar = '▰'.repeat(filled) + '▱'.repeat(SPRINT_TILES - filled)
              return sprintRecharge > 0
                ? `💨 ${bar} ${sprintRecharge}s`
                : `💨 ${bar}`
            })()}
            x={canvasSize.width - 10}
            y={94}
            anchor={{ x: 1, y: 0 }}
            style={scoreStyle}
          />
        )}

        {/* Speed boost indicator — upper right, below stamina */}
        {boostTimeLeft > 0 && !gameOver && (
          <Text
            text={`⚡ Speed x2 — ${boostTimeLeft}s`}
            x={canvasSize.width - 10}
            y={122}
            anchor={{ x: 1, y: 0 }}
            style={scoreStyle}
          />
        )}

        {/* Oliver boost indicator — upper right */}
        {oliverBoost && !gameOver && (
          <Text
            text="🎵 Oliver boost — cakes deal half damage"
            x={canvasSize.width - 10}
            y={150}
            anchor={{ x: 1, y: 0 }}
            style={scoreStyle}
          />
        )}

        {/* Chase mode banner */}
        {chaseMode && !gameOver && (
          <Text
            text="🎂 CHASE MODE! Catch a cake! You are in a calorie deficit."
            x={canvasSize.width / 2}
            y={16}
            anchor={{ x: 0.5, y: 0 }}
            style={chaseBannerStyle}
          />
        )}

        {allCollected && !gameOver && (
          <>
            <Text
              text="🚀Čestitam, presli ste dosta koraka danas Do leta izgledacete kao RAKETA🚀!"
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 - 80}
              anchor={0.5}
              style={winStyle}
            />
            {finishSeconds !== null && (
              <Text
                text={`⏱️ Finished in ${Math.floor(finishSeconds / 60)}:${String(finishSeconds % 60).padStart(2, '0')}`}
                x={canvasSize.width / 2}
                y={canvasSize.height / 2 - 30}
                anchor={0.5}
                style={gameOverSubStyle}
              />
            )}
          </>
        )}

        {/* Hero speaking icon — bottom center */}
        {heroSpeaking && (
          <Text
            text="♪ Playing"
            x={canvasSize.width / 2}
            y={canvasSize.height - 40}
            anchor={0.5}
            style={heroSpeakingStyle}
          />
        )}

        {!gameOver && catMessage && (
          <Text text={catMessage} x={canvasSize.width / 2} y={canvasSize.height / 2 - 40} anchor={0.5} style={catAlertStyle} />
        )}
        {!gameOver && cakeMessage && (
          <Text text={cakeMessage} x={canvasSize.width / 2} y={canvasSize.height / 2 + 10} anchor={0.5} style={cakeAlertStyle} />
        )}

        {/* Instructions overlay — shown on first load */}
        {showInstructions && (
          <>
            <Graphics draw={drawInstrOverlay} />
            <Text
              text="How to Play"
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 - 170}
              anchor={0.5}
              style={instrTitleStyle}
            />
            <Text
              text={
                '👣  Walk over every step to collect it\n' +
                '🎂  Collect enough steps to chase the cakes!\n' +
                '🐱  Find and pet the cat\n' +
                '🎵  Discover the vinyl player'
              }
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 - 90}
              anchor={{ x: 0.5, y: 0 }}
              style={instrTextStyle}
            />
            {DIFFICULTY_ORDER.map((level, i) => (
              <Text
                key={level}
                text={
                  difficulty === level
                    ? `▶ ${DIFFICULTIES[level].label} ◀`
                    : DIFFICULTIES[level].label
                }
                x={canvasSize.width / 2 + (i - 1) * 160}
                y={canvasSize.height / 2 + 95}
                anchor={0.5}
                style={difficulty === level ? difficultyStyles[level] : difficultyDimStyle}
                eventMode="static"
                cursor="pointer"
                pointerdown={() => setDifficulty(level)}
              />
            ))}
            <Text
              text="▶ START ◀"
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 + 145}
              anchor={0.5}
              style={startStyle}
              eventMode="static"
              cursor="pointer"
              pointerdown={() => setShowInstructions(false)}
            />
            <Text
              text="Pick a mode (tap or 1 / 2 / 3), then tap START or press Enter"
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 + 182}
              anchor={0.5}
              style={instrPromptStyle}
            />
          </>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <>
            <Graphics draw={drawOverlay} />
            <Text
                text="🎂GAME OVER you eat to much cake this time 🎂"
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 - 50}
              anchor={0.5}
              style={gameOverStyle}
            />
            <Text
              text={`You collected ${collectedCoins.size} / ${ALL_COIN_POSITIONS.length} coins`}
              x={canvasSize.width / 2}
              y={canvasSize.height / 2 + 20}
              anchor={0.5}
              style={gameOverSubStyle}
            />
          </>
        )}
      </Container>
    </>
  )
}

export default MainContainer
