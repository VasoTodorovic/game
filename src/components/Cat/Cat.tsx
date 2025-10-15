import { useRef, useEffect } from "react";
import { Container, Sprite, useTick } from "@pixi/react";
import { Texture } from "pixi.js";
import { useCatAnimation } from "./useCatAnimation";
import { TILE_SIZE } from "../../constants/game-world";

interface ICatProps {
  texture: Texture;
  frame: number;
}

const ANIMATION_SPEED = 0.2;
const MOVE_SPEED = 2; // pixels per tick, adjust to taste

export const Cat = ({  frame }: ICatProps) => {
  const position = useRef({ x: 5, y: 15 }); // starting tile position
  const targetPosition = useRef<{ x: number; y: number } | null>(null);
  const isMoving = useRef(false);

  const { currentTexture, update } = useCatAnimation({
    texture,
    frameWidth: 32,
    frameHeight: 32,
    totalFrames: frame,
    animationSpeed: ANIMATION_SPEED,
  });

  // randomly pick next target every 2-4s
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const setRandomTarget = () => {
      var dx = 0;
      var dy = 0;
      if (Math.random() < 0.5) {
        dx = Math.random() < 0.5 ? -1 : 1;
        if (dx > 0 ) {
          console.log("ide desno");
        } else {
          console.log("ide levo");

        }

      } else {
        dy = Math.random() < 0.5 ? -1 : 1;
          if (dy > 0 ) {
            console.log("ide dole");
          } else {
            console.log("ide gore");
          }
      }

      // don't move if both dx and dy are 0

      targetPosition.current = {
        x: Math.max(position.current.x + dx, 0),
        y: Math.max(position.current.y + dy, 0),
      };

      const randomDelay = Math.random() * (4000 - 2000) + 2000;
      timeoutId = setTimeout(setRandomTarget, randomDelay);
    };

    setRandomTarget();

    return () => clearTimeout(timeoutId);
  }, []);

  useTick((delta) => {
    update(delta);

    if (targetPosition.current) {
      const dx =
        targetPosition.current.x * TILE_SIZE - position.current.x * TILE_SIZE;
      const dy =
        targetPosition.current.y * TILE_SIZE - position.current.y * TILE_SIZE;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOVE_SPEED) {
        // reached target
        position.current = { ...targetPosition.current };
        targetPosition.current = null;
        isMoving.current = false;
      } else {
        // move toward target
        position.current.x += (dx / dist) * (MOVE_SPEED / TILE_SIZE);
        position.current.y += (dy / dist) * (MOVE_SPEED / TILE_SIZE);
        isMoving.current = true;
      }
    }
  });

  return (
    <Container
      x={position.current.x * TILE_SIZE}
      y={position.current.y * TILE_SIZE}
    >
      <Sprite texture={currentTexture} scale={0.5} anchor={[-0.2, 0]} />
    </Container>
  );
};
