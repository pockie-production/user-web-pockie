import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Sparkles, TrendingUp, Target, PiggyBank } from 'lucide-react';
import mascot from '../../assets/mascot.png';
import { PockieSprite } from '../../components/PockieSprite';
import './AiChat.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: 'Phân tích chi tiêu tháng này của tôi' },
  { icon: Target, text: 'Giúp tôi lên kế hoạch tiết kiệm 5 triệu' },
  { icon: PiggyBank, text: 'Tôi nên cắt giảm chi tiêu ở đâu?' },
  { icon: Sparkles, text: 'Gợi ý mục tiêu tài chính cho tôi' },
];

const MockReportView = () => (
  <div style={{ padding: '32px 48px', height: '100%', overflowY: 'auto', background: '#fff' }}>
    <h2 style={{ fontSize: '28px', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Phân tích chi tiêu tháng 5</h2>
    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '40px' }}>Dựa trên dữ liệu giao dịch của bạn</p>
    
    <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
      <div style={{ flex: 1, padding: '24px', background: 'var(--color-cream)', borderRadius: '20px' }}>
        <div style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Tổng chi</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-danger)' }}>2.150.000đ</div>
      </div>
      <div style={{ flex: 1, padding: '24px', background: 'var(--color-cream)', borderRadius: '20px' }}>
        <div style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Ngân sách</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>3.500.000đ</div>
      </div>
    </div>

    <h3 style={{ fontSize: '20px', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Danh mục chi nhiều nhất</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#FFE8D6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍔</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Ăn uống</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>35%</span>
          </div>
          <div style={{ height: '10px', background: 'var(--color-border)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '35%', height: '100%', background: 'var(--color-danger)' }} />
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#E0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👕</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Quần áo</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>25%</span>
          </div>
          <div style={{ height: '10px', background: 'var(--color-border)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: '25%', height: '100%', background: 'var(--color-primary)' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function AiChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockResponse(text.trim()),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const getMockResponse = (input: string): string => {
    const lower = input.toLowerCase();
    if (lower.includes('chi tiêu') || lower.includes('phân tích')) {
      return 'Dựa trên dữ liệu tháng 5, bạn đã chi **2.150.000đ** / 3.500.000đ ngân sách (61%). Danh mục chi nhiều nhất là **Ăn uống (35%)** và **Quần áo (25%)**. Bạn đang chi cho đồ ăn nhiều hơn tháng trước 32% — nên cân nhắc giảm xuống nhé! 🍎';
    }
    if (lower.includes('tiết kiệm') || lower.includes('kế hoạch')) {
      return 'Để tiết kiệm 5 triệu trong 3 tháng, mỗi tháng bạn cần dành ra khoảng **1.667.000đ**. Với ngân sách hiện tại, bạn có thể:\n\n• Giảm ăn ngoài 2 lần/tuần → tiết kiệm ~400k\n• Bỏ trà sữa → tiết kiệm ~200k\n• Giảm mua sắm online → tiết kiệm ~500k\n\nBạn muốn tôi tạo mục tiêu tiết kiệm này không? 🎯';
    }
    if (lower.includes('cắt giảm')) {
      return 'Theo phân tích chi tiêu của bạn, đây là 3 gợi ý cắt giảm hiệu quả nhất:\n\n1. **Đồ ăn bên ngoài** — Bạn đang chi 35% ngân sách, cao hơn mức lý tưởng 25%\n2. **Mua sắm quần áo** — 25% là khá nhiều, cân nhắc giảm xuống 15%\n3. **Đồ uống (trà sữa, cà phê)** — Nhỏ nhưng tích lũy lớn theo thời gian 😊';
    }
    return 'Cảm ơn bạn đã hỏi! Tôi là Pockie AI, trợ lý tài chính cá nhân của bạn. Tôi có thể giúp bạn phân tích chi tiêu, lên kế hoạch tiết kiệm, và đặt mục tiêu tài chính. Bạn muốn bắt đầu từ đâu? ✨';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className={`chat-layout ${!isEmpty ? 'split-view' : ''}`}>
      {/* Workspace Panel (Bên trái) */}
      <div className="agent-workspace-panel">
        {!isEmpty && <MockReportView />}
      </div>

      {/* Chat Panel (Bên phải) */}
      <div className="agent-chat-panel">
        <header className="chat-header">
          <button className="chat-back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div className="chat-header-info">
            <img src={mascot} alt="Pockie" className="chat-header-avatar" />
            <div>
              <div className="chat-header-name">Pockie AI</div>
              <div className="chat-header-status">
                <span className="chat-status-dot" />
                Trợ lý tài chính cá nhân
              </div>
            </div>
          </div>
          <div className="chat-header-badge">BETA</div>
        </header>

        <main className="chat-messages-area">
        {isEmpty ? (
          <div className="chat-welcome">
            <div className="chat-welcome-glow" />

            {/* Dùng PockieSprite thay cho thẻ img */}
            <PockieSprite size={90} className="chat-welcome-sprite" />

            <p className="chat-welcome-subtitle">Trợ lý tài chính thông minh</p>
            <h1 className="chat-welcome-title">Xin chào! Tôi có thể<br />giúp gì cho bạn?</h1>
            <div className="chat-suggestions">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  className="chat-suggestion-chip"
                  onClick={() => sendMessage(p.text)}
                >
                  <p.icon size={16} className="chip-icon" />
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages-list">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <img src={mascot} alt="Pockie" className="chat-bubble-avatar" />
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  <div
                    className="chat-bubble-text"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                  <span className="chat-bubble-time">
                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-message-row assistant">
                <img src={mascot} alt="Pockie" className="chat-bubble-avatar" />
                <div className="chat-bubble assistant chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="chat-input-wrapper">
        {!isEmpty && (
          <div className="chat-suggestions-row">
            {SUGGESTED_PROMPTS.slice(0, 2).map((p, i) => (
              <button key={i} className="chat-suggestion-chip small" onClick={() => sendMessage(p.text)}>
                <p.icon size={13} className="chip-icon" />
                {p.text}
              </button>
            ))}
          </div>
        )}
        <div className="chat-input-bar">
          <button className="chat-attach-btn" aria-label="Đính kèm">
            <Plus size={18} />
          </button>
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Hỏi Pockie về tài chính của bạn..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            aria-label="Gửi"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="chat-disclaimer">Pockie AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.</p>
      </div>
      </div>
    </div>
  );
}
