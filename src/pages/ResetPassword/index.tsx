import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import pockieLogo from '../../assets/logo.png';
import logoNav from '../../assets/logo_nav.png';
import { api } from '../../lib/api';
import '../Login/Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/v1/auth/reset-password', {
        token,
        newPassword,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  // ── Left panel (shared across all auth pages) ──
  const LeftPanel = () => (
    <div className="login-left">
      <div className="deco-card deco-card--back" />
      <div className="deco-card deco-card--mid" />
      <div className="deco-card deco-card--front" />
      <div className="login-left__content">
        <p className="login-left__tagline">AI FINANCIAL COMPANION FOR GEN Z</p>
        <img src={pockieLogo} alt="Pockie" className="pockie-logo-img" />
        <p className="login-left__desc">
          Trợ lý tài chính cá nhân giúp người trẻ ghi chi tiêu,
          <br />hiểu hành vi tiền bạc và nhận gợi ý phù hợp bằng AI.
        </p>
      </div>
    </div>
  );

  // ── Invalid / missing token ──
  if (!token) {
    return (
      <div className="login-page">
        <LeftPanel />
        <div className="login-right">
          <div className="login-right__topbar">
            <img src={logoNav} alt="Pockie" className="login-brand-logo" />
          </div>

          <div className="login-form-wrapper">
            <div className="forgot-success">
              <div className="forgot-success__icon reset-invalid__icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="login-title">Link không hợp lệ</h1>
              <p className="forgot-success__desc">
                Link đặt lại mật khẩu này đã hết hạn hoặc không hợp lệ.<br /><br />
                Vui lòng yêu cầu một link mới.
              </p>
              <Link to="/forgot-password" className="btn-primary forgot-success__btn">
                Yêu cầu link mới
              </Link>
              <p className="login-footer" style={{ marginTop: 0 }}>
                <Link to="/login" className="login-footer__link">Quay lại đăng nhập</Link>
              </p>
            </div>
          </div>

          <div className="login-right__footer">
            <img src={logoNav} alt="Pockie" className="login-right__footer-logo" />
            <span>© {new Date().getFullYear()} Pockie. All rights reserved.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <LeftPanel />

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div className="login-right__topbar">
          <img src={logoNav} alt="Pockie" className="login-brand-logo" />
        </div>

        <div className="login-form-wrapper">

          {submitted ? (
            /* ── Success State ── */
            <div className="forgot-success">
              <div className="forgot-success__icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="login-title">Đặt lại mật khẩu thành công!</h1>
              <p className="forgot-success__desc">
                Mật khẩu của bạn đã được cập nhật.<br /><br />
                Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link to="/login" className="btn-primary forgot-success__btn">
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="login-form-wrapper__header">
                <Link to="/login" className="forgot-back-link" aria-label="Quay lại đăng nhập">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Quay lại
                </Link>
                <h1 className="login-title">Đặt mật khẩu mới</h1>
                <p className="login-subtitle">
                  Mật khẩu mới phải khác mật khẩu cũ của bạn.
                </p>
              </div>

              {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

              <form onSubmit={handleReset} className="login-form" noValidate>

                <div className="form-group">
                  <label htmlFor="reset-new-password" className="form-label">Mật khẩu mới</label>
                  <div className="input-password-wrapper">
                    <input
                      id="reset-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      className="input-field input-field--password"
                      placeholder="Tối thiểu 8 ký tự"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-password-toggle"
                      aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowNewPassword(v => !v)}
                    >
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20C6 20 1 12 1 12a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c6 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reset-confirm-password" className="form-label">Xác nhận mật khẩu mới</label>
                  <div className="input-password-wrapper">
                    <input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input-field input-field--password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-password-toggle"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowConfirmPassword(v => !v)}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20C6 20 1 12 1 12a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c6 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" id="reset-submit-btn" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
              </form>

              <p className="login-footer">
                Nhớ ra mật khẩu rồi?{' '}
                <Link to="/login" className="login-footer__link">Đăng nhập ngay</Link>
              </p>
            </>
          )}
        </div>

        <div className="login-right__footer">
          <img src={logoNav} alt="Pockie" className="login-right__footer-logo" />
          <span>© {new Date().getFullYear()} Pockie. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
