// Cat.tsx
import { useRef, useEffect, useMemo } from "react";
import { Container, Sprite, useTick } from "@pixi/react";
import { Texture } from "pixi.js";
import { useCatAnimation } from "./useCatAnimation";
import { TILE_SIZE } from "../../constants/game-world";

// Import your assets
import catUpAsset from "../../assets/cat_up.png";
import catDownAsset from "../../assets/cat_down.png";
import catLeftAsset from "../../assets/cat_left.png";
import catRightAsset from "../../assets/cat_right.png";
import catJumpAsset from "../../assets/cat_jump.png"; // optional jump texture

interface ICatProps {
  frame: number;
}

const ANIMATION_SPEED = 0.2;
const MOVE_SPEED = 2; // pixels per tick

export const Cat = ({ frame }: ICatProps) => {
  const position = useRef({ x: 5, y: 15 }); // starting tile position
  const targetPosition = useRef<{ x: number; y: number } | null>(null);
  const isMoving = useRef(false);
  const currentDirection = useRef<"up" | "down" | "left" | "right">("down");

  // Preload textures
  const catTextures = useMemo(
    () => ({
      up: Texture.from(catUpAsset),
      down: Texture.from(catDownAsset),
      left: Texture.from(catLeftAsset),
      right: Texture.from(catRightAsset),
    }),
    []
  );

  // Animation for frames
  const { currentTexture, update } = useCatAnimation({
    texture: catTextures.down, // initial
    frameWidth: 32,
    frameHeight: 32,
    totalFrames: frame,
    animationSpeed: ANIMATION_SPEED,
  });

  // Random movement target every 2-4 seconds
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const setRandomTarget = () => {
      let dx = 0;
      let dy = 0;
      if (Math.random() < 0.5) {
        dx = Math.random() < 0.5 ? -1 : 1;
        currentDirection.current = dx > 0 ? "right" : "left";
      } else {
        dy = Math.random() < 0.5 ? -1 : 1;
        currentDirection.current = dy > 0 ? "down" : "up";
      }

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

  // Movement tick
  useTick((delta) => {
    update(delta);

    if (targetPosition.current) {
      const dx =
        targetPosition.current.x * TILE_SIZE - position.current.x * TILE_SIZE;
      const dy =
        targetPosition.current.y * TILE_SIZE - position.current.y * TILE_SIZE;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOVE_SPEED) {
        position.current = { ...targetPosition.current };
        targetPosition.current = null;
        isMoving.current = false;
      } else {
        position.current.x += (dx / dist) * (MOVE_SPEED / TILE_SIZE);
        position.current.y += (dy / dist) * (MOVE_SPEED / TILE_SIZE);
        isMoving.current = true;

        // update direction while moving
        if (Math.abs(dx) > Math.abs(dy)) {
          currentDirection.current = dx > 0 ? "right" : "left";
        } else {
          currentDirection.current = dy > 0 ? "down" : "up";
        }
      }
    }
  });

  return (
    <Container
      x={position.current.x * TILE_SIZE}
      y={position.current.y * TILE_SIZE}
    >
      <Sprite
        texture={catTextures[currentDirection.current]}
        scale={0.5}
        anchor={[-0.4, 0]}
      />
    </Container>
  );
};
