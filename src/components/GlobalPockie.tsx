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

  useEffect(() => {
    // Khởi tạo vị trí FAB (góc dưới phải)
    setFabPos({ x: window.innerWidth - 188, y: window.innerHeight - 188 });

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

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    hasMoved.current = false;
    dragStartClient.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { x: e.clientX - fabPos.x, y: e.clientY - fabPos.y };
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

    // Snap to edge if moved
    if (hasMoved.current) {
      setFabPos(prev => {
        const fabSize = 168;
        const sidebarWidth = window.innerWidth > 768 ? 260 : 0;
        const minX = sidebarWidth + 20;
        const maxX = window.innerWidth - fabSize - 20;

        const distToLeft = Math.abs(prev.x - minX);
        const distToRight = Math.abs(prev.x - maxX);

        return {
          ...prev,
          x: distToLeft < distToRight ? minX : maxX
        };
      });
    }
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
      className={`fab-ai-chat ${isDragging ? 'dragging' : ''}`}
      title="Chat với Pockie AI"
      onClick={handleFabClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ 
        left: fabPos.x, 
        top: fabPos.y,
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
