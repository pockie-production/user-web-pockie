import { useState, useEffect } from 'react';
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
  const [frame, setFrame] = useState(0);
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
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % totalFrames);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, []);

  const col = frame % cols;
  const row = Math.floor(frame / cols);

  const bgPosX = (col / (cols - 1)) * 100;
  const bgPosY = (row / (rows - 1)) * 100;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${getSpriteSource()})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
