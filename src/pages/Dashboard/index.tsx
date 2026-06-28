import React, { useState } from 'react';
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
  Coffee,
  CheckCircle2,
  Circle,
  Coffee as CoffeeIcon,
  ShoppingBag,
  Check
} from 'lucide-react';
import mascot from '../../assets/mascot.png';
import logo from '../../assets/logo.png';
import './Dashboard.css';

export default function Dashboard() {
  const menuItems = [
    { name: 'Trang chủ', icon: Home, path: '/dashboard', isBeta: false },
    { name: 'Insights', icon: Lightbulb, path: '/insights', isBeta: false },
    { name: 'Giao dịch', icon: CreditCard, path: '/transactions', isBeta: false },
    { name: 'Ví của tôi', icon: Wallet, path: '/wallet', isBeta: false },
    { name: 'Mục tiêu', icon: Target, path: '/goals', isBeta: false },
    { name: 'Mission', icon: Flag, path: '/mission', isBeta: false },
    { name: 'Báo cáo', icon: PieChart, path: '/reports', isBeta: false },
    { name: 'AI Chat', icon: MessageSquare, path: '/ai-chat', isBeta: true },
  ];

  // Wallet data
  const totalBudget = 3_500_000;
  const spent       = 2_150_000;
  const spentPercent = Math.round((spent / totalBudget) * 100);
  const progressClass =
    spentPercent <= 50 ? 'progress-safe' :
    spentPercent <= 80 ? 'progress-warn'  :
                         'progress-danger';

  // Mission state
  type Mission = { id: number; label: string; xp: number; completed: boolean; confirmMsg?: string };
  const [missions, setMissions] = useState<Mission[]>([
    { id: 1, label: 'Không mua trà sửa', xp: 10, completed: true },
    { id: 2, label: 'Ghi 3 giao dịch',    xp: 10, completed: true },
    { id: 3, label: 'Tiết kiệm 20k',       xp: 10, completed: false,
      confirmMsg: 'Bạn muốn chuyển 20.000đ vào quỹ tiết kiệm ngay bây giờ?' },
  ]);
  const [pendingMission, setPendingMission] = useState<Mission | null>(null);

  const handleMissionClick = (m: Mission) => {
    if (m.completed) return;
    if (m.confirmMsg) {
      setPendingMission(m);
    } else {
      setMissions(prev => prev.map(x => x.id === m.id ? { ...x, completed: true } : x));
    }
  };

  const confirmMission = () => {
    if (!pendingMission) return;
    setMissions(prev => prev.map(x => x.id === pendingMission.id ? { ...x, completed: true } : x));
    setPendingMission(null);
  };

  return (
    <div className="dashboard-layout">
      {/* ── SIDEBAR ── */}
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
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="sidebar-nav-icon" size={20} />
              <span className="sidebar-nav-text">{item.name}</span>
              {item.isBeta && <span className="beta-badge">BETA</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar-wrapper">
              {/* Fallback to simple circle avatar since we don't have user image */}
              <div className="user-avatar">
                <span role="img" aria-label="girl">👧🏻</span>
              </div>
            </div>
            <div className="user-info">
              <div className="user-name">My</div>
              <div className="user-level">
                Lv.12 • <span className="user-xp">2,450 XP</span>
              </div>
              <div className="user-xp-bar">
                <div className="user-xp-fill" style={{ width: '65%' }}></div>
              </div>
            </div>
            <ChevronRight className="user-profile-chevron" size={16} />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-greeting">
            <h1>
              <span className="wave-animation">✌️</span> Chào My!
            </h1>
            <p>Pockie luôn ở đây cùng bạn</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={24} />
              <span className="notification-dot"></span>
            </button>
            <div className="date-selector">
              <Calendar size={18} />
              <span>Thứ 6, 23/05/2026</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* --- ROW 1 --- */}
          {/* Mission & Streak Card */}
          <div className="dashboard-card card-mission col-span-12">
            <div className="mission-section">
              <div className="mission-header">
                <img
                  src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Trophy/3D/trophy_3d.png"
                  alt="🏆"
                  className="mission-icon-3d"
                />
                <h4>Mission hôm nay</h4>
              </div>

              <div className="mission-list">
                {missions.map(m => (
                  <div
                    key={m.id}
                    className={`mission-item ${m.completed ? 'completed' : 'pending'}`}
                    onClick={() => handleMissionClick(m)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleMissionClick(m)}
                  >
                    <div className="mission-item-content">
                      {m.completed
                        ? <CheckCircle2 size={20} className="text-mint" />
                        : <Circle size={20} className="text-muted" />}
                      <span>{m.label}</span>
                    </div>
                    <span className="xp-badge">+{m.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="streak-divider"></div>

            <div className="streak-section">
              <div className="streak-header">
                <img
                  src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Fire/3D/fire_3d.png"
                  alt="🔥"
                  className="streak-flame"
                />
                <span className="streak-title">Streak</span>
              </div>
              <div className="streak-count">
                <strong>7</strong> <span className="streak-count-text">ngày liên tiếp</span>
              </div>
              <div className="streak-calendar">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => (
                  <div key={day} className="streak-day">
                    <span className="day-name">{day}</span>
                    {index < 5 ? (
                      <div className="streak-circle-active">
                        <Check size={14} color="white" strokeWidth={4} />
                      </div>
                    ) : (
                      <div className="streak-circle-inactive"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="streak-reward-divider"></div>
            <div className="streak-reward">
              <div className="reward-icon-wrapper">
                <img
                  src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@latest/assets/Wrapped%20gift/3D/wrapped_gift_3d.png"
                  alt="🎁"
                  className="reward-gift-3d"
                />
              </div>
              <span className="reward-xp-badge">+20 XP</span>
            </div>
          </div>

          {/* --- ROW 2 --- */}
          {/* Financial Mood Card */}
          <div className="dashboard-card card-mood col-span-5">
            <div className="mood-content">
              <div className="mood-header">
                <span className="mood-label">FINANCIAL MOOD</span>
              </div>
              <h2 className="mood-title">
                Hôm nay bạn đang<br />kiểm soát tài chính <strong>rất tốt!</strong>
              </h2>
              <p className="mood-subtitle">Cố gắng giữ vững phong độ nhé!</p>
            </div>
            <img src={mascot} alt="Mascot" className="mood-mascot" />
            <div className="mood-trend-icon">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Wallet Card */}
          <div className="dashboard-card card-wallet col-span-7">
            <div className="wallet-header">
              <div className="wallet-title">
                <Coins size={20} className="wallet-icon" />
                <span>Ví của bạn</span>
              </div>
              <button className="month-selector">
                Tháng 5 <ChevronDown size={16} />
              </button>
            </div>

            <div className="wallet-stats">
              <div className="stat-group">
                <span className="stat-label">Đã chi</span>
                <span className="stat-value">2.150.000đ</span>
              </div>
              <div className="stat-group">
                <span className="stat-label">Còn lại</span>
                <span className="stat-value text-mint">1.350.000đ</span>
              </div>
            </div>

            <div className="wallet-progress-container">
              <div className="wallet-progress-bar">
                <div
                  className={`wallet-progress-fill ${progressClass}`}
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
              <span className={`wallet-progress-text ${progressClass}`}>
                {spentPercent}%
              </span>
            </div>

            <div className="wallet-footer">
              <span>Tổng ngân sách: 3.500.000đ</span>
              <span className="wallet-update">
                Cập nhật 09:30 <RefreshCcw size={12} />
              </span>
            </div>
          </div>

          {/* --- ROW 3 --- */}
          {/* AI Insight Card (Full Width) */}
          <div className="dashboard-card card-insight col-span-12">
            <div className="insight-content">
              <div className="insight-badge">
                <Sparkles size={16} className="insight-icon" />
                <span>AI Insight</span>
              </div>
              <h3 className="insight-title">
                Bạn đang chi cho đồ ăn nhiều hơn <span className="text-mint">32%</span> so với tháng trước.
              </h3>
              <button className="btn-insight-action">
                Xem gợi ý <ChevronRightIcon size={16} />
              </button>
            </div>
            <div className="insight-illustration">
              <div className="insight-sparkline-wrap">
                <span className="insight-sparkline-label">+32%</span>
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
                  </defs>
                  {/* Fill area under line */}
                  <path
                    d="M0,58 L20,50 L40,45 L60,36 L80,28 L100,16 L120,6 L120,70 L0,70 Z"
                    fill="url(#sparkGrad)"
                  />
                  {/* Line */}
                  <polyline
                    points="0,58 20,50 40,45 60,36 80,28 100,16 120,6"
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="spark-line"
                  />
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  {/* End dot */}
                  <circle cx="120" cy="6" r="5" fill="#ef4444" className="spark-dot" />
                  <circle cx="120" cy="6" r="9" fill="#ef444430" className="spark-dot-ring" />
                </svg>
                <span className="insight-sparkline-caption">so với tháng trước</span>
              </div>
            </div>
          </div>

          {/* --- ROW 4 --- */}
          {/* Recent Transactions */}
          <div className="dashboard-card card-transactions col-span-6">
            <div className="card-header-simple">
              <h4>Giao dịch gần đây</h4>
              <a href="/transactions" className="link-view-all text-mint">Xem tất cả</a>
            </div>
            <div className="transaction-list">
              <div className="transaction-item">
                <div className="tx-icon-wrapper bg-mint-light text-mint">
                  <CoffeeIcon size={20} />
                </div>
                <div className="tx-details">
                  <div className="tx-title">Starbucks Coffee</div>
                  <div className="tx-category">
                    <span className="tx-dot"></span> Đồ uống
                  </div>
                </div>
                <div className="tx-time">Hôm nay, 09:15</div>
                <div className="tx-amount text-text-primary">-45.000đ</div>
              </div>
              <div className="transaction-item">
                <div className="tx-icon-wrapper bg-mint-light text-mint">
                  <ShoppingBag size={20} />
                </div>
                <div className="tx-details">
                  <div className="tx-title">Zara Việt Nam</div>
                  <div className="tx-category">
                    <span className="tx-dot"></span> Quần áo
                  </div>
                </div>
                <div className="tx-time">Hôm qua, 18:30</div>
                <div className="tx-amount text-text-primary">-850.000đ</div>
              </div>
            </div>
          </div>

          {/* Spending Categories */}
          <div className="dashboard-card card-categories col-span-6">
            <div className="card-header-simple">
              <h4>Danh mục chi tiêu chính <span className="text-muted font-normal text-sm">(Tháng 5)</span></h4>
              <a href="/categories" className="link-view-all text-mint">Xem tất cả</a>
            </div>
            <div className="category-list">
              <div className="category-item">
                <div className="cat-header">
                  <span className="cat-name"><span role="img" aria-label="burger">🍔</span> Ăn uống</span>
                  <span className="cat-percent">35%</span>
                </div>
                <div className="cat-progress-bar">
                  <div className="cat-progress-fill bg-mint" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div className="category-item">
                <div className="cat-header">
                  <span className="cat-name"><span role="img" aria-label="shirt">👕</span> Quần áo</span>
                  <span className="cat-percent">25%</span>
                </div>
                <div className="cat-progress-bar">
                  <div className="cat-progress-fill bg-mint" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FAB (Floating Action Button) ── */}
      <button className="fab-ai-chat">
        <MessageSquare size={20} />
        <span>Hỏi Pockie...</span>
      </button>

      {/* ── Mission Confirm Popup ── */}
      {pendingMission && (
        <div className="mission-overlay" onClick={() => setPendingMission(null)}>
          <div className="mission-popup" onClick={e => e.stopPropagation()}>
            <div className="mission-popup-icon">
              <img
                src={logo}
                alt="Pockie"
                className="mission-popup-logo"
              />
            </div>
            <h3 className="mission-popup-title">Hoàn thành mission?</h3>
            <p className="mission-popup-msg">{pendingMission.confirmMsg}</p>
            <div className="mission-popup-actions">
              <button className="btn-popup-confirm" onClick={confirmMission}>
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
