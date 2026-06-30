import { emitAuthStateChanged } from "../lib/authEvents";
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wallet, Target, PieChart, MessageSquare, Settings, ChevronRight, LogOut, Gift } from 'lucide-react';
import mascot from '../assets/mascot.png';
import { trackUserEvent } from '../lib/analytics';
import { api } from '../lib/api';
import '../pages/Dashboard/Dashboard.css';

const menuItems = [
  { name: 'Trang chủ', icon: Home, path: '/dashboard', isBeta: false },
  { name: 'Ví của tôi', icon: Wallet, path: '/wallet', isBeta: false },
  { name: 'Mục tiêu', icon: Target, path: '/goals', isBeta: false },
  { name: 'Báo cáo', icon: PieChart, path: '/reports', isBeta: false },
  { name: 'AI Chat', icon: MessageSquare, path: '/ai-chat', isBeta: true },
  { name: 'Voucher', icon: Gift, path: '/vouchers', isBeta: false },
  { name: 'Cài đặt', icon: Settings, path: '/settings', isBeta: false },
];

export function Sidebar() {
  const [userProfile, setUserProfile] = useState<{ displayName: string; level: number; currentXp: number; nextLevelXp: number; avatarUrl?: string | null } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.get('/api/v1/users/me');
        setUserProfile(res.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }
    fetchUser();
  }, []);

  const xpPercent = userProfile ? Math.min(100, (userProfile.currentXp / (userProfile.nextLevelXp || 1)) * 100) : 0;

  return (
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
              page: window.location.pathname,
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
            <div className="user-avatar" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="user-avatar-image" />
              ) : (
                <span>{userProfile?.displayName?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>
          <div className="user-info">
            <div className="user-name">{userProfile?.displayName || 'Đang tải...'}</div>
            <div className="user-level">
              Lv.{userProfile?.level || 1} • <span className="user-xp">{userProfile?.currentXp || 0} XP</span>
            </div>
            <div className="user-xp-bar">
              <div className="user-xp-fill" style={{ width: `${xpPercent}%` }}></div>
            </div>
          </div>
          <ChevronRightIcon className="user-profile-chevron" size={16} />
        </NavLink>
        <button className="sidebar-logout-btn" type="button" onClick={async () => {
          const refreshToken = localStorage.getItem('refreshToken');
          try {
            if (refreshToken) {
              await api.post('/api/v1/auth/logout', { refreshToken });
            }
          } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            emitAuthStateChanged();
          }
        }}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

function ChevronRightIcon(props: any) {
  return <ChevronRight {...props} />;
}
