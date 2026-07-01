import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Plus,
  Sparkles,
  TrendingUp,
  Target,
  PiggyBank,
  Mic,
  Camera,
  ChevronRight,
  MessageSquarePlus,
} from 'lucide-react';
import mascot from '../../assets/mascot.png';
import { PockieSprite } from '../../components/PockieSprite';
import { api } from '../../lib/api';
import Wallet from '../Wallet';
import Goals from '../Goals';
import Reports from '../Reports';
import Settings from '../Settings';
import './AiChat.css';

type WorkspaceType = 'none' | 'wallet' | 'goals' | 'reports' | 'settings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SessionSummary {
  id: string;
  title: string;
  preview: string;
  workspace?: WorkspaceType;
  updatedAt: string;
  createdAt: string;
}

interface SessionMessagesResponse {
  session: {
    id: string;
    title: string;
    workspace?: WorkspaceType;
    createdAt: string;
    updatedAt: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    createdAt: string;
  }>;
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: 'Phân tích chi tiêu tháng này của tôi' },
  { icon: Target, text: 'Giúp tôi lên kế hoạch tiết kiệm 5 triệu' },
  { icon: PiggyBank, text: 'Tôi nên cắt giảm chi tiêu ở đâu?' },
  { icon: Sparkles, text: 'Gợi ý mục tiêu tài chính cho tôi' },
];

interface CategoryExpense {
  name: string;
  percent: number;
  icon: string;
  color: string;
  bgIconColor: string;
}

interface ReportData {
  title?: string;
  subtitle?: string;
  mood?: string;
  insightTitle?: string;
  totalExpense: string;
  budget: string;
  categories: CategoryExpense[];
}

const MockReportView = ({ data }: { data: ReportData }) => (
  <div style={{ padding: '32px 48px', height: '100%', overflowY: 'auto', background: 'var(--app-surface)' }}>
    <h2 style={{ fontSize: '28px', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>{data.title || 'Phân tích chi tiêu'}</h2>
    <p style={{ color: 'var(--app-muted)', marginBottom: '40px' }}>{data.subtitle || 'Được tổng hợp từ dữ liệu giao dịch của bạn'}</p>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--app-primary-soft)', padding: '20px 24px', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--app-line)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ color: 'var(--app-primary-dark)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={14} /> AI Insight
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--app-ink)' }}>
          {data.insightTitle || 'Tình hình chi tiêu đang ở mức trung bình'}
        </div>
        <button style={{ background: 'var(--app-surface)', border: '1px solid var(--app-primary)', color: 'var(--app-primary-dark)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', width: 'max-content' }}>
          Xem gợi ý <ChevronRight size={14} />
        </button>
      </div>

      <div style={{ background: 'var(--app-surface)', padding: '12px', borderRadius: '12px', boxShadow: 'var(--app-shadow)', border: '1px solid var(--app-line)', textAlign: 'center', minWidth: '110px' }}>
        <div style={{ color: 'var(--app-danger)', fontWeight: 800, fontSize: '14px', marginBottom: '8px', letterSpacing: 0 }}>{data.mood || 'NEUTRAL'}</div>
        <svg width="80" height="30" viewBox="0 0 80 30" style={{ overflow: 'visible' }}>
          <path d="M5,25 L20,18 L35,22 L55,10 L75,2" fill="none" stroke="var(--app-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="75" cy="2" r="3" fill="var(--app-danger)" />
        </svg>
        <div style={{ fontSize: '9px', color: 'var(--app-muted)', marginTop: '8px' }}>xu hướng tháng này</div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
      <div style={{ flex: 1, padding: '24px', background: 'var(--app-surface-soft)', borderRadius: '20px', border: '1px solid var(--app-line)' }}>
        <div style={{ fontSize: '15px', color: 'var(--app-muted)', marginBottom: '8px' }}>Tổng chi</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--app-danger)' }}>{data.totalExpense}</div>
      </div>
      <div style={{ flex: 1, padding: '24px', background: 'var(--app-surface-soft)', borderRadius: '20px', border: '1px solid var(--app-line)' }}>
        <div style={{ fontSize: '15px', color: 'var(--app-muted)', marginBottom: '8px' }}>Ngân sách</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--app-primary-dark)' }}>{data.budget}</div>
      </div>
    </div>

    <h3 style={{ fontSize: '20px', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>Danh mục chi nhiều nhất</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {data.categories.map((cat, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: cat.bgIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{cat.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '16px' }}>{cat.name}</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{cat.percent}%</span>
            </div>
            <div style={{ height: '10px', background: 'var(--app-line)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${cat.percent}%`, height: '100%', background: cat.color }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

function mapApiMessages(messages: SessionMessagesResponse['messages']): Message[] {
  return messages
    .filter((message): message is SessionMessagesResponse['messages'][number] & { role: 'user' | 'assistant' } =>
      message.role === 'user' || message.role === 'assistant',
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.createdAt),
    }));
}

export default function AiChat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('none');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/api/v1/ai/report-view');
        setReportData(res.data);
      } catch {
        setReportData(null);
      }
    }

    async function loadSessions() {
      try {
        const res = await api.get<SessionSummary[]>('/api/v1/ai/sessions');
        const nextSessions = Array.isArray(res.data) ? res.data : [];
        setSessions(nextSessions);

        if (nextSessions.length > 0) {
          const firstSessionId = nextSessions[0].id;
          setActiveSessionId(firstSessionId);
          await loadSessionMessages(firstSessionId);
        }
      } finally {
        setIsSessionsLoading(false);
      }
    }

    loadReport();
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  async function loadSessionMessages(sessionId: string) {
    setIsMessagesLoading(true);
    try {
      const res = await api.get<SessionMessagesResponse>(`/api/v1/ai/sessions/${sessionId}/messages`);
      setMessages(mapApiMessages(res.data.messages));
      setWorkspaceType((res.data.session.workspace as WorkspaceType) || 'none');
      setActiveSessionId(sessionId);
    } finally {
      setIsMessagesLoading(false);
    }
  }

  async function refreshSessions(preferredSessionId?: string) {
    const res = await api.get<SessionSummary[]>('/api/v1/ai/sessions');
    const nextSessions = Array.isArray(res.data) ? res.data : [];
    setSessions(nextSessions);

    if (preferredSessionId && nextSessions.some((session) => session.id === preferredSessionId)) {
      setActiveSessionId(preferredSessionId);
    }
  }

  async function createSession() {
    const res = await api.post<{ id: string; title: string; createdAt: string; updatedAt: string }>('/api/v1/ai/sessions');
    const createdSession: SessionSummary = {
      id: res.data.id,
      title: res.data.title,
      preview: '',
      workspace: 'none',
      createdAt: res.data.createdAt,
      updatedAt: res.data.updatedAt,
    };

    setSessions((prev) => [createdSession, ...prev.filter((session) => session.id !== createdSession.id)]);
    setActiveSessionId(createdSession.id);
    setMessages([]);
    setWorkspaceType('none');
    return createdSession.id;
  }

  async function sendMessage(text: string) {
    const trimmedText = text.trim();
    if (!trimmedText || isTyping) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession();
    }

    const optimisticUserMessage: Message = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: trimmedText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post(`/api/v1/ai/sessions/${sessionId}/messages`, { message: trimmedText });
      const assistantPayload = res.data?.message;
      const assistantMessage: Message = {
        id: assistantPayload?.id || `local-assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantPayload?.content || res.data?.reply || 'Pockie AI tạm thời chưa phản hồi được.',
        timestamp: assistantPayload?.createdAt ? new Date(assistantPayload.createdAt) : new Date(),
      };

      setWorkspaceType((res.data?.workspace as WorkspaceType) || 'none');
      setMessages((prev) => [...prev, assistantMessage]);
      await refreshSessions(sessionId);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-assistant-error-${Date.now()}`,
          role: 'assistant',
          content: 'Pockie AI tạm thời chưa phản hồi được. Vui lòng thử lại sau.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;
  const hasWorkspace = !isEmpty && workspaceType !== 'none';

  const renderInputBar = () => (
    <div className={`chat-input-wrapper ${isEmpty ? 'centered-input' : ''}`}>
      {!isEmpty && (
        <div className="chat-suggestions-row">
          {SUGGESTED_PROMPTS.slice(0, 2).map((prompt, index) => (
            <button key={index} className="chat-suggestion-chip small" onClick={() => void sendMessage(prompt.text)}>
              <prompt.icon size={13} className="chip-icon" />
              {prompt.text}
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
          placeholder="Hỏi Pockie..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className="chat-input-actions">
          <button className="chat-action-btn" aria-label="Giọng nói">
            <Mic size={18} />
          </button>
          <button className="chat-action-btn" aria-label="Quét hóa đơn">
            <Camera size={18} />
          </button>
          <button
            className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || isTyping}
            aria-label="Gửi"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
      <p className="chat-disclaimer">Pockie AI có thể mắc lỗi. Vui lòng kiểm tra thông tin quan trọng.</p>
    </div>
  );

  return (
    <div className={`chat-layout ${hasWorkspace ? 'split-view' : ''}`}>
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
          <button className="chat-new-session-btn" onClick={() => void createSession()} aria-label="Tạo cuộc trò chuyện mới">
            <MessageSquarePlus size={16} />
            Cuộc trò chuyện mới
          </button>
          <div className="chat-header-badge">BETA</div>
        </header>

        <div className="chat-session-strip">
          {isSessionsLoading ? (
            <div className="chat-session-empty">Đang tải lịch sử chat...</div>
          ) : sessions.length === 0 ? (
            <div className="chat-session-empty">Chưa có phiên chat nào, hãy bắt đầu câu hỏi đầu tiên.</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`chat-session-chip ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => void loadSessionMessages(session.id)}
              >
                <span className="chat-session-chip-title">{session.title}</span>
                <span className="chat-session-chip-preview">{session.preview || 'Cuộc trò chuyện mới'}</span>
              </button>
            ))
          )}
        </div>

        <main className="chat-messages-area">
          {isEmpty ? (
            <div className="chat-welcome">
              <div className="chat-welcome-glow" />

              <PockieSprite size={120} variant="shy" className="chat-welcome-sprite" />

              <h1 className="chat-welcome-title">Xin chào! Tôi có thể<br />giúp gì cho bạn?</h1>

              {renderInputBar()}
              <div className="chat-suggestions">
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    className="chat-suggestion-chip"
                    onClick={() => void sendMessage(prompt.text)}
                  >
                    <prompt.icon size={16} className="chip-icon" />
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages-list">
              {messages.map((message) => (
                <div key={message.id} className={`chat-message-row ${message.role}`}>
                  {message.role === 'assistant' && (
                    <img src={mascot} alt="Pockie" className="chat-bubble-avatar" />
                  )}
                  <div className={`chat-bubble ${message.role}`}>
                    <div
                      className="chat-bubble-text"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />
                    <span className="chat-bubble-time">
                      {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {(isTyping || isMessagesLoading) && (
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
        {!isEmpty && renderInputBar()}
      </div>

      {hasWorkspace && (
        <div className="agent-workspace-panel">
          <div key={workspaceType} className="workspace-fade-in" style={{ height: '100%', width: '100%' }}>
            {workspaceType === 'reports' && reportData && <MockReportView data={reportData} />}
            {workspaceType === 'wallet' && <Wallet isEmbedded={true} />}
            {workspaceType === 'goals' && <Goals isEmbedded={true} />}
            {workspaceType === 'reports' && !reportData && <Reports isEmbedded={true} />}
            {workspaceType === 'settings' && <Settings isEmbedded={true} />}
          </div>
        </div>
      )}
    </div>
  );
}
