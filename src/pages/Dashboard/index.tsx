import { useEffect, useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Lightbulb,
  CreditCard,
  Wallet,
  Target,
  Flag,
  PieChart,
  MessageSquare,
  ChevronRight,
  Bell,
  Calendar,
  TrendingUp,
  Coins,
  ChevronDown,
  RefreshCcw,
  Sparkles,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Circle,
  Coffee as CoffeeIcon,
  ShoppingBag,
  Check,
  LogOut,
  Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mascot from '../../assets/mascot.png';
import logo from '../../assets/logo.png';
import { api } from '../../lib/api';
import { trackUserEvent } from '../../lib/analytics';
import { PockieSprite } from '../../components/PockieSprite';
import { emitAuthStateChanged } from '../../lib/authEvents';
import { isExternalAvatarUrl } from '../../lib/profile';
import './Dashboard.css';

type DashboardProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  displayName: string;
  avatarUrl: string | null;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  level: number;
  currentXp: number;
  nextLevelXp: number;
  xpProgressPercent: number;
  authProvider: string;
};

type DashboardMission = {
  id: string;
  title: string;
  description: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  targetValue: number;
  xpReward: number;
  requiresConfirm: boolean;
};

type DashboardResponse = {
  profile: DashboardProfile;
  featureAccess: {
    canUseAI: boolean;
    canUseOCR: boolean;
    canClaimPersonalizedVoucher: boolean;
    reason: string;
  };
  notifications: {
    unreadCount: number;
    items: Array<{
      id: string;
      title: string;
      body: string;
      type: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
  missions: {
    date: string;
    items: DashboardMission[];
  };
  streak: {
    currentDays: number;
    longestDays: number;
    week: Array<{
      date: string;
      completed: boolean;
    }>;
  };
  wallet: {
    month: string;
    totalBudget: number;
    spent: number;
    remaining: number;
    spentPercent: number;
    currency: string;
  };
  insight: {
    mood: string;
    title: string;
    content: string;
    sparkline: number[];
  };
  recentTransactions: Array<{
    id: string;
    title: string;
    category: string;
    icon: string | null;
    amount: number;
    currency: string;
    transactionDate: string;
  }>;
  categoryStats: {
    items: Array<{
      categoryId: string;
      categoryName: string;
      icon: string | null;
      amount: number;
      percent: number;
    }>;
  };
};

const menuItems = [
  { name: 'Trang chủ', icon: Home, path: '/dashboard', isBeta: false },
  { name: 'Ví của tôi', icon: Wallet, path: '/wallet', isBeta: false },
  { name: 'Mục tiêu', icon: Target, path: '/goals', isBeta: false },
  { name: 'Báo cáo', icon: PieChart, path: '/reports', isBeta: false },
  { name: 'AI Chat', icon: MessageSquare, path: '/ai-chat', isBeta: true },
  { name: 'Cài đặt', icon: Settings, path: '/settings', isBeta: false },
];

function formatCurrency(value: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLongDate() {
  const now = new Date();
  const weekday = now.toLocaleDateString('vi-VN', { weekday: 'long' });
  const date = now.toLocaleDateString('vi-VN');
  return `${weekday}, ${date}`;
}

function formatMonthLabel(month: string) {
  const [, monthNumber] = month.split('-');
  return `Tháng ${Number(monthNumber)}`;
}

function formatTransactionTime(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function buildSparklinePath(points: number[]) {
  if (!points.length) {
    return {
      line: '0,58 20,50 40,45 60,36 80,28 100,16 120,6',
      area: 'M0,58 L20,50 L40,45 L60,36 L80,28 L100,16 L120,6 L120,70 L0,70 Z',
      endY: 6,
    };
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? 120 / (points.length - 1) : 120;
  const coords = points.map((point, index) => {
    const x = Math.round(index * step);
    const y = Math.round(58 - ((point - min) / range) * 52);
    return { x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `M${coords.map((point) => `${point.x},${point.y}`).join(' L')} L120,70 L0,70 Z`;

  return {
    line,
    area,
    endY: coords[coords.length - 1]?.y ?? 6,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingMission, setPendingMission] = useState<DashboardMission | null>(null);
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);

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
      const sidebarWidth = 260; // Chiều rộng sidebar

      if (newX < sidebarWidth + 20) newX = sidebarWidth + 20; // Thêm 20px margin cho an toàn
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
        const sidebarWidth = 260;
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
        page: '/dashboard',
        feature: 'chat',
        payload: { canUseAI: featureAccess.canUseAI },
      });
      navigate('/ai-chat');
    }
  };
  // -----------------------------

  const loadDashboard = async () => {
    try {
      setError('');
      const month = new Date().toISOString().slice(0, 7);
      const res = await api.get<DashboardResponse>('/api/v1/dashboard/home', {
        params: { month },
      });
      setDashboard(res.data);
      trackUserEvent({
        eventName: 'dashboard_loaded',
        page: '/dashboard',
        feature: 'finance_dashboard',
        payload: {
          missionCount: res.data.missions.items.length,
          categoryCount: res.data.categoryStats.items.length,
          unreadNotifications: res.data.notifications.unreadCount,
        },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleMissionClick = async (mission: DashboardMission) => {
    if (mission.status === 'COMPLETED' || completingMissionId) return;

    trackUserEvent({
      eventName: 'mission_click',
      page: '/dashboard',
      feature: 'streak',
      payload: {
        missionId: mission.id,
        requiresConfirm: mission.requiresConfirm,
      },
    });

    if (mission.requiresConfirm) {
      setPendingMission(mission);
      return;
    }

    setCompletingMissionId(mission.id);
    try {
      await api.post(`/api/v1/missions/${mission.id}/complete`);
      trackUserEvent({
        eventName: 'mission_completed',
        page: '/dashboard',
        feature: 'streak',
        payload: { missionId: mission.id },
      });
      await loadDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể hoàn thành mission.');
    } finally {
      setCompletingMissionId(null);
    }
  };

  const confirmMission = async () => {
    if (!pendingMission) return;

    setCompletingMissionId(pendingMission.id);
    try {
      await api.post(`/api/v1/missions/${pendingMission.id}/complete`);
      trackUserEvent({
        eventName: 'mission_completed',
        page: '/dashboard',
        feature: 'streak',
        payload: { missionId: pendingMission.id, confirmed: true },
      });
      setPendingMission(null);
      await loadDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể hoàn thành mission.');
    } finally {
      setCompletingMissionId(null);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await api.post('/api/v1/auth/logout', { refreshToken });
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      emitAuthStateChanged();
      navigate('/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main">
          <div className="dashboard-card" style={{ margin: '32px' }}>
            Đang tải dashboard...
          </div>
        </main>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main">
          <div className="dashboard-card" style={{ margin: '32px' }}>
            {error || 'Chưa có dữ liệu dashboard.'}
          </div>
        </main>
      </div>
    );
  }

  const { profile, featureAccess, notifications, missions, streak, wallet, insight, recentTransactions, categoryStats } = dashboard;
  const progressClass =
    wallet.spentPercent <= 50 ? 'progress-safe' :
      wallet.spentPercent <= 80 ? 'progress-warn' :
        'progress-danger';
  const sparkline = buildSparklinePath(insight.sparkline);
  const todayLabel = formatLongDate();
  const userInitial = profile.displayName?.trim()?.charAt(0)?.toUpperCase() || 'U';
  const showAvatarImage = isExternalAvatarUrl(profile.avatarUrl);
  const displayName = profile.displayName || 'Chưa cập nhật tên';
  const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const kycStatus = profile.kycStatus;

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo-container">
          <img src={mascot} alt="Pockie" className="sidebar-mascot" />
          <span className="sidebar-brand">Pockie</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => trackUserEvent({
                eventName: 'sidebar_navigation_click',
                page: '/dashboard',
                feature:
                  item.path === '/ai-chat' ? 'chat' :
                    item.path === '/mission' ? 'streak' :
                      item.path === '/settings' ? 'profile' :
                        'finance_dashboard',
                payload: { targetPath: item.path, label: item.name },
              })}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="sidebar-nav-icon" size={20} />
              <span className="sidebar-nav-text">{item.name}</span>
              {item.isBeta && <span className="beta-badge">BETA</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/settings" className="user-profile">
            <div className="user-avatar-wrapper">
              <div className="user-avatar">
                {showAvatarImage ? (
                  <img src={profile.avatarUrl ?? ''} alt={displayName} className="user-avatar-image" />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
            </div>
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-level">
                Lv.{profile.level} • <span className="user-xp">{profile.currentXp.toLocaleString('vi-VN')} XP</span>
              </div>
              <div className="user-xp-bar">
                <div className="user-xp-fill" style={{ width: `${profile.xpProgressPercent}%` }}></div>
              </div>
            </div>
            <ChevronRight className="user-profile-chevron" size={16} />
          </NavLink>
          <button className="sidebar-logout-btn" type="button" onClick={() => void handleLogout()}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-greeting">
            <h1>
              <span className="wave-animation">✌️</span> Chào {displayName}!
            </h1>
            <p>Pockie luôn ở đây cùng bạn</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications" title={`${notifications.unreadCount} thông báo chưa đọc`}>
              <Bell size={24} />
              {notifications.unreadCount > 0 && <span className="notification-dot"></span>}
            </button>
            <div className="date-selector">
              <Calendar size={18} />
              <span>{todayLabel}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {error && (
            <div className="col-span-12">
              <div className="ekyc-error">{error}</div>
            </div>
          )}

          {(kycStatus === 'NOT_STARTED' || kycStatus === 'REJECTED' || kycStatus === 'EXPIRED') && (
            <div className="col-span-12 ekyc-banner ekyc-banner-warning">
              <div className="ekyc-banner-content">
                <div className="ekyc-banner-icon">
                  <Target size={20} />
                </div>
                <div className="ekyc-banner-text">
                  <h4>Tài khoản chưa được xác thực (eKYC)</h4>
                  <p>Vui lòng hoàn tất định danh để mở khóa toàn bộ tính năng và nhận thêm 500 XP.</p>
                </div>
              </div>
              <NavLink
                to="/ekyc"
                className="ekyc-banner-btn"
                onClick={() => trackUserEvent({
                  eventName: 'ekyc_cta_click',
                  page: '/dashboard',
                  feature: 'ocr',
                  payload: { kycStatus },
                })}
              >
                Xác thực ngay
              </NavLink>
            </div>
          )}

          {kycStatus === 'PENDING' && (
            <div className="col-span-12 ekyc-banner ekyc-banner-pending">
              <div className="ekyc-banner-icon rotating">
                <RefreshCcw size={20} />
              </div>
              <div className="ekyc-banner-text">
                <h4>Hồ sơ đang được chờ duyệt</h4>
                <p>Chúng tôi đang xử lý thông tin eKYC của bạn. Vui lòng quay lại sau.</p>
              </div>
            </div>
          )}

          <div className="dashboard-card card-mission col-span-12">
            <div className="mission-section">
              <div className="mission-header">
                <img
                  src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png"
                  alt="Trophy"
                  className="mission-icon-3d"
                />
                <h4>Mission hôm nay</h4>
              </div>

              <div className="mission-list">
                {missions.items.map((mission) => (
                  <div
                    key={mission.id}
                    className={`mission-item ${mission.status === 'COMPLETED' ? 'completed' : 'pending'}`}
                    onClick={() => void handleMissionClick(mission)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && void handleMissionClick(mission)}
                  >
                    <div className="mission-item-content">
                      {mission.status === 'COMPLETED'
                        ? <CheckCircle2 size={20} className="text-mint" />
                        : <Circle size={20} className="text-muted" />}
                      <span>{mission.title}</span>
                    </div>
                    <span className="xp-badge">+{mission.xpReward} XP</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="streak-divider"></div>

            <div className="streak-section">
              <div className="streak-header">
                <img
                  src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Fire/3D/fire_3d.png"
                  alt="Fire"
                  className="streak-flame"
                />
                <span className="streak-title">Streak</span>
              </div>
              <div className="streak-count">
                <strong>{streak.currentDays}</strong> <span className="streak-count-text">ngày liên tiếp</span>
              </div>
              <div className="streak-calendar">
                {weekLabels.map((day, index) => {
                  const item = streak.week[index];
                  return (
                    <div key={day} className="streak-day">
                      <span className="day-name">{day}</span>
                      {item?.completed ? (
                        <div className="streak-circle-active">
                          <Check size={14} color="white" strokeWidth={4} />
                        </div>
                      ) : (
                        <div className="streak-circle-inactive"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="streak-reward-divider"></div>
            <div className="streak-reward">
              <div className="reward-icon-wrapper">
                <img
                  src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Wrapped%20gift/3D/wrapped_gift_3d.png"
                  alt="Gift"
                  className="reward-gift-3d"
                />
              </div>
              <span className="reward-xp-badge">AI {featureAccess.canClaimPersonalizedVoucher ? 'đã mở khóa' : 'cần eKYC'}</span>
            </div>
          </div>

          <div className="dashboard-card card-mood col-span-5">
            <div className="mood-content">
              <div className="mood-header">
                <span className="mood-label">FINANCIAL MOOD</span>
              </div>
              <h2 className="mood-title">
                {insight.title}
              </h2>
              <p className="mood-subtitle">{insight.content}</p>
            </div>
            <img src={mascot} alt="Mascot" className="mood-mascot" />
            <div className="mood-trend-icon">
              <TrendingUp size={20} />
            </div>
          </div>

          <div className="dashboard-card card-wallet col-span-7">
            <div className="wallet-header">
              <div className="wallet-title">
                <Coins size={20} className="wallet-icon" />
                <span>Ví của bạn</span>
              </div>
              <button className="month-selector">
                {formatMonthLabel(wallet.month)} <ChevronDown size={16} />
              </button>
            </div>

            <div className="wallet-stats">
              <div className="stat-group">
                <span className="stat-label">Đã chi</span>
                <span className="stat-value">{formatCurrency(wallet.spent, wallet.currency)}</span>
              </div>
              <div className="stat-group">
                <span className="stat-label">Còn lại</span>
                <span className="stat-value text-mint">{formatCurrency(wallet.remaining, wallet.currency)}</span>
              </div>
            </div>

            <div className="wallet-progress-container">
              <div className="wallet-progress-bar">
                <div
                  className={`wallet-progress-fill ${progressClass}`}
                  style={{ width: `${wallet.spentPercent}%` }}
                />
              </div>
              <span className={`wallet-progress-text ${progressClass}`}>
                {wallet.spentPercent}%
              </span>
            </div>

            <div className="wallet-footer">
              <span>Tổng ngân sách: {formatCurrency(wallet.totalBudget, wallet.currency)}</span>
              <span className="wallet-update">
                Cập nhật {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} <RefreshCcw size={12} />
              </span>
            </div>
          </div>

          <div className="dashboard-card card-insight col-span-12">
            <div className="insight-content">
              <div className="insight-badge">
                <Sparkles size={16} className="insight-icon" />
                <span>AI Insight</span>
              </div>
              <h3 className="insight-title">
                {insight.title}
              </h3>
              <button className="btn-insight-action">
                Xem gợi ý <ChevronRightIcon size={16} />
              </button>
            </div>
            <div className="insight-illustration">
              <div className="insight-sparkline-wrap">
                <span className="insight-sparkline-label">{insight.mood}</span>
                <svg
                  className="insight-sparkline"
                  viewBox="0 0 120 70"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <path d={sparkline.area} fill="url(#sparkGrad)" />
                  <polyline
                    points={sparkline.line}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="spark-line"
                  />
                  <circle cx="120" cy={sparkline.endY} r="5" fill="#ef4444" className="spark-dot" />
                  <circle cx="120" cy={sparkline.endY} r="9" fill="#ef444430" className="spark-dot-ring" />
                </svg>
                <span className="insight-sparkline-caption">xu hướng tháng này</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card card-transactions col-span-6">
            <div className="card-header-simple">
              <h4>Giao dịch gần đây</h4>
              <a href="/transactions" className="link-view-all text-mint">Xem tất cả</a>
            </div>
            <div className="transaction-list">
              {recentTransactions.length === 0 && <div className="text-muted">Chưa có giao dịch gần đây.</div>}
              {recentTransactions.map((transaction, index) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="tx-icon-wrapper bg-mint-light text-mint">
                    {index % 2 === 0 ? <CoffeeIcon size={20} /> : <ShoppingBag size={20} />}
                  </div>
                  <div className="tx-details">
                    <div className="tx-title">{transaction.title}</div>
                    <div className="tx-category">
                      <span className="tx-dot"></span> {transaction.category}
                    </div>
                  </div>
                  <div className="tx-time">{formatTransactionTime(transaction.transactionDate)}</div>
                  <div className="tx-amount text-text-primary">-{formatCurrency(transaction.amount, transaction.currency)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card card-categories col-span-6">
            <div className="card-header-simple">
              <h4>Danh mục chi tiêu chính <span className="text-muted font-normal text-sm">({formatMonthLabel(wallet.month)})</span></h4>
              <a href="/categories" className="link-view-all text-mint">Xem tất cả</a>
            </div>
            <div className="category-list">
              {categoryStats.items.length === 0 && <div className="text-muted">Chưa có dữ liệu danh mục.</div>}
              {categoryStats.items.slice(0, 4).map((category) => (
                <div key={category.categoryId} className="category-item">
                  <div className="cat-header">
                    <span className="cat-name">
                      <span role="img" aria-label={category.categoryName}>{category.icon || '💸'}</span> {category.categoryName}
                    </span>
                    <span className="cat-percent">{category.percent}%</span>
                  </div>
                  <div className="cat-progress-bar">
                    <div className="cat-progress-fill bg-mint" style={{ width: `${category.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <button
        className={`fab-ai-chat ${isDragging ? 'dragging' : ''}`}
        title="Chat với Pockie AI"
        onClick={handleFabClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ left: fabPos.x, top: fabPos.y }}
      >
        <div className={`fab-bubble ${showBubble && !isDragging ? 'visible' : ''}`}>
          Hỏi Pockie !
        </div>
        <div className="fab-sprite-container">
          <PockieSprite size={168} />
        </div>
      </button>

      {pendingMission && (
        <div className="mission-overlay" onClick={() => setPendingMission(null)}>
          <div className="mission-popup" onClick={(e) => e.stopPropagation()}>
            <div className="mission-popup-icon">
              <img
                src={logo}
                alt="Pockie"
                className="mission-popup-logo"
              />
            </div>
            <h3 className="mission-popup-title">Hoàn thành mission?</h3>
            <p className="mission-popup-msg">
              Bạn muốn xác nhận hoàn thành "{pendingMission.title}" để nhận {pendingMission.xpReward} XP?
            </p>
            <div className="mission-popup-actions">
              <button className="btn-popup-confirm" onClick={() => void confirmMission()} disabled={completingMissionId === pendingMission.id}>
                <CheckCircle2 size={16} /> Xác nhận
              </button>
              <button className="btn-popup-cancel" onClick={() => setPendingMission(null)}>
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
