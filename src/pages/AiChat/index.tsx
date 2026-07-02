import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Plus,
  Sparkles,
  TrendingUp,
  Target,
  PiggyBank,
  ChevronRight,
  MessageSquarePlus,
  Menu,
  X,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import mascot from '../../assets/mascot.png';
import { PockieSprite } from '../../components/PockieSprite';
import { api } from '../../lib/api';
import Wallet from '../Wallet';
import Goals from '../Goals';
import Reports from '../Reports';
import Settings from '../Settings';
import Vouchers from '../Vouchers';
import { AssistantMessageContent, type ChatMessageMetadata } from './AssistantMessageContent';
import './AiChat.css';

type WorkspaceType = 'none' | 'wallet' | 'goals' | 'reports' | 'settings' | 'vouchers';
type ActiveWorkspaceType = Exclude<WorkspaceType, 'none'>;

interface CopilotAction {
  workspace: ActiveWorkspaceType;
  target: string;
  selector: string;
  label: string;
  status: string;
  click?: boolean;
  requiresConfirmation?: boolean;
}

interface CopilotCursorState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  clicking: boolean;
}

interface CopilotHighlightState {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
  isError?: boolean;
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
    metadata?: ChatMessageMetadata;
    createdAt: string;
  }>;
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: 'Phân tích chi tiêu tháng này của tôi' },
  { icon: Target, text: 'Giúp tôi lên kế hoạch tiết kiệm 5 triệu' },
  { icon: PiggyBank, text: 'Tôi nên cắt giảm chi tiêu ở đâu?' },
  { icon: Sparkles, text: 'Gợi ý mục tiêu tài chính cho tôi' },
];

const WORKSPACE_ACTIONS: Record<ActiveWorkspaceType, CopilotAction> = {
  wallet: {
    workspace: 'wallet',
    target: 'wallet_overview',
    selector: '.wallet-page',
    label: 'Ví của bạn',
    status: 'Pockie đang mở Ví để xem tài sản và dòng tiền.',
  },
  goals: {
    workspace: 'goals',
    target: 'goals_overview',
    selector: '.goals-page',
    label: 'Mục tiêu',
    status: 'Pockie đang mở khu vực mục tiêu và nhiệm vụ.',
  },
  reports: {
    workspace: 'reports',
    target: 'reports_overview',
    selector: '.reports-page, .workspace-fade-in',
    label: 'Báo cáo',
    status: 'Pockie đang mở báo cáo để soi dòng tiền.',
  },
  settings: {
    workspace: 'settings',
    target: 'settings_profile',
    selector: '.settings-form, .settings-page',
    label: 'Thông tin cá nhân',
    status: 'Pockie đang mở cài đặt tài khoản.',
  },
  vouchers: {
    workspace: 'vouchers',
    target: 'vouchers_overview',
    selector: '.vouchers-page',
    label: 'Voucher',
    status: 'Pockie đang mở kho voucher và ưu đãi.',
  },
};

const TARGET_ACTIONS: Record<string, CopilotAction> = {
  smart_scan: {
    workspace: 'wallet',
    target: 'smart_scan',
    selector: '.btn-scan',
    label: 'Smart Scan',
    status: 'Pockie đang mở Smart Scan để quét hóa đơn.',
    click: true,
  },
  scan_receipt: {
    workspace: 'wallet',
    target: 'smart_scan',
    selector: '.btn-scan',
    label: 'Smart Scan',
    status: 'Pockie đang mở Smart Scan để quét hóa đơn.',
    click: true,
  },
  add_transaction: {
    workspace: 'wallet',
    target: 'add_transaction',
    selector: '.btn-add-tx',
    label: 'Thêm giao dịch',
    status: 'Pockie đã tìm nút thêm giao dịch. Bước ghi dữ liệu cần bạn xác nhận.',
    click: true,
    requiresConfirmation: true,
  },
  add_wallet: {
    workspace: 'wallet',
    target: 'add_wallet',
    selector: '.btn-add-wallet',
    label: 'Thêm ví',
    status: 'Pockie đã tìm nút thêm ví. Bước tạo ví cần bạn xác nhận.',
    click: true,
    requiresConfirmation: true,
  },
  missions: {
    workspace: 'goals',
    target: 'missions',
    selector: '.missions-grid, .banner-btn',
    label: 'Nhiệm vụ hôm nay',
    status: 'Pockie đang mở danh sách nhiệm vụ hôm nay.',
  },
  all_missions: {
    workspace: 'goals',
    target: 'all_missions',
    selector: '.banner-btn',
    label: 'Xem tất cả nhiệm vụ',
    status: 'Pockie đang mở toàn bộ nhiệm vụ.',
    click: true,
  },
  report_categories: {
    workspace: 'reports',
    target: 'report_categories',
    selector: '.progress-list, .donut-chart-wrapper, .reports-page',
    label: 'Danh mục chi tiêu',
    status: 'Pockie đang trỏ vào phần danh mục chi tiêu.',
  },
  voucher_search: {
    workspace: 'vouchers',
    target: 'voucher_search',
    selector: '.search-box input',
    label: 'Tìm voucher',
    status: 'Pockie đang mở ô tìm kiếm voucher.',
  },
  voucher_detail: {
    workspace: 'vouchers',
    target: 'voucher_detail',
    selector: '.voucher-card',
    label: 'Chi tiết voucher',
    status: 'Pockie đang mở voucher đầu tiên để xem chi tiết.',
    click: true,
  },
  profile_settings: {
    workspace: 'settings',
    target: 'profile_settings',
    selector: '.settings-form',
    label: 'Hồ sơ cá nhân',
    status: 'Pockie đang trỏ vào form thông tin cá nhân.',
  },
};

const COPILOT_DIRECTIVE_PATTERN =
  /\[\[(?:pockie|copilot|ui):[^\]]+\]\]|\[CMD:[^\]]+\]|\[POCKIE_ACTION[^\]]+\]/gi;

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
      metadata: message.metadata,
      timestamp: new Date(message.createdAt),
    }));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeForIntent(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function stripCopilotDirectives(content: string) {
  return content.replace(COPILOT_DIRECTIVE_PATTERN, '').replace(/\n{3,}/g, '\n\n').trim();
}

function getWorkspaceAction(value: unknown): CopilotAction | null {
  if (typeof value !== 'string') return null;
  const key = normalizeForIntent(value).replace(/[^a-z0-9_-]/g, '') as ActiveWorkspaceType;
  return key in WORKSPACE_ACTIONS ? WORKSPACE_ACTIONS[key] : null;
}

function getTargetAction(value: unknown): CopilotAction | null {
  if (typeof value !== 'string') return null;

  const normalized = normalizeForIntent(value)
    .replace(/^(open|show|go_to|goto|click|highlight|switch|view)[_\s:-]+/, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (normalized in TARGET_ACTIONS) {
    return TARGET_ACTIONS[normalized];
  }

  return getWorkspaceAction(normalized);
}

function getCopilotActionFromMetadata(metadata?: ChatMessageMetadata | null) {
  if (!metadata) return null;

  const rawAction =
    metadata.copilotAction ??
    metadata.uiAction ??
    metadata.action ??
    metadata.workspaceAction;

  if (typeof rawAction === 'string') {
    return getTargetAction(rawAction);
  }

  if (isPlainRecord(rawAction)) {
    return (
      getTargetAction(rawAction.target) ??
      getTargetAction(rawAction.name) ??
      getWorkspaceAction(rawAction.workspace) ??
      null
    );
  }

  return getWorkspaceAction(metadata.workspace);
}

function getCopilotActionFromDirectives(content: string) {
  const cmdMatch = content.match(/\[CMD:([A-Z_]+):([a-z0-9_-]+)\]/i);
  if (cmdMatch) {
    const [, command, target] = cmdMatch;
    if (/WORKSPACE|PAGE/i.test(command)) {
      return getWorkspaceAction(target) ?? getTargetAction(target);
    }
    return getTargetAction(target);
  }

  const attributeMatch = content.match(/\[POCKIE_ACTION([^\]]+)\]/i);
  if (attributeMatch) {
    const attrs = attributeMatch[1];
    const target = attrs.match(/target=["']?([a-z0-9_-]+)["']?/i)?.[1];
    const workspace = attrs.match(/workspace=["']?([a-z0-9_-]+)["']?/i)?.[1];
    return getTargetAction(target) ?? getWorkspaceAction(workspace);
  }

  const compactMatch = content.match(/\[\[(?:pockie|copilot|ui):([a-z0-9_:-]+)\]\]/i);
  if (compactMatch) {
    const parts = compactMatch[1].split(':').filter(Boolean);
    return getTargetAction(parts.at(-1)) ?? getWorkspaceAction(parts.at(-1));
  }

  return null;
}

function inferCopilotActionFromText(text: string) {
  const normalized = normalizeForIntent(text);

  if (/(smart\s*scan|scan|quet|hoa don|bien lai|receipt|camera)/.test(normalized)) {
    return TARGET_ACTIONS.smart_scan;
  }

  if (/(them|nhap|ghi).{0,18}(giao dich|khoan chi|khoan thu)/.test(normalized)) {
    return TARGET_ACTIONS.add_transaction;
  }

  if (/(them|lien ket|tao).{0,18}(vi|tai khoan|ngan hang)/.test(normalized)) {
    return TARGET_ACTIONS.add_wallet;
  }

  if (/(voucher|uu dai|ma giam|khuyen mai|coupon)/.test(normalized)) {
    return normalized.includes('tim') ? TARGET_ACTIONS.voucher_search : WORKSPACE_ACTIONS.vouchers;
  }

  if (/(tat ca nhiem vu|danh sach nhiem vu|all missions)/.test(normalized)) {
    return TARGET_ACTIONS.all_missions;
  }

  if (/(nhiem vu|mission|xp|streak|phan thuong|muc tieu|tiet kiem)/.test(normalized)) {
    return WORKSPACE_ACTIONS.goals;
  }

  if (/(danh muc|bao cao|thong ke|phan tich|bao bieu|report|chi tieu thang|dong tien thang)/.test(normalized)) {
    return normalized.includes('danh muc') ? TARGET_ACTIONS.report_categories : WORKSPACE_ACTIONS.reports;
  }

  if (/(cai dat|ho so|profile|thong tin ca nhan|ekyc|kyc|gioi tinh)/.test(normalized)) {
    return TARGET_ACTIONS.profile_settings;
  }

  if (/(vi|so du|tai san|dong tien|thu nhap|chi tieu|tien trong)/.test(normalized)) {
    return WORKSPACE_ACTIONS.wallet;
  }

  return null;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopilotMode, setIsCopilotMode] = useState(false);
  const [copilotStatus, setCopilotStatus] = useState('Pockie đang chờ lệnh để thao tác giao diện.');
  const [cursorState, setCursorState] = useState<CopilotCursorState>({
    visible: false,
    x: 72,
    y: 72,
    label: '',
    clicking: false,
  });
  const [highlightState, setHighlightState] = useState<CopilotHighlightState | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copilotTimeoutsRef = useRef<number[]>([]);
  const lastCopilotActionRef = useRef<string | null>(null);

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

  useEffect(() => {
    return () => {
      copilotTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      copilotTimeoutsRef.current = [];
    };
  }, []);

  function delay(ms: number) {
    return new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(() => {
        copilotTimeoutsRef.current = copilotTimeoutsRef.current.filter((id) => id !== timeoutId);
        resolve();
      }, ms);
      copilotTimeoutsRef.current.push(timeoutId);
    });
  }

  async function waitForElement(selector: string) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) return element;
      await delay(90);
    }
    return null;
  }

  async function moveCursorToElement(selector: string, label: string, click = false) {
    const element = await waitForElement(selector);
    if (!element) {
      setCopilotStatus('Pockie chưa tìm thấy đúng vùng giao diện, tui sẽ dừng để tránh bấm nhầm.');
      setHighlightState(null);
      return false;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    await delay(280);

    const rect = element.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + Math.min(rect.height / 2, 120));
    setCursorState({ visible: true, x, y, label, clicking: false });
    setHighlightState({
      x: Math.max(8, Math.round(rect.left - 8)),
      y: Math.max(8, Math.round(rect.top - 8)),
      width: Math.round(rect.width + 16),
      height: Math.round(rect.height + 16),
      label,
    });

    await delay(420);

    if (click) {
      setCursorState((prev) => ({ ...prev, clicking: true }));
      await delay(170);
      element.click();
      setCursorState((prev) => ({ ...prev, clicking: false }));
      await delay(280);
    }

    return true;
  }

  async function runCopilotAction(action: CopilotAction | null) {
    if (!action) return;

    const signature = `${action.workspace}:${action.target}`;
    if (lastCopilotActionRef.current === signature) return;

    lastCopilotActionRef.current = signature;
    setIsCopilotMode(true);
    setIsSidebarOpen(false);
    setCopilotStatus(action.status);
    setWorkspaceType(action.workspace);
    setCursorState((prev) => ({ ...prev, visible: true, label: action.label }));
    setHighlightState(null);

    await delay(360);

    const workspaceAction = WORKSPACE_ACTIONS[action.workspace];
    await moveCursorToElement(workspaceAction.selector, workspaceAction.label);

    if (action.selector !== workspaceAction.selector) {
      await moveCursorToElement(action.selector, action.label, action.click && !action.requiresConfirmation);
    }

    if (action.requiresConfirmation) {
      setCopilotStatus(`${action.status} Bồ xem lại rồi tự bấm xác nhận giúp tui nha.`);
      void delay(2500).then(() => {
        if (lastCopilotActionRef.current === signature) {
          lastCopilotActionRef.current = null;
        }
      });
      return;
    }

    setCopilotStatus(`Xong bước "${action.label}". Bồ muốn tui xử lý tiếp phần nào nữa?`);
    void delay(2500).then(() => {
      if (lastCopilotActionRef.current === signature) {
        lastCopilotActionRef.current = null;
      }
    });
  }

  async function loadSessionMessages(sessionId: string) {
    setIsMessagesLoading(true);
    try {
      const res = await api.get<SessionMessagesResponse>(`/api/v1/ai/sessions/${sessionId}/messages`);
      setMessages(mapApiMessages(res.data.messages));
      const sessionWorkspaceAction = getWorkspaceAction(res.data.session.workspace);
      setWorkspaceType(sessionWorkspaceAction?.workspace || 'none');
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
    setIsCopilotMode(false);
    setHighlightState(null);
    lastCopilotActionRef.current = null;
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
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
    void runCopilotAction(inferCopilotActionFromText(trimmedText));

    try {
      const res = await api.post(`/api/v1/ai/sessions/${sessionId}/messages`, { message: trimmedText });
      const assistantPayload = res.data?.message;
      const assistantMessage: Message = {
        id: assistantPayload?.id || `local-assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantPayload?.content || res.data?.reply || 'Pockie AI tạm thời chưa phản hồi được.',
        metadata: assistantPayload?.metadata,
        timestamp: assistantPayload?.createdAt ? new Date(assistantPayload.createdAt) : new Date(),
      };

      const responseWorkspaceAction = getWorkspaceAction(res.data?.workspace);
      const responseAction =
        getCopilotActionFromMetadata(assistantMessage.metadata) ??
        getCopilotActionFromDirectives(assistantMessage.content) ??
        responseWorkspaceAction;

      if (responseWorkspaceAction && !responseAction) {
        setWorkspaceType(responseWorkspaceAction.workspace);
      }
      setMessages((prev) => [...prev, assistantMessage]);
      void runCopilotAction(responseAction);
      await refreshSessions(sessionId);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-assistant-error-${Date.now()}`,
          role: 'assistant',
          content: 'Pockie AI tạm thời chưa phản hồi được. Vui lòng thử lại sau.',
          timestamp: new Date(),
          isError: true,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const msg = `[Đã tải lên hóa đơn: ${file.name}] Phân tích hóa đơn này giúp tôi.`;
      void sendMessage(msg);
    }
  };

  const handleRetry = () => {
    // Find last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      void sendMessage(lastUserMessage.content);
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
          {/* File Upload Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            accept="image/*,.pdf"
          />
          <button className="chat-action-btn" aria-label="Tải lên ảnh" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon size={18} />
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
    <div className={`chat-layout ${hasWorkspace ? 'split-view' : ''} ${isCopilotMode ? 'copilot-mode' : ''}`}>
      
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && <div className="chat-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* Sidebar History */}
      <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="chat-new-session-btn" onClick={() => void createSession()} aria-label="Tạo cuộc trò chuyện mới">
            <MessageSquarePlus size={16} />
            Phiên chat mới
          </button>
          <button className="sidebar-close-btn mobile-only" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-sessions">
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
                onClick={() => {
                  void loadSessionMessages(session.id);
                  if (window.innerWidth <= 768) {
                    setIsSidebarOpen(false);
                  }
                }}
              >
                <span className="chat-session-chip-title">{session.title}</span>
                <span className="chat-session-chip-preview">{session.preview || 'Cuộc trò chuyện mới'}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="agent-chat-panel">
        <header className="chat-header">
          <button className="chat-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
          </button>
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

        {isCopilotMode && (
          <div className="copilot-status-bar">
            <div className="copilot-status-copy">
              <Sparkles size={15} />
              <span>{copilotStatus}</span>
            </div>
            <button
              type="button"
              className="copilot-stop-btn"
              onClick={() => {
                setIsCopilotMode(false);
                setHighlightState(null);
                setCursorState((prev) => ({ ...prev, visible: false, clicking: false }));
              }}
            >
              Dừng
            </button>
          </div>
        )}

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
                  <div className={`chat-bubble ${message.role} ${message.isError ? 'error' : ''}`}>
                    <div className="chat-bubble-text markdown-body">
                      {message.role === 'assistant' ? (
                        <AssistantMessageContent
                          content={stripCopilotDirectives(message.content)}
                          metadata={message.metadata}
                          onQuickReply={(nextMessage) => void sendMessage(nextMessage)}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.isError && (
                      <button className="chat-retry-btn" onClick={handleRetry}>
                        <RotateCcw size={12} /> Thử lại
                      </button>
                    )}
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
          <div className="workspace-mobile-header mobile-only">
            <button className="workspace-close-btn" onClick={() => setWorkspaceType('none')}>
              <X size={20} /> Đóng không gian làm việc
            </button>
          </div>
          <div key={workspaceType} className="workspace-fade-in" style={{ height: '100%', width: '100%', overflowY: 'auto' }}>
            {workspaceType === 'reports' && reportData && <MockReportView data={reportData} />}
            {workspaceType === 'wallet' && <Wallet isEmbedded={true} />}
            {workspaceType === 'goals' && <Goals isEmbedded={true} />}
            {workspaceType === 'reports' && !reportData && <Reports isEmbedded={true} />}
            {workspaceType === 'settings' && <Settings isEmbedded={true} />}
            {workspaceType === 'vouchers' && <Vouchers isEmbedded={true} />}
          </div>
        </div>
      )}

      {highlightState && (
        <div
          className="copilot-highlight-ring"
          style={{
            transform: `translate3d(${highlightState.x}px, ${highlightState.y}px, 0)`,
            width: highlightState.width,
            height: highlightState.height,
          }}
        >
          <span>{highlightState.label}</span>
        </div>
      )}

      {cursorState.visible && (
        <div
          className={`copilot-ghost-cursor ${cursorState.clicking ? 'is-clicking' : ''}`}
          style={{ transform: `translate3d(${cursorState.x}px, ${cursorState.y}px, 0)` }}
        >
          <div className="copilot-cursor-shape" />
          {cursorState.label && <span className="copilot-cursor-label">{cursorState.label}</span>}
        </div>
      )}
    </div>
  );
}
