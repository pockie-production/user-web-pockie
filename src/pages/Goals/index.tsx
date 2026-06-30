import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { api } from '../../lib/api';
import { 
  Bell,
  X
} from 'lucide-react';
import './Goals.css';

import banner1 from '../../assets/banner_1.png';
import banner2 from '../../assets/banner_2.png';
import banner3 from '../../assets/banner_3.png';

const BANNERS = [banner1, banner2, banner3];

const EMOJI = {
  target: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bullseye/3D/bullseye_3d.png',
  fire: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png',
  star: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Star/3D/star_3d.png',
  gem: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gem%20stone/3D/gem_stone_3d.png',
  check: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Check%20mark%20button/3D/check_mark_button_3d.png',
  camera: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Camera/3D/camera_3d.png',
  money: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Money%20bag/3D/money_bag_3d.png',
  tea: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bubble%20tea/3D/bubble_tea_3d.png',
  sparkle: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png',
  ticket: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Admission%20tickets/3D/admission_tickets_3d.png',
  coin: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Coin/3D/coin_3d.png',
  gift: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png',
};

interface Mission {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  rewardXp: number;
  iconSrc: string;
  theme: string;
}

interface Reward {
  id: string;
  title: string;
  requirementText: string;
  iconSrc: string;
  theme: string;
}

const MOCK_MISSIONS: Mission[] = [
  { id: '1', title: 'Quét 1 hóa đơn', description: 'Ghi nhận chi tiêu bằng Smart Scan', current: 0, target: 1, unit: '', rewardXp: 20, iconSrc: EMOJI.camera, theme: 'mint' },
  { id: '2', title: 'Tiết kiệm 20.000đ', description: 'Chuyển tiền vào mục tiết kiệm của bạn', current: 0, target: 20000, unit: 'đ', rewardXp: 30, iconSrc: EMOJI.money, theme: 'yellow' },
  { id: '3', title: 'Không mua trà sữa', description: 'Kiềm chế cám dỗ hôm nay nhé!', current: 0, target: 1, unit: ' ngày', rewardXp: 25, iconSrc: EMOJI.tea, theme: 'mint' }
];

const MOCK_REWARDS: Reward[] = [
  { id: '1', title: 'eVoucher 20K', requirementText: 'Cần 2,000 XP', iconSrc: EMOJI.ticket, theme: 'yellow' },
  { id: '2', title: '100 XP', requirementText: 'Cần 500 XP', iconSrc: EMOJI.coin, theme: 'mint' },
  { id: '3', title: 'eVoucher 50K', requirementText: 'Cần 3,000 XP', iconSrc: EMOJI.gift, theme: 'yellow' }
];

export default function Goals({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [profile, setProfile] = useState<any>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userStats, setUserStats] = useState({ level: 1, currentXp: 0, totalXp: 0, nextLevelXpRequired: 100, streak: 0 });
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          api.get('/api/v1/users/me'),
          api.get('/api/v1/gamification/profile').catch(() => ({ data: {} })),
        ]);
        setProfile(profileRes.data);
        const p = statsRes.data;
        setUserStats({
          level: p.level || 1,
          currentXp: p.currentXp || 0,
          totalXp: p.totalXp || 0,
          nextLevelXpRequired: p.nextLevelXpRequired || 100,
          streak: p.currentStreakDays || 0,
        });
      } catch (err) {
        console.error(err);
      }

      try {
        const [missionsRes, rewardsRes, activeCampaignsRes] = await Promise.all([
          api.get('/api/v1/missions/daily').catch(() => ({ data: { items: MOCK_MISSIONS } })),
          api.get('/api/v1/vouchers/available').catch(() => ({ data: MOCK_REWARDS })),
          api.get('/api/v1/campaigns/active').catch(() => ({ data: { items: [] } })),
        ]);
        
        // Map backend missions format to frontend
        const dailyMissions = (missionsRes.data.items || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          current: m.progress || 0,
          target: m.targetValue || 1,
          unit: '',
          rewardXp: m.xpReward || 0,
          iconSrc: EMOJI.target,
          theme: 'mint',
          status: m.status
        }));
        setMissions(dailyMissions.length > 0 ? dailyMissions : MOCK_MISSIONS);

        // Map backend vouchers format
        const availableVouchers = (rewardsRes.data || []).map((v: any) => ({
          id: v.id,
          title: v.name || v.title,
          requirementText: `Còn ${v.remainingQuantity || 0} lượt`,
          iconSrc: EMOJI.gift,
          theme: 'yellow',
        }));
        setRewards(availableVouchers.length > 0 ? availableVouchers : MOCK_REWARDS);
      } catch (err) {
        setMissions(MOCK_MISSIONS);
        setRewards(MOCK_REWARDS);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic data for UI
  const xp = profile?.currentXp || 2450;
  const level = profile?.level || 12;
  const nextLevelXp = profile?.nextLevelXp || 3000;
  const { streak, missionsCompleted } = userStats;

  const xpPercent = Math.min((xp / nextLevelXp) * 100, 100);
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * xpPercent) / 100;

  const content = (
      <main className="goals-page">
        {/* HEADER */}
        <header className="goals-header">
          <div className="goals-header-left">
            <h1>Mục tiêu <img src={EMOJI.target} alt="Mục tiêu" style={{ width: 32, height: 32 }} /></h1>
            <p>Kiếm XP, hoàn thành thử thách và nhận thưởng hấp dẫn!</p>
          </div>
          <div className="goals-header-right">
            <div className="stat-pill streak">
              <img src={EMOJI.fire} alt="Streak" style={{ width: 20, height: 20 }} />
              {streak} ngày streak
            </div>
            <div className="stat-pill xp">
              <img src={EMOJI.star} alt="XP" style={{ width: 20, height: 20 }} />
              {xp.toLocaleString()} XP
            </div>
            <button className="header-icon-btn">
              <Bell size={20} />
              {/* Notification dot */}
              <div style={{ position: 'absolute', top: 8, right: 10, width: 8, height: 8, background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></div>
            </button>
            <div className="header-avatar">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E5E7EB', fontWeight: 'bold' }}>
                  {profile?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="goals-content">
          {/* MAIN COLUMN */}
          <div className="goals-main-col">

            {/* PROGRESS CARD */}
            <section>
              <div className="section-header">
                <h2>Tiến trình của bạn</h2>
              </div>
              <div className="progress-card">
                <div className="level-circle-container">
                  <svg className="level-circle-svg" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="yellow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FCD34D" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                    <circle className="level-circle-bg" cx="50" cy="50" r="45" />
                    <circle
                      className="level-circle-progress"
                      cx="50" cy="50" r="45"
                      style={{ strokeDashoffset }}
                    />
                  </svg>
                  <div className="level-circle-content">
                    <div className="level-label">Level</div>
                    <div className="level-value">{level}</div>
                  </div>
                </div>

                <div className="progress-info">
                  <div className="progress-info-flex">
                    <div className="xp-progress-text">
                      <strong>{xp.toLocaleString()}</strong> / {nextLevelXp.toLocaleString()} XP<br />đến Level {level + 1}
                    </div>
                    <div className="progress-stats-grid">
                      <div className="p-stat-item">
                        <div className="p-stat-icon yellow"><img src={EMOJI.fire} alt="Streak" style={{ width: 24, height: 24 }} /></div>
                        <div className="p-stat-val">{streak}</div>
                        <div className="p-stat-label">Ngày streak</div>
                      </div>
                      <div className="p-stat-item">
                        <div className="p-stat-icon mint"><img src={EMOJI.check} alt="Mission" style={{ width: 24, height: 24 }} /></div>
                        <div className="p-stat-val">{missionsCompleted}</div>
                        <div className="p-stat-label">Mission hoàn thành</div>
                      </div>
                      <div className="p-stat-item">
                        <div className="p-stat-icon yellow"><img src={EMOJI.star} alt="XP" style={{ width: 24, height: 24 }} /></div>
                        <div className="p-stat-val">{xp.toLocaleString()}</div>
                        <div className="p-stat-label">XP hiện có</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MISSIONS */}
            <section>
              <div className="section-header">
                <h2>Nhiệm vụ hôm nay</h2>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Làm mới sau 14:30
                </div>
              </div>
              <div className="missions-grid">
                {missions.map(mission => (
                  <div key={mission.id} className={`mission-card ${mission.theme}`}>
                    <div className="m-card-header">
                      <div className="m-card-icon"><img src={mission.iconSrc} alt="Icon" style={{ width: 28, height: 28 }} /></div>
                      <div className="m-card-title">
                        <h3>{mission.title}</h3>
                        <p>{mission.description}</p>
                      </div>
                    </div>
                    <div className="m-card-progress-text">
                      {mission.current.toLocaleString()} / {mission.target.toLocaleString()}{mission.unit}
                    </div>
                    <div className="m-card-progress-bar">
                      <div className="m-card-progress-fill" style={{ width: `${Math.min((mission.current / mission.target) * 100, 100)}%` }}></div>
                    </div>
                    <div className="m-card-footer">
                      <div className="m-card-reward"><img src={EMOJI.star} alt="XP" style={{ width: 16, height: 16, display: 'inline', verticalAlign: 'text-bottom' }} /> +{mission.rewardXp} XP</div>
                      <button className="m-card-btn">Bắt đầu</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner */}
              <div className="mission-banner">
                <div className="banner-icon"><img src={EMOJI.sparkle} alt="Sparkle" style={{ width: 28, height: 28 }} /></div>
                <div className="banner-text">
                  <h4>Hoàn thành nhiệm vụ để nhận XP</h4>
                  <p>Tích XP để lên level và nhận nhiều phần thưởng hơn!</p>
                </div>
                <button className="banner-btn" onClick={() => setIsMissionsModalOpen(true)}>
                  Xem tất cả nhiệm vụ &rarr;
                </button>
              </div>
            </section>

            {/* REWARDS */}
            <section>
              <div className="section-header">
                <h2>Phần thưởng nổi bật</h2>
                <a href="#" className="section-action">Xem tất cả &rarr;</a>
              </div>
              <div className="rewards-grid">
                {rewards.map(reward => (
                  <div key={reward.id} className={`reward-card ${reward.theme}`}>
                    <div className="r-card-icon"><img src={reward.iconSrc} alt="Reward Icon" style={{ width: 48, height: 48 }} /></div>
                    <div className="r-card-title">{reward.title}</div>
                    <div className="r-card-req">{reward.requirementText}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Horizontal Ad Banner */}
            <section style={{ marginTop: '16px' }}>
              <div className="promo-horizontal-banner">
                {BANNERS.map((banner, index) => (
                  <img
                    key={index}
                    src={banner}
                    alt={`Promo Banner ${index + 1}`}
                    className={`carousel-img ${index === activeBanner ? 'active' : ''}`}
                  />
                ))}
              </div>
            </section>

          </div>

        </div>
      
      {/* All Missions Modal */}
      {isMissionsModalOpen && (
        <div className="goals-modal-overlay" onClick={() => setIsMissionsModalOpen(false)}>
          <div className="goals-modal" onClick={e => e.stopPropagation()}>
            <button className="goals-modal-close" onClick={() => setIsMissionsModalOpen(false)}>
              <X size={24} />
            </button>
            <h2 className="goals-modal-title">Tất cả nhiệm vụ</h2>
            <div className="goals-modal-content">
              {missions.map(mission => (
                <div key={mission.id} className={`mission-card ${mission.theme}`} style={{ width: '100%' }}>
                  <div className="m-card-header">
                    <div className="m-card-icon"><img src={mission.iconSrc} alt="Icon" style={{ width: 28, height: 28 }} /></div>
                    <div className="m-card-title">
                      <h3>{mission.title}</h3>
                      <p>{mission.description}</p>
                    </div>
                  </div>
                  <div className="m-card-progress-text">
                    {mission.current.toLocaleString()} / {mission.target.toLocaleString()}{mission.unit}
                  </div>
                  <div className="m-card-progress-bar">
                    <div className="m-card-progress-fill" style={{ width: `${Math.min((mission.current / mission.target) * 100, 100)}%` }}></div>
                  </div>
                  <div className="m-card-footer">
                    <div className="m-card-reward"><img src={EMOJI.star} alt="XP" style={{ width: 16, height: 16, display: 'inline', verticalAlign: 'text-bottom' }} /> +{mission.rewardXp} XP</div>
                    <button className="m-card-btn">Bắt đầu</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </main>
  );

  if (isEmbedded) return content;
  return (
    <div className="dashboard-layout">
      <Sidebar />
      {content}
    </div>
  );
}
