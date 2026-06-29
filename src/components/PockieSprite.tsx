import { useState, useEffect } from 'react';
import pockieSprite from '../assets/pockie_sprite.png';

interface PockieSpriteProps {
  size?: number;
  className?: string;
}

export function PockieSprite({ size = 80, className = '' }: PockieSpriteProps) {
  const [frame, setFrame] = useState(0);
  const totalFrames = 25;
  const cols = 5;
  const rows = 5;
  const fps = 20;

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
        backgroundImage: `url(${pockieSprite})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
