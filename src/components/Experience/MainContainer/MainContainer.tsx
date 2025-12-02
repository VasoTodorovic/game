import { useState, useMemo, PropsWithChildren, useCallback, useEffect } from 'react'
import { Texture } from 'pixi.js'
import { Container, Sprite } from '@pixi/react'
import { DEFAULT_X_POS, DEFAULT_X_POS_CAT, DEFAULT_Y_POS, DEFAULT_Y_POS_CAT, TILE_SIZE } from '../../../constants/game-world'
import { Hero } from '../../Hero/Hero'
import { Level } from '../../Levels/Level'
import { Camera } from '../../Camera/Camera'
import { Coin } from '../../Coin/Coin'
import backgroundAsset from '@/assets/city.jpg'
import heroAsset from '@/assets/hero.png'
import coinRedAsset from '@/assets/coin-red.png'
import coinGoldAsset from '@/assets/coin-gold.png'
import cakeAsset from "@/assets/cake.png";
import catAsset from "@/assets/cat.png";
import { Cat } from '../../Cat/Cat'
// import TextBox from '../../textbox/textbox'
import { Cake } from '../../cake/Cake'
import { Cat2 } from '../../Cat/Cat2'

interface IMainContainerProps {
  canvasSize: { width: number; height: number }
}

export const MainContainer = ({
  canvasSize,
  children,
}: PropsWithChildren<IMainContainerProps>) => {
  const [heroPosition, setHeroPosition] = useState({ x: 1, y: 0 })
  const [catPosition,setCatPosition] =useState ({ x: 0, y:0 } )// 🐱 cat tile position
  const [isTextVisible, setIsTextVisible] = useState(false)

  const updateCatPosition = useCallback((x: number, y: number) => {

    setCatPosition({
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    })
  }, [])
  //#doradim sta radi useCallback
  const updateHeroPosition = useCallback((x: number, y: number) => {

    setHeroPosition({
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    })
  }, [])
    // 🧠 Collision detection
 useEffect(() => {
    console.log('hero ' +heroPosition.y);
    console.log('cat' + catPosition.x);
    if (
      heroPosition.x === catPosition.x &&
      heroPosition.y === catPosition.y
    ) {
      console.log('🐾 Cat and Hero collided!')
      setIsTextVisible(true)
    }
  }, [heroPosition])
  //pamti texture u re=renderu
  const heroTexture = useMemo(() => Texture.from(heroAsset), [])
  const coinTextureRed = useMemo(() => Texture.from(coinRedAsset), [])
  const coinTextureGold = useMemo(() => Texture.from(coinGoldAsset), [])
  const cackeTexture = useMemo(() => Texture.from(cakeAsset), [])
  const catTexture = useMemo(() => Texture.from(catAsset), [])

  const backgroundTexture = useMemo(() => Texture.from(backgroundAsset), [])

return (
  <>
    <Container>
      <Sprite
        //nisam siguran
        texture={backgroundTexture}
        //ovo je pozadina duzina i visina
        width={canvasSize.width}
        height={canvasSize.height}
      />
      {children}
      <Camera heroPosition={heroPosition} canvasSize={canvasSize}>
        <Level />
        <Hero texture={heroTexture} onMove={updateHeroPosition} />
        <Coin texture={coinTextureRed} x={5} y={10} />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*1} y_start={TILE_SIZE*1} onMove={updateCatPosition}  />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*7} y_start={TILE_SIZE*4} onMove={updateCatPosition}  />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*7} y_start={TILE_SIZE*4} onMove={updateCatPosition}  />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*21} y_start={TILE_SIZE*3} onMove={updateCatPosition}  />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*24} y_start={TILE_SIZE*3} onMove={updateCatPosition}  />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*1} y_start={TILE_SIZE*14} onMove={updateCatPosition}  />
        <Cake texture={cackeTexture} x_start={TILE_SIZE*18} y_start={TILE_SIZE*10} onMove={updateCatPosition}  />
        <Coin texture={coinTextureGold} x={6} y={11} />
        <Cat2  texture={catTexture} onMove={updateCatPosition} />
      </Camera>
    </Container>

  </>)
}

export default MainContainer
