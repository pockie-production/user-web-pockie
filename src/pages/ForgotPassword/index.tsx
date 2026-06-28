import { useState } from 'react';
import { Link } from 'react-router-dom';
import pockieLogo from '../../assets/logo.png';
import logoNav from '../../assets/logo_nav.png';
import { api } from '../../lib/api';
import '../Login/Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await api.post('/api/v1/auth/forgot-password', { email });
      setResetToken(res.data.resetToken || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo link đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
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

      {/* ── RIGHT PANEL – Forgot Password Form ── */}
      <div className="login-right">

        {/* Top bar */}
        <div className="login-right__topbar">
          <img
            src={logoNav}
            alt="Pockie"
            className="login-brand-logo"
          />
        </div>

        <div className="login-form-wrapper">

          {submitted ? (
            /* ── Success State ── */
            <div className="forgot-success">
              <div className="forgot-success__icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </div>
              <h1 className="login-title">Kiểm tra email của bạn</h1>
              <p className="forgot-success__desc">
                Chúng tôi đã gửi link đặt lại mật khẩu đến<br />
                <strong>{email}</strong>.<br /><br />
                Đây là flow mock để test nhanh.
                {resetToken ? (
                  <>
                    <br /><br />
                    Token test:
                    <br />
                    <strong style={{ wordBreak: 'break-all' }}>{resetToken}</strong>
                    <br /><br />
                    <Link to={`/reset-password?token=${resetToken}`}>Mở màn hình reset ngay</Link>
                  </>
                ) : (
                  <>Vui lòng kiểm tra hộp thư đến (và thư mục spam) của bạn.</>
                )}
              </p>
              <Link to="/login" className="btn-primary forgot-success__btn">
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="login-form-wrapper__header">
                {/* Back arrow */}
                <Link to="/login" className="forgot-back-link" aria-label="Quay lại đăng nhập">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Quay lại
                </Link>
                <h1 className="login-title">Quên mật khẩu?</h1>
                <p className="login-subtitle">
                  Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu ngay.
                </p>
              </div>

              {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

              <form onSubmit={handleReset} className="login-form" noValidate>
                <div className="form-group">
                  <label htmlFor="forgot-email" className="form-label">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="btn-primary" id="forgot-submit-btn" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Gửi link đặt lại mật khẩu'}
                </button>
              </form>

              <p className="login-footer">
                Nhớ ra mật khẩu rồi?{' '}
                <Link to="/login" className="login-footer__link">Đăng nhập ngay</Link>
              </p>
            </>
          )}
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
