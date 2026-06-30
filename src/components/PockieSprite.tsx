import { useRef, useEffect } from 'react';
import pockieSprite from '../assets/pockie_sprite.png';
import pockieShy from '../assets/p-shy.png';
import pockieVictory from '../assets/P-victory.png';
import pockieCry from '../assets/pockie-cry-v1.png';

export type SpriteVariant = 'default' | 'shy' | 'victory' | 'cry';

interface PockieSpriteProps {
  size?: number;
  className?: string;
  variant?: SpriteVariant;
}

export function PockieSprite({ size = 80, className = '', variant = 'default' }: PockieSpriteProps) {
  const spriteRef = useRef<HTMLDivElement>(null);
  const totalFrames = 25;
  const cols = 5;
  const rows = 5;
  const fps = 20;

  const getSpriteSource = () => {
    switch (variant) {
      case 'shy': return pockieShy;
      case 'victory': return pockieVictory;
      case 'cry': return pockieCry;
      default: return pockieSprite;
    }
  };

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % totalFrames;
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      const bgPosX = (col / (cols - 1)) * 100;
      const bgPosY = (row / (rows - 1)) * 100;
      
      if (spriteRef.current) {
        spriteRef.current.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
      }
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [fps, totalFrames, cols, rows]);

  return (
    <div
      ref={spriteRef}
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${getSpriteSource()})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `0% 0%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
