import { useState, useMemo, PropsWithChildren, useCallback, useEffect, useRef } from 'react'
import { Texture, TextStyle } from 'pixi.js'
import { Container, Sprite, Text, Graphics } from '@pixi/react'
import { TILE_SIZE, COLS } from '../../../constants/game-world'
import { COLLISION_MAP } from '../../../constants/collision-map'
import { Hero } from '../../Hero/Hero'
import { Level } from '../../Levels/Level'
import { Camera } from '../../Camera/Camera'
import { Coin } from '../../Coin/Coin'
import backgroundAsset from '@/assets/city.jpg'
import heroAsset from '@/assets/hero.png'
import coinRedAsset from '@/assets/coin-red.png'
import cakeAsset from "@/assets/cake.png"
import catAsset from "@/assets/cat.png"
import hindusiSound from '@/assets/Hindusi.mpeg'
import oliverSound from '@/assets/Oliver Dragojevic.mpeg'
import oliverSoundPape from '@/assets/Oliver Dragojevic-Oprosti Mi Pape.mp3'
import { Cake } from '../../cake/Cake'
import { Cat2 } from '../../Cat/Cat2'

interface IMainContainerProps {
  canvasSize: { width: number; height: number }
}

const ALL_COIN_POSITIONS = COLLISION_MAP.reduce<{ x: number; y: number }[]>((acc, cell, index) => {
  if (cell === 0) acc.push({ x: index % COLS, y: Math.floor(index / COLS) })
  return acc
}, [])

const CHASE_THRESHOLD = Math.floor(ALL_COIN_POSITIONS.length / 7)
const MAX_LIVES = 3

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
const chaseBannerStyle = new TextStyle({ fill: 0xff4488, fontSize: 30, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 5 })
const winStyle         = new TextStyle({ fill: 0x00ff88, fontSize: 40, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 5 })
const scoreStyle       = new TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const livesStyle       = new TextStyle({ fill: 0xff4444, fontSize: 22, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const gameOverStyle    = new TextStyle({ fill: 0xff2222, fontSize: 52, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 6 })
const gameOverSubStyle = new TextStyle({ fill: 0xffffff, fontSize: 22, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })
const heroSpeakingStyle = new TextStyle({ fontSize: 36, fill: 0xffffff, fontWeight: 'bold', stroke: 0x000000, strokeThickness: 3 })

export const MainContainer = ({
  canvasSize,
  children,
}: PropsWithChildren<IMainContainerProps>) => {
  const [heroPosition, setHeroPosition]   = useState({ x: 1, y: 0 })
  const [cat2Position, setCat2Position]   = useState({ x: 0, y: 0 })
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
  const catTimeout    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cakeTimeout   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const invincibleRef = useRef(false)

  useEffect(() => {
    let oliverTimer:  ReturnType<typeof setTimeout>
    let hindusiTimer: ReturnType<typeof setTimeout>
    let hindusiAudio: HTMLAudioElement | null = null

    // Hindusi = hero speaking → shows icon
    const scheduleHindusi = () => {
      const delay = Math.random() * 30000 + 20000
      hindusiTimer = setTimeout(() => {
        hindusiAudio = new Audio(hindusiSound)
        setHeroSpeaking(true)
        hindusiAudio.play().catch(() => {})
        hindusiAudio.addEventListener('ended', () => {
          setHeroSpeaking(false)
          scheduleHindusi()
        })
      }, delay)
    }

    let papeTimer: ReturnType<typeof setTimeout>

    const startPape = () => {
      papeTimer = setTimeout(() => {
        pape.play().catch(scheduleHindusi)
      }, 1500)
    }

    // Pape = background music → no icon, just plays
    const pape = new Audio(oliverSoundPape)
    pape.preload = 'auto'
    pape.addEventListener('ended', scheduleHindusi)
    pape.addEventListener('error', scheduleHindusi)

    let oliverDone = false
    const afterOliver = () => {
      if (oliverDone) return
      oliverDone = true
      setHeroSpeaking(false)
      startPape()
    }

    // Oliver = hero speaking → shows icon
    const oliver = new Audio(oliverSound)
    oliver.preload = 'auto'
    oliver.addEventListener('ended', afterOliver)
    oliver.addEventListener('error', afterOliver)

    // Start with Oliver 10 s after load
    const startTimer = setTimeout(() => {
      setHeroSpeaking(true)
      oliver.play().catch(afterOliver)
    }, 10000)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(papeTimer)
      clearTimeout(hindusiTimer)
      pape.pause()
      oliver.pause()
      hindusiAudio?.pause()
      setHeroSpeaking(false)
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

  const updateCat2Position = useCallback((x: number, y: number) => {
    setCat2Position({ x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) })
  }, [])

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

  // Cat collision — always active while alive
  useEffect(() => {
    if (gameOver) return
    if (heroPosition.x === cat2Position.x && heroPosition.y === cat2Position.y) {
      showCatMsg('🐾 Cat got you!')
    }
  }, [heroPosition, cat2Position])

  // Cake collision — catch in chase mode, lose life in normal mode
  useEffect(() => {
    if (gameOver) return
    const hitIndex = cakePositions.findIndex(
      (c, i) => !deadCakes.has(i) && c.x === heroPosition.x && c.y === heroPosition.y
    )
    if (hitIndex === -1) return

    if (chaseMode) {
      setDeadCakes(prev => new Set([...prev, hitIndex]))
      setChaseMode(false)
      showCakeMsg('🎂 Cake caught!')
    } else if (!invincibleRef.current) {
      invincibleRef.current = true
      setTimeout(() => { invincibleRef.current = false }, 2000)
      showCakeMsg('🎂 Cake got you!')
      setLives(prev => {
        const next = prev - 1
        if (next <= 0) setGameOver(true)
        return next
      })
    }
  }, [heroPosition, chaseMode, cakePositions])

  const heroTexture       = useMemo(() => Texture.from(heroAsset), [])
  const coinTexture       = useMemo(() => Texture.from(coinRedAsset), [])
  const cackeTexture      = useMemo(() => Texture.from(cakeAsset), [])
  const catTexture        = useMemo(() => Texture.from(catAsset), [])
  const backgroundTexture = useMemo(() => Texture.from(backgroundAsset), [])

  const allCollected = collectedCoins.size === ALL_COIN_POSITIONS.length
  const heartsText   = '❤️'.repeat(lives) + '🖤'.repeat(MAX_LIVES - lives)

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
          <Hero texture={heroTexture} onMove={updateHeroPosition} />
          {CAKE_STARTS.map((start, i) =>
            !deadCakes.has(i) ? (
              <Cake key={i} texture={cackeTexture} x_start={start.x} y_start={start.y} onMove={cakeUpdaters[i]} />
            ) : null
          )}
          <Cat2 texture={catTexture} onMove={updateCat2Position} />
        </Camera>

        {/* Score — upper right */}
        <Text
          text={`🪙 ${collectedCoins.size} / ${ALL_COIN_POSITIONS.length}`}
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

        {/* Chase mode banner */}
        {chaseMode && !gameOver && (
          <Text
            text="🎂 CHASE MODE! Catch a cake!"
            x={canvasSize.width / 2}
            y={16}
            anchor={{ x: 0.5, y: 0 }}
            style={chaseBannerStyle}
          />
        )}

        {allCollected && !gameOver && (
          <Text
            text="🎉 You collected all coins!"
            x={canvasSize.width / 2}
            y={canvasSize.height / 2 - 80}
            anchor={0.5}
            style={winStyle}
          />
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

        {/* Game over overlay */}
        {gameOver && (
          <>
            <Graphics draw={drawOverlay} />
            <Text
              text="💀 GAME OVER"
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
