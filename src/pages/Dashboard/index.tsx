import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Target,
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mascot from '../../assets/mascot.png';
import logo from '../../assets/logo.png';
import { api } from '../../lib/api';
import { trackUserEvent } from '../../lib/analytics';
import { Sidebar } from '../../components/Sidebar';
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

type LegacyTransaction = {
  id: string;
  title: string;
  date?: string;
  amount?: number | string;
  type?: 'expense' | 'income';
  category?: string;
  currency?: string;
  transactionDate?: string;
};

type LegacyCategoryStat = {
  id?: string;
  categoryId?: string;
  name?: string;
  categoryName?: string;
  iconUrl?: string | null;
  icon?: string | null;
  amount: number | string;
  percent: number;
};


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

function formatMonthLabel(month?: string) {
  if (!month) return 'Tháng này';
  const [, monthNumber] = month.split('-');
  return `Tháng ${Number(monthNumber)}`;
}

function formatTransactionTime(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Khong ro thoi gian';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function parseLegacyAmount(value: number | string | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.abs(value);
  if (typeof value !== 'string') return 0;

  const digits = value.replace(/[^\d-]/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function parseLegacyTransactionDate(value?: string) {
  if (!value) return new Date().toISOString();

  const normalized = value.trim();
  if (!normalized) return new Date().toISOString();

  const todayMatch = normalized.match(/^H[oô]m nay,\s*(\d{1,2}):(\d{2})$/i);
  if (todayMatch) {
    const result = new Date();
    result.setHours(Number(todayMatch[1]), Number(todayMatch[2]), 0, 0);
    return result.toISOString();
  }

  const yesterdayMatch = normalized.match(/^H[oô]m qua,\s*(\d{1,2}):(\d{2})$/i);
  if (yesterdayMatch) {
    const result = new Date();
    result.setDate(result.getDate() - 1);
    result.setHours(Number(yesterdayMatch[1]), Number(yesterdayMatch[2]), 0, 0);
    return result.toISOString();
  }

  const fullDateMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{1,2}):(\d{2})$/);
  if (fullDateMatch) {
    const [, day, month, year, hour, minute] = fullDateMatch;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0
    ).toISOString();
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeDashboardResponse(input: Omit<DashboardResponse, 'recentTransactions' | 'categoryStats'> & {
  recentTransactions?: LegacyTransaction[];
  categoryStats?: { items?: LegacyCategoryStat[] } | LegacyCategoryStat[];
}) {
  const recentTransactions = Array.isArray(input.recentTransactions)
    ? input.recentTransactions.map((transaction) => ({
      id: transaction.id,
      title: transaction.title,
      category:
        transaction.category ||
        (transaction.type === 'income' ? 'Thu nhap' : 'Chi tieu'),
      icon: null,
      amount: parseLegacyAmount(transaction.amount),
      currency: transaction.currency || 'VND',
      transactionDate: transaction.transactionDate || parseLegacyTransactionDate(transaction.date),
    }))
    : [];

  const rawCategoryStats = Array.isArray(input.categoryStats)
    ? input.categoryStats
    : input.categoryStats?.items || [];

  const categoryStats = {
    items: rawCategoryStats.map((category) => ({
      categoryId: category.categoryId || category.id || crypto.randomUUID(),
      categoryName: category.categoryName || category.name || 'Khac',
      icon: category.icon || null,
      amount: typeof category.amount === 'number' ? category.amount : parseLegacyAmount(category.amount),
      percent: category.percent,
    })),
  };

  return {
    ...input,
    recentTransactions,
    categoryStats,
  } satisfies DashboardResponse;
}

function buildSparklinePath(points: number[]) {
  if (!points || points.length === 0) return { line: '', endY: 0 };
  if (points.length === 1) {
    return {
      line: '5,25 20,18 35,22 55,10 75,2',
      endY: 2,
    };
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? 70 / (points.length - 1) : 70;
  const coords = points.map((point, index) => {
    const x = Math.round(5 + index * step);
    const y = Math.round(25 - ((point - min) / range) * 23);
    return { x, y };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');

  return {
    line,
    endY: coords[coords.length - 1]?.y ?? 2,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingMission, setPendingMission] = useState<DashboardMission | null>(null);
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setError('');
      const month = new Date().toISOString().slice(0, 7);
      const res = await api.get<DashboardResponse>('/api/v1/dashboard/home', {
        params: { month },
      });
      const normalized = normalizeDashboardResponse(res.data as DashboardResponse & {
        recentTransactions?: LegacyTransaction[];
        categoryStats?: { items?: LegacyCategoryStat[] } | LegacyCategoryStat[];
      });
      setDashboard(normalized);
      trackUserEvent({
        eventName: 'dashboard_loaded',
        page: '/dashboard',
        feature: 'finance_dashboard',
        payload: {
          missionCount: normalized.missions.items.length,
          categoryCount: normalized.categoryStats.items.length,
          unreadNotifications: normalized.notifications.unreadCount,
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
  const displayName = profile.displayName || 'Chưa cập nhật tên';
  const weekLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const kycStatus = profile.kycStatus;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      {/* NỘI DUNG CHÍNH */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-greeting">
            <h1>
              <span className="wave-animation">✌️</span> Chào {displayName}!
            </h1>
            <p>Pockie luôn ở đây cùng bạn</p>
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="icon-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={24} />
                {notifications.unreadCount > 0 && <span className="notification-dot"></span>}
              </button>
              {showNotifications && (
                <div className="notifications-popup">
                  <div className="notif-item">
                    <div className="notif-icon">🎁</div>
                    <div className="notif-content">
                      <h4>Ưu đãi mới</h4>
                      <p>Vietcombank đang có ưu đãi 15% cho khách hàng mở thẻ đầu tiên</p>
                      <span className="notif-time">Vừa xong</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

          <div 
            className="dashboard-card card-wallet col-span-7" 
            onClick={() => navigate('/wallet')} 
            style={{ cursor: 'pointer' }}
          >
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
                  viewBox="0 0 80 30"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <polyline
                    points={sparkline.line}
                    fill="none"
                    stroke="#FF4D4F"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="spark-line"
                  />
                  <circle cx="75" cy={sparkline.endY} r="3" fill="#FF4D4F" className="spark-dot" />
                </svg>
                <div className="insight-sparkline-text">xu hướng tháng này</div>
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
