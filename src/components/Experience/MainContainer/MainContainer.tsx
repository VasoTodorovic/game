import { useState, useMemo, PropsWithChildren, useCallback, useEffect } from 'react'
import { Texture } from 'pixi.js'
import { Container, Sprite } from '@pixi/react'
import { TILE_SIZE } from '../../../constants/game-world'
import { Hero } from '../../Hero/Hero'
import { Level } from '../../Levels/Level'
import { Camera } from '../../Camera/Camera'
import { Coin } from '../../Coin/Coin'
import backgroundAsset from '@/assets/space-stars.jpg'
import heroAsset from '@/assets/hero.png'
import coinRedAsset from '@/assets/coin-red.png'
import coinGoldAsset from '@/assets/coin-gold.png'
import catAsset from '@/assets/idle.png'
import catJumpAsset from '@/assets/jump.png'
import { Cat } from '../../Cat/Cat'
import TextBox from '../../textbox/textbox'

interface IMainContainerProps {
  canvasSize: { width: number; height: number }
}

export const MainContainer = ({
  canvasSize,
  children,
}: PropsWithChildren<IMainContainerProps>) => {
  const [heroPosition, setHeroPosition] = useState({ x: 0, y: 0 })
  const [catPosition,setCatPosition] =useState ({ x: 5, y: 15 } )// 🐱 cat tile position
  const [isTextVisible, setIsTextVisible] = useState(false)
  const updateHeroPosition = useCallback((x: number, y: number) => {
    setHeroPosition({
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    })
  }, [])
/* useEffect(() => {
  let timeoutId: ReturnType<typeof setTimeout>;

  const doAction = () => {
    console.log("Action happened!", new Date().toLocaleTimeString());
    setCatPosition(prev => {
      // move randomly -1 or +1
      //
      //
    var dx=0;
     var dy=0;
      if(Math.random()<0.5){
      dx = Math.random() < 0.5 ? -1 : 1;}
      else{
      dy = Math.random() < 0.5 ? -1 : 1;}

      return {
        x: Math.max(prev.x + dx, 0),
        y: Math.max(prev.y + dy, 0),
      };
    });

    // pick a random delay between 2s and 4s
    const randomDelay = Math.random() * (4000 - 2000) + 2000;
    timeoutId = setTimeout(doAction, randomDelay);
  };

  doAction();

  return () => clearTimeout(timeoutId);
}, []);; */
    // 🧠 Collision detection
 useEffect(() => {
    if (
      heroPosition.x === catPosition.x &&
      heroPosition.y === catPosition.y
    ) {
      console.log('🐾 Cat and Hero collided!')
      setIsTextVisible(true)
    }
  }, [heroPosition])
  const heroTexture = useMemo(() => Texture.from(heroAsset), [])
  const coinTextureRed = useMemo(() => Texture.from(coinRedAsset), [])
  const coinTextureGold = useMemo(() => Texture.from(coinGoldAsset), [])
  const backgroundTexture = useMemo(() => Texture.from(backgroundAsset), [])
  const catJumpTexture= useMemo(() => Texture.from(catJumpAsset), [])

return (
  <>
    {/* 🎨 PixiJS Scene */}
    <Container>
      <Sprite
        texture={backgroundTexture}
        width={canvasSize.width}
        height={canvasSize.height}
      />
      {children}
      <Camera heroPosition={heroPosition} canvasSize={canvasSize}>
        <Level />
        <Hero texture={heroTexture} onMove={updateHeroPosition} />
        <Coin texture={coinTextureRed} x={5} y={10} />
        <Coin texture={coinTextureGold} x={6} y={11} />
        {/* <Cat texture={catTexture} x={8} y={10} frame={7} /> */}
        <Cat  x={catPosition.x} y={catPosition.y} frame={7} />
        {/* <Cat texture={catAttackTexture} x={11} y={10} frame={3} /> */}
      </Camera>
      <TextBox
    x={100}
    y={400}
    width={400}
    height={120}
    visible={isTextVisible}
    content="Meow! You found the space cat 🐱"
    onClose={() => setIsTextVisible(false)}
  />
    </Container>

  </>)
}

export default MainContainer
