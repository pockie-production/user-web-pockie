import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Gift,
  KeyRound,
  Lock,
  LogOut,
  Save,
  ScanLine,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { api } from '../../lib/api';
import { emitAuthStateChanged } from '../../lib/authEvents';
import { isExternalAvatarUrl } from '../../lib/profile';
import '../Dashboard/Dashboard.css';
import './Settings.css';

type UserProfile = {
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
  featureAccess: {
    canUseAI: boolean;
    canUseOCR: boolean;
    canClaimPersonalizedVoucher: boolean;
    reason: string;
  };
};

function featureRows(profile: UserProfile) {
  return [
    {
      icon: Bot,
      title: 'AI Chat',
      enabled: profile.featureAccess.canUseAI,
      detail: 'Tư vấn tài chính và gợi ý hành động hằng ngày.',
    },
    {
      icon: ScanLine,
      title: 'OCR',
      enabled: profile.featureAccess.canUseOCR,
      detail: 'Đọc hóa đơn, giấy tờ và biến thành dữ liệu chi tiêu.',
    },
    {
      icon: Gift,
      title: 'Voucher cá nhân hóa',
      enabled: profile.featureAccess.canClaimPersonalizedVoucher,
      detail: 'Nhận ưu đãi phù hợp với hành vi tài chính.',
    },
  ];
}

export default function Settings({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    displayName: '',
    fullName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      setError('');
      const res = await api.get<UserProfile>('/api/v1/users/me');
      setProfile(res.data);
      setForm({
        displayName: res.data.displayName === 'Chưa cập nhật tên' ? '' : res.data.displayName || '',
        fullName: res.data.fullName || '',
        phone: res.data.phone || '',
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không tải được thông tin tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const logout = async () => {
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

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await api.patch<{ message: string; user: UserProfile }>('/api/v1/users/me', {
        displayName: form.displayName,
        fullName: form.fullName,
        phone: form.phone,
      });
      setProfile(res.data.user);
      setMessage(res.data.message || 'Đã lưu thay đổi.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không lưu được hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu mới chưa khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post<{ message: string }>('/api/v1/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage(res.data.message || 'Đổi mật khẩu thành công.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => void logout(), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không đổi được mật khẩu.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-shell">Đang tải cài đặt...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="settings-page">
        <div className="settings-shell">
          <div className="settings-alert settings-alert-error">{error || 'Chưa có dữ liệu tài khoản.'}</div>
        </div>
      </div>
    );
  }

  const displayName = profile.displayName || 'Chưa cập nhật tên';
  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const showAvatarImage = isExternalAvatarUrl(profile.avatarUrl);
  const passwordAccount = profile.authProvider === 'PASSWORD';

  return (
    <div className="settings-page" style={isEmbedded ? { padding: 0 } : {}}>
      <main className="settings-shell" style={isEmbedded ? { margin: 0, maxWidth: 'none', borderRadius: 0 } : {}}>
        {!isEmbedded && (
          <header className="settings-header">
            <NavLink to="/dashboard" className="settings-back">
              <ArrowLeft size={18} />
              <span>Dashboard</span>
            </NavLink>
            <button type="button" className="settings-logout" onClick={() => void logout()}>
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </header>
        )}

        {(error || message) && (
          <div className={`settings-alert ${error ? 'settings-alert-error' : 'settings-alert-success'}`}>
            {error || message}
          </div>
        )}

        <section className="settings-summary">
          <div className="settings-avatar">
            {showAvatarImage ? (
              <img src={profile.avatarUrl ?? ''} alt={displayName} className="settings-avatar-image" />
            ) : (
              userInitial
            )}
          </div>
          <div className="settings-summary-info">
            <p className="settings-eyebrow">Tài khoản Pockie</p>
            <h1>{displayName}</h1>
            <p>{profile.email || 'Chưa có email'}</p>
            <div className="settings-xp">
              <span>Lv.{profile.level}</span>
              <div className="settings-xp-track">
                <div style={{ width: `${profile.xpProgressPercent}%` }} />
              </div>
              <span>{profile.currentXp.toLocaleString('vi-VN')} XP</span>
            </div>
          </div>
          <div className={`settings-kyc-pill settings-kyc-${profile.kycStatus.toLowerCase()}`}>
            {{
              NOT_STARTED: 'Chưa xác thực',
              PENDING: 'Đang chờ duyệt',
              VERIFIED: 'Đã xác thực',
              REJECTED: 'Bị từ chối',
              EXPIRED: 'Hết hạn',
            }[profile.kycStatus]}
          </div>
        </section>

        <div className="settings-grid">
          <section className="settings-panel settings-panel-wide">
            <div className="settings-section-title">
              <UserRound size={20} />
              <h2>Hồ sơ</h2>
            </div>
            <form className="settings-form" onSubmit={(event) => void saveProfile(event)}>
              <label>
                <span>Tên hiển thị</span>
                <input
                  value={form.displayName}
                  onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
                  placeholder="Tên bạn muốn Pockie gọi"
                  maxLength={80}
                />
              </label>
              <label>
                <span>Họ và tên</span>
                <input
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Nguyễn Văn Minh"
                  maxLength={120}
                />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="0909123456"
                  maxLength={20}
                />
              </label>
              <label>
                <span>Email</span>
                <input value={profile.email || ''} disabled />
              </label>
              <button className="settings-primary-btn" type="submit" disabled={saving}>
                <Save size={18} />
                <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </form>
          </section>

          <section className="settings-panel">
            <div className="settings-section-title">
              <KeyRound size={20} />
              <h2>Bảo mật</h2>
            </div>
            {passwordAccount ? (
              <form className="settings-form" onSubmit={(event) => void changePassword(event)}>
                <label>
                  <span>Mật khẩu hiện tại</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    minLength={6}
                  />
                </label>
                <label>
                  <span>Mật khẩu mới</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    minLength={6}
                  />
                </label>
                <label>
                  <span>Xác nhận mật khẩu mới</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    minLength={6}
                  />
                </label>
                <button className="settings-primary-btn" type="submit" disabled={changingPassword}>
                  <Lock size={18} />
                  <span>{changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</span>
                </button>
              </form>
            ) : (
              <div className="settings-oauth-note">
                <Lock size={22} />
                <p>Tài khoản này đang đăng nhập bằng Google. Bạn có thể quản lý mật khẩu trong tài khoản Google.</p>
              </div>
            )}

            <div className="settings-section-title" style={{ marginTop: '32px' }}>
              <Sparkles size={20} />
              <h3 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Quyền tính năng</h3>
            </div>
            <div className="settings-feature-list">
              {featureRows(profile).map((feature) => {
                const FeatureIcon = feature.icon;

                return (
                  <div key={feature.title} className="settings-feature-item">
                    <div className="settings-feature-icon">
                      <FeatureIcon size={20} />
                    </div>
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.detail}</p>
                    </div>
                    <span className={`settings-feature-badge ${feature.enabled ? 'is-enabled' : 'is-locked'}`}>
                      {feature.enabled ? 'Đã mở khóa' : 'Cần eKYC'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>


        </div>
      </main>
    </div>
  );
}
