import { Home, MessageSquare, PieChart, Settings, Target, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import './MobileBottomNav.css';

const items = [
  { label: 'Home', to: '/dashboard', icon: Home, end: true },
  { label: 'Wallet', to: '/wallet', icon: Wallet },
  { label: 'Goals', to: '/goals', icon: Target },
  { label: 'Reports', to: '/reports', icon: PieChart },
  { label: 'Me', to: '/settings', icon: Settings },
];

export function MobileBottomNav() {
  return (
    <>
      <NavLink
        to="/ai-chat"
        className={({ isActive }) => `mobile-ai-shortcut${isActive ? ' is-active' : ''}`}
        aria-label="Open AI Chat"
      >
        <MessageSquare size={19} strokeWidth={2.4} />
        <span>AI</span>
      </NavLink>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-bottom-nav__item${isActive ? ' is-active' : ''}`}
          >
            <item.icon size={20} strokeWidth={2.2} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
