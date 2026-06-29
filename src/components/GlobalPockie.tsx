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
  const velRef = useRef({ vx: -0.4, vy: -0.4 });
  const buttonRef = useRef<HTMLButtonElement>(null);

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

    // Bubble timer: show every 15 seconds (stays for 3s, then hides)
    const bubbleInterval = setInterval(() => {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    }, 15000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(bubbleInterval);
    };
  }, []);

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

      x += vx;
      y += vy;

      if (x <= minX) { x = minX; vx *= -1; }
      else if (x >= maxX) { x = maxX; vx *= -1; }

      if (y <= minY) { y = minY; vy *= -1; }
      else if (y >= maxY) { y = maxY; vy *= -1; }

      posRef.current = { x, y };
      velRef.current = { vx, vy };

      if (buttonRef.current) {
        buttonRef.current.style.left = `${x}px`;
        buttonRef.current.style.top = `${y}px`;
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
    }

    setIsDragging(true);
    hasMoved.current = false;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    
    const currentX = hasBeenDragged ? fabPos.x : posRef.current.x;
    const currentY = hasBeenDragged ? fabPos.y : posRef.current.y;
    dragStartPos.current = { x: e.clientX - currentX, y: e.clientY - currentY };
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

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
        left: hasBeenDragged || isDragging ? fabPos.x : posRef.current.x, 
        top: hasBeenDragged || isDragging ? fabPos.y : posRef.current.y,
        position: 'fixed',
        zIndex: 9999
      }}
    >
      <div className={`fab-bubble ${showBubble && !isDragging ? 'visible' : ''}`}>
        Hỏi Pockie !
      </div>
      <div className="fab-sprite-container">
        <PockieSprite size={168} />
      </div>
    </button>
  );
}
