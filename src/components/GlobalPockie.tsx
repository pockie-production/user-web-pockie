import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackUserEvent } from '../lib/analytics';
import { PockieSprite } from './PockieSprite';
import '../pages/Dashboard/Dashboard.css';

export function GlobalPockie() {
  const navigate = useNavigate();
  
  // --- Drag Logic cho FAB AI ---
  const [fabPos, setFabPos] = useState({ x: window.innerWidth - 188, y: window.innerHeight - 188 });
  const [isDragging, setIsDragging] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const dragStartClient = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Auto-move refs
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const posRef = useRef({ x: window.innerWidth - 188, y: window.innerHeight - 188 });
  const velRef = useRef({ vx: -1.0, vy: -1.0 });
  const speedMultiplierRef = useRef(1.0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const [idleVariant, setIdleVariant] = useState<'default' | 'shy' | 'victory' | 'cry'>('default');
  const [customBubbleText, setCustomBubbleText] = useState('');
  const globalMousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    // Khởi tạo vị trí FAB (góc dưới phải)
    const initX = window.innerWidth - 188;
    const initY = window.innerHeight - 188;
    setFabPos({ x: initX, y: initY });
    posRef.current = { x: initX, y: initY };

    const handleResize = () => {
      setFabPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        if (newX > window.innerWidth - 188) newX = window.innerWidth - 188;
        if (newY > window.innerHeight - 188) newY = window.innerHeight - 188;
        return { x: newX, y: newY };
      });
    };
    window.addEventListener('resize', handleResize);

    const handleGlobalMove = (e: MouseEvent) => {
      globalMousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleGlobalMove);

    // Teleport timer: occurs randomly every ~30 seconds if not dragging
    const teleportInterval = setInterval(() => {
      if (isDraggingRef.current) return;
      
      // Stop auto move if it was moving, or just interrupt stationary state
      setHasBeenDragged(true);

      const fabSize = 168;
      let newX = globalMousePos.current.x - fabSize / 2;
      let newY = globalMousePos.current.y - fabSize / 2;

      // Keep within bounds
      const sidebarWidth = window.innerWidth > 768 ? 260 : 0;
      const minX = sidebarWidth + 20;
      const maxX = window.innerWidth - fabSize - 20;
      const minY = 20;
      const maxY = window.innerHeight - fabSize - 20;

      if (newX < minX) newX = minX;
      if (newX > maxX) newX = maxX;
      if (newY < minY) newY = minY;
      if (newY > maxY) newY = maxY;

      setFabPos({ x: newX, y: newY });
      posRef.current = { x: newX, y: newY };
      
      setCustomBubbleText('Pockie giúp gì được cho bạn không nè ?');
      setShowBubble(true);

      if (spriteRef.current) {
        spriteRef.current.style.transform = '';
      }

      // After 4 seconds, slide back to nearest edge
      setTimeout(() => {
        if (isDraggingRef.current) return; // if user grabbed it during teleport, abort snap
        
        setShowBubble(false);
        setCustomBubbleText('');
        
        setFabPos(prev => {
          const distToLeft = Math.abs(prev.x - minX);
          const distToRight = Math.abs(prev.x - maxX);
          const snappedX = distToLeft < distToRight ? minX : maxX;
          posRef.current = { x: snappedX, y: prev.y };
          return { ...prev, x: snappedX };
        });
      }, 4000);

    }, 90000); // 1 phút 30 giây

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleGlobalMove);
      clearInterval(teleportInterval);
    };
  }, []);

  // Idle animation timer
  useEffect(() => {
    if (hasBeenDragged && !isDragging) {
      setIdleVariant('victory');
    } else {
      setIdleVariant('default');
    }
  }, [hasBeenDragged, isDragging]);

  // Auto-resume movement after being stationary for a while (2 minutes)
  useEffect(() => {
    let resumeTimeout: number | undefined;
    if (hasBeenDragged && !isDragging) {
      resumeTimeout = window.setTimeout(() => {
        setHasBeenDragged(false);
        // Randomize initial velocity when waking up
        velRef.current = { 
          vx: Math.random() > 0.5 ? 1.0 : -1.0, 
          vy: Math.random() > 0.5 ? 1.0 : -1.0 
        };
      }, 120000); // 2 minutes
    }
    return () => clearTimeout(resumeTimeout);
  }, [hasBeenDragged, isDragging]);

  // Dash timer: randomly increase speed for 2s
  useEffect(() => {
    let dashTimeout: number | undefined;
    const dashInterval = setInterval(() => {
      if (hasBeenDragged || isDragging) return;
      
      speedMultiplierRef.current = 3.5; // Tăng tốc độ lên 3.5 lần
      dashTimeout = window.setTimeout(() => {
        speedMultiplierRef.current = 1.0;
      }, 2000);
      
    }, 18000); // Cứ mỗi 18 giây thì tăng tốc 1 lần

    return () => {
      clearInterval(dashInterval);
      clearTimeout(dashTimeout);
      speedMultiplierRef.current = 1.0; // Reset when unmounted/changed
    };
  }, [hasBeenDragged, isDragging]);

  // Loop auto-move
  useEffect(() => {
    if (hasBeenDragged || isDragging) return;

    let rAF = 0;
    const loop = () => {
      const fabSize = 168;
      const sidebarWidth = window.innerWidth > 768 ? 260 : 0;
      const minX = sidebarWidth + 20;
      const maxX = window.innerWidth - fabSize - 20;
      const minY = 20;
      const maxY = window.innerHeight - fabSize - 20;

      let { x, y } = posRef.current;
      let { vx, vy } = velRef.current;
      const speed = speedMultiplierRef.current;

      x += vx * speed;
      y += vy * speed;

      if (x <= minX) { x = minX; vx *= -1; }
      else if (x >= maxX) { x = maxX; vx *= -1; }

      if (y <= minY) { y = minY; vy *= -1; }
      else if (y >= maxY) { y = maxY; vy *= -1; }

      posRef.current = { x, y };
      velRef.current = { vx, vy };

      if (buttonRef.current) {
        buttonRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      
      if (spriteRef.current) {
        // Giảm 60% cường độ nghiêng để trông tự nhiên hơn
        const pitch = (Math.atan2(vy, Math.abs(vx)) * (180 / Math.PI)) * 0.4;
        const scaleX = vx < 0 ? -1 : 1;
        spriteRef.current.style.transform = `scaleX(${scaleX}) rotate(${pitch}deg)`;
      }

      rAF = requestAnimationFrame(loop);
    };

    rAF = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAF);
  }, [hasBeenDragged, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();

    if (!hasBeenDragged) {
      setHasBeenDragged(true);
      setFabPos({ x: posRef.current.x, y: posRef.current.y });
      if (spriteRef.current) {
        spriteRef.current.style.transform = ''; // clear rotation
      }
    }

    setIsDragging(true);
    hasMoved.current = false;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    
    const currentX = hasBeenDragged ? fabPos.x : posRef.current.x;
    const currentY = hasBeenDragged ? fabPos.y : posRef.current.y;
    dragStartPos.current = { x: e.clientX - currentX, y: e.clientY - currentY };
    
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const moveX = Math.abs(e.clientX - dragStartClient.current.x);
    const moveY = Math.abs(e.clientY - dragStartClient.current.y);
    if (moveX > 3 || moveY > 3) {
      hasMoved.current = true;
    }

    if (hasMoved.current) {
      let newX = e.clientX - dragStartPos.current.x;
      let newY = e.clientY - dragStartPos.current.y;

      const fabSize = 168;
      const sidebarWidth = window.innerWidth > 768 ? 260 : 0; // Check for sidebar presence if needed

      if (newX < sidebarWidth + 20) newX = sidebarWidth + 20; 
      if (newX > window.innerWidth - fabSize - 20) newX = window.innerWidth - fabSize - 20;
      if (newY < 20) newY = 20;
      if (newY > window.innerHeight - fabSize - 20) newY = window.innerHeight - fabSize - 20;

      setFabPos({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    // Snap to edge when dropped, regardless of hasMoved if it's the first time, or if moved
    setFabPos(prev => {
      const fabSize = 168;
      const sidebarWidth = window.innerWidth > 768 ? 260 : 0;
      const minX = sidebarWidth + 20;
      const maxX = window.innerWidth - fabSize - 20;

      // Always calculate closest edge
      const distToLeft = Math.abs(prev.x - minX);
      const distToRight = Math.abs(prev.x - maxX);

      return {
        ...prev,
        x: distToLeft < distToRight ? minX : maxX
      };
    });
  };

  const handleFabClick = () => {
    if (!hasMoved.current) {
      trackUserEvent({
        eventName: 'fab_ai_chat_click',
        page: window.location.pathname,
        feature: 'chat',
        payload: { },
      });
      navigate('/ai-chat');
    }
  };

  // Nếu đang ở trang ai-chat thì không hiện
  if (window.location.pathname === '/ai-chat') {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      className={`fab-ai-chat ${isDragging ? 'dragging' : ''} ${!hasBeenDragged ? 'auto-moving' : ''}`}
      title="Chat với Pockie AI"
      onClick={handleFabClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ 
        transform: `translate3d(${hasBeenDragged || isDragging ? fabPos.x : posRef.current.x}px, ${hasBeenDragged || isDragging ? fabPos.y : posRef.current.y}px, 0)`,
      }}
    >
      <div className={`fab-bubble ${showBubble && !isDragging ? 'visible' : ''}`}>
        {customBubbleText || 'Hỏi Pockie !'}
      </div>
      <div className="fab-sprite-container" ref={spriteRef}>
        <PockieSprite size={168} variant={idleVariant} />
      </div>
    </button>
  );
}
