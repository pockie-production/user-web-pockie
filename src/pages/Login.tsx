import { useState } from 'react';
import { Link } from 'react-router-dom';
import pockieLogo from '../assets/logo.png';
import logoNav from '../assets/logo_nav.png';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Call API here
    console.log('Login', { email, password });
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="login-page">

      {/* ── LEFT PANEL – Pockie Branding ── */}
      <div className="login-left">
        {/* Decorative background cards */}
        <div className="deco-card deco-card--back" />
        <div className="deco-card deco-card--mid" />
        <div className="deco-card deco-card--front" />

        {/* Content */}
        <div className="login-left__content">
          <p className="login-left__tagline">AI FINANCIAL COMPANION FOR GEN Z</p>

          {/* Logo image */}
          <img
            src={pockieLogo}
            alt="Pockie"
            className="pockie-logo-img"
          />

          <p className="login-left__desc">
            Trợ lý tài chính cá nhân giúp người trẻ ghi chi tiêu,
            <br />hiểu hành vi tiền bạc và nhận gợi ý phù hợp bằng AI.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL – Login Form ── */}
      <div className="login-right">

        {/* Top bar – logo căn giữa toàn bộ panel */}
        <div className="login-right__topbar">
          <img
            src={logoNav}
            alt="Pockie"
            className="login-brand-logo"
          />
        </div>

        <div className="login-form-wrapper">

          {/* Header */}
          <div className="login-form-wrapper__header">
            <h1 className="login-title">Chào mừng trở lại!</h1>
            <p className="login-subtitle">Đăng nhập để tiếp tục quản lý tài chính.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Mật khẩu</label>
              <div className="input-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-field--password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-password-toggle"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20C6 20 1 12 1 12a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c6 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="login-form__meta">
              <label className="toggle-label">
                <input type="checkbox" className="toggle-checkbox" id="remember-me" />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-text">Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary" id="login-submit-btn">
              Đăng nhập
            </button>
          </form>

          {/* Divider */}
          <div className="divider">hoặc</div>

          {/* Google */}
          <button
            type="button"
            className="btn-google"
            id="login-google-btn"
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.2 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.5 16.3 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41.4 35.5 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z" />
            </svg>
            Đăng nhập với Google
          </button>

          {/* Footer */}
          <p className="login-footer">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="login-footer__link">Đăng ký ngay</Link>
          </p>
        </div>

        {/* Bottom bar */}
        <div className="login-right__footer">
          <img src={logoNav} alt="Pockie" className="login-right__footer-logo" />
          <span>© {new Date().getFullYear()} Pockie. All rights reserved.</span>
        </div>
      </div>

    </div>
  );
}
