import { useEffect, useState, type ReactNode } from 'react';
import { Search, Plus, List, Grid, Ticket, Wallet, Clock, Info, X } from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { api } from '../../lib/api';
import mascot from '../../assets/mascot.png';
import shopeeLogo from '../../assets/mock/shopee.jpg';
import grabLogo from '../../assets/mock/grab.jpg';
import hcLogo from '../../assets/mock/hc.png';
import tikiLogo from '../../assets/mock/tiki.jpg';
import momoLogo from '../../assets/mock/momo.png';
import './Vouchers.css';

interface VoucherStats {
  totalCount: number;
  totalValue: string;
  expiringSoon: number;
}

interface VoucherItem {
  id: string;
  brand: string;
  brandLogo: string | ReactNode;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  expiryDate: string;
  brandBg: string;
}

interface PromoItem {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  bannerUrl: string;
  ctaText: string;
  bgColor: string;
  btnColor: string;
}

const MOCK_STATS: VoucherStats = {
  totalCount: 12,
  totalValue: '1.450.000đ',
  expiringSoon: 3,
};

const MOCK_VOUCHERS: VoucherItem[] = [
  {
    id: '1',
    brand: 'Shopee',
    brandLogo: <img src={shopeeLogo} alt="Shopee" className="brand-logo-img" />,
    brandBg: '#ffffffff',
    category: 'Mua sắm',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 15% tối đa 100K',
    description: 'Đơn tối thiểu 250K',
    expiryDate: '25/05/2025',
  },
  {
    id: '2',
    brand: 'Grab',
    brandLogo: <img src={grabLogo} alt="Grab" className="brand-logo-img" />,
    brandBg: '#ffffff',
    category: 'Di chuyển',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 20% tối đa 30K',
    description: 'Cho mọi chuyến xe',
    expiryDate: '28/05/2025',
  },
  {
    id: '3',
    brand: 'Highlands Coffee',
    brandLogo: <img src={hcLogo} alt="Highlands Coffee" className="brand-logo-img" />,
    brandBg: '#ffffff',
    category: 'Ăn uống',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 15% tối đa 25K',
    description: 'Áp dụng tại Highlands Coffee',
    expiryDate: '05/06/2025',
  },
  {
    id: '4',
    brand: 'Tiki',
    brandLogo: <img src={tikiLogo} alt="Tiki" className="brand-logo-img" />,
    brandBg: '#ffffff',
    category: 'Mua sắm',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 50K cho đơn từ 500K',
    description: 'Áp dụng cho sản phẩm Tiki Trading',
    expiryDate: '15/06/2025',
  },
  {
    id: '5',
    brand: 'Momo',
    brandLogo: <img src={momoLogo} alt="Momo" className="brand-logo-img" />,
    brandBg: '#ffffff',
    category: 'Dịch vụ',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 10K khi nạp điện thoại',
    description: 'Cho đơn từ 50K',
    expiryDate: '20/06/2025',
  }
];

const MOCK_PROMOS: PromoItem[] = [
  {
    id: 'p1',
    brand: 'Techcombank Inspire',
    title: 'Hoàn tiền đến 1,5%',
    subtitle: 'khi chi tiêu qua thẻ',
    bannerUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Credit%20card/3D/credit_card_3d.png',
    ctaText: 'Tìm hiểu ngay',
    bgColor: 'var(--color-mint-light)',
    btnColor: 'var(--color-mint)'
  },
  {
    id: 'p2',
    brand: 'Ưu đãi độc quyền cho bạn',
    title: 'Giảm đến 50%',
    subtitle: 'khi đặt xe Grab',
    bannerUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Automobile/3D/automobile_3d.png',
    ctaText: 'Nhận ưu đãi',
    bgColor: 'var(--color-mint-light)',
    btnColor: 'var(--color-mint)'
  },
  {
    id: 'p3',
    brand: 'Shopee Voucher',
    title: 'Siêu ưu đãi mỗi ngày',
    subtitle: 'Săn voucher cực hời chỉ có trên Shopee',
    bannerUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Shopping%20cart/3D/shopping_cart_3d.png',
    ctaText: 'Săn ngay',
    bgColor: 'var(--color-mint-light)',
    btnColor: 'var(--color-mint)'
  }
];

const EMOJIS = {
  gift: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png',
  book: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Open%20book/3D/open_book_3d.png',
  wallet: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wallet/3D/wallet_3d.png',
  alarm: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Alarm%20clock/3D/alarm_clock_3d.png',
  all: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png', // Fallback
  shopping: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Shopping%20bags/3D/shopping_bags_3d.png',
  food: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hamburger/3D/hamburger_3d.png',
  transport: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Motor%20scooter/3D/motor_scooter_3d.png',
  service: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Briefcase/3D/briefcase_3d.png'
};

function parseVoucherDate(value: string) {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

export default function Vouchers() {
  const [stats, setStats] = useState<VoucherStats>(MOCK_STATS);
  const [vouchers, setVouchers] = useState<VoucherItem[]>(MOCK_VOUCHERS);
  const [promos, setPromos] = useState<PromoItem[]>(MOCK_PROMOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [sortMode, setSortMode] = useState<'expiring' | 'brand'>('expiring');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);

  useEffect(() => {
    // Structure ready for future API integration
    async function fetchVouchersData() {
      try {
        const [statsRes, vouchersRes, promosRes] = await Promise.all([
          api.get('/api/v1/vouchers/stats').catch(() => ({ data: MOCK_STATS })),
          api.get('/api/v1/vouchers/list').catch(() => ({ data: MOCK_VOUCHERS })),
          api.get('/api/v1/vouchers/promos').catch(() => ({ data: MOCK_PROMOS }))
        ]);

        const rawStats = statsRes?.data?.data || statsRes?.data;
        setStats(rawStats && rawStats.totalCount !== undefined ? rawStats : MOCK_STATS);

        const rawVouchers = vouchersRes?.data?.data || vouchersRes?.data;
        setVouchers(Array.isArray(rawVouchers) && rawVouchers.length > 0 ? rawVouchers : MOCK_VOUCHERS);

        const rawPromos = promosRes?.data?.data || promosRes?.data;
        setPromos(Array.isArray(rawPromos) && rawPromos.length > 0 ? rawPromos : MOCK_PROMOS);
      } catch (error) {
        console.error("Failed to fetch vouchers", error);
      }
    }
    fetchVouchersData();
  }, []);

  const filters = [
    { name: 'Tất cả', count: vouchers.length },
    { name: 'Sắp hết hạn', count: vouchers.filter((voucher) => parseVoucherDate(voucher.expiryDate) <= parseVoucherDate('31/05/2025')).length },
    { name: 'Mua sắm', count: vouchers.filter((voucher) => voucher.category === 'Mua sắm').length },
    { name: 'Ăn uống', count: vouchers.filter((voucher) => voucher.category === 'Ăn uống').length },
    { name: 'Di chuyển', count: vouchers.filter((voucher) => voucher.category === 'Di chuyển').length },
    { name: 'Dịch vụ', count: vouchers.filter((voucher) => voucher.category === 'Dịch vụ').length },
  ];

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredVouchers = vouchers
    .filter((voucher) => {
      if (activeFilter === 'Tất cả') return true;
      if (activeFilter === 'Sắp hết hạn') {
        return parseVoucherDate(voucher.expiryDate) <= parseVoucherDate('31/05/2025');
      }
      return voucher.category === activeFilter;
    })
    .filter((voucher) => {
      if (!normalizedQuery) return true;
      const haystack = `${voucher.brand} ${voucher.title} ${voucher.description} ${voucher.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (sortMode === 'brand') {
        return a.brand.localeCompare(b.brand, 'vi');
      }
      return parseVoucherDate(a.expiryDate) - parseVoucherDate(b.expiryDate);
    });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main vouchers-main" style={{ padding: 0 }}>
        <div className="vouchers-page">

          {/* Header */}
          <header className="vouchers-header">
            <div className="vouchers-title-area">
              <h1>
                Voucher của tôi
                <img src={EMOJIS.gift} alt="Gift" className="title-emoji" />
              </h1>
              <p>Tiết kiệm thông minh - Chi tiêu thật vui</p>
            </div>
            <div className="vouchers-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Tìm voucher..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <Search size={16} className="search-icon" />
              </div>
              <button type="button" className="btn-add-voucher">
                <Plus size={16} /> Nhập mã voucher
              </button>
            </div>
          </header>



          {/* Summary Stats */}
          <div className="vouchers-summary-grid">
            <div className="summary-card yellow">
              <div className="summary-icon-wrapper" style={{ backgroundColor: '#FFF9E6' }}>
                <Ticket size={28} color="var(--color-yellow)" />
              </div>
              <div className="summary-info">
                <span className="summary-label">Tổng voucher</span>
                <div className="summary-value">
                  <strong>{stats.totalCount}</strong> <span style={{ fontSize: '16px', fontWeight: 'normal' }}>voucher</span>
                </div>
              </div>
            </div>

            <div className="summary-card green">
              <div className="summary-icon-wrapper" style={{ backgroundColor: '#DCFCE7' }}>
                <Wallet size={28} color="#10B981" />
              </div>
              <div className="summary-info">
                <span className="summary-label">Tổng giá trị</span>
                <div className="summary-value text-green">
                  <strong>{stats.totalValue}</strong>
                </div>
              </div>
            </div>

            <div className="summary-card red">
              <div className="summary-icon-wrapper" style={{ backgroundColor: '#FEE2E2' }}>
                <Clock size={28} color="#EF4444" />
              </div>
              <div className="summary-info">
                <span className="summary-label">Sắp hết hạn</span>
                <div className="summary-value text-red">
                  <strong>{stats.expiringSoon}</strong> <span style={{ fontSize: '16px', fontWeight: 'normal' }}>voucher</span>
                </div>
              </div>
            </div>

            <div className="summary-promo">
              <div className="summary-promo-text">
                <h4>Đừng bỏ lỡ voucher của bạn!</h4>
                <p>Sử dụng voucher trước khi hết hạn<br />để tiết kiệm tối đa nhé!</p>
              </div>
              <img src={mascot} alt="Pockie Mascot" className="summary-promo-mascot" />
            </div>
          </div>

          {/* Main Layout */}
          <div className="vouchers-main-layout">
            {/* Left Column: Voucher List */}
            <div className="vouchers-list-section">
              <div className="list-header">
                <h3>Danh sách voucher</h3>
                <div className="list-controls">
                  <select 
                    className="filter-dropdown" 
                    value={activeFilter} 
                    onChange={(e) => setActiveFilter(e.target.value)}
                  >
                    {filters.map(f => (
                      <option key={f.name} value={f.name}>
                        {f.name} ({f.count})
                      </option>
                    ))}
                  </select>
                  <select
                    className="sort-dropdown"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as 'expiring' | 'brand')}
                  >
                    <option value="expiring">Sắp hết hạn</option>
                    <option value="brand">Theo thương hiệu</option>
                  </select>
                  <div className="view-toggles">
                    <button
                      type="button"
                      className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                      aria-label="Hiển thị dạng lưới"
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      type="button"
                      className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                      aria-label="Hiển thị dạng danh sách"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`vouchers-list ${viewMode}-view`}>
                {filteredVouchers.map(voucher => (
                  <div key={voucher.id} className="voucher-card" onClick={() => setSelectedVoucher(voucher)}>
                    <div className="voucher-brand-col" style={{ backgroundColor: voucher.brandBg }}>
                      {voucher.brandLogo}
                    </div>
                    <div className="voucher-content-col">
                      <div className="voucher-category" style={{ backgroundColor: voucher.categoryColor }}>
                        {voucher.category}
                      </div>
                      <h4 className="voucher-title">{voucher.title}</h4>
                      <p className="voucher-desc">{voucher.description}</p>
                    </div>
                    
                    <div className="voucher-hover-overlay">
                      <span className="overlay-text">Xem chi tiết</span>
                    </div>
                  </div>
                ))}
                {filteredVouchers.length === 0 && (
                  <div className="voucher-empty-state">
                    <h4>Không tìm thấy voucher phù hợp</h4>
                    <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm ưu đãi.</p>
                  </div>
                )}
              </div>

              <div className="voucher-footer-note">
                <Info size={14} /> Voucher có thể có điều kiện áp dụng và số lượng giới hạn.
              </div>
            </div>

            {/* Right Column: Promos */}
            <div className="vouchers-promos-section">
              <div className="promos-header">
                <h3>Ưu đãi từ đối tác</h3>
                <button className="btn-view-all">Xem tất cả</button>
              </div>

              <div className="promos-list">
                {promos.map(promo => (
                  <div key={promo.id} className="promo-card" style={{ backgroundColor: promo.bgColor }}>
                    <div className="promo-content">
                      <span className="promo-brand">{promo.brand}</span>
                      <h4 className="promo-title">{promo.title}</h4>
                      <p className="promo-subtitle">{promo.subtitle}</p>
                      <button type="button" className="btn-promo-cta" style={{ backgroundColor: promo.btnColor }}>
                        {promo.ctaText}
                      </button>
                    </div>
                    <img src={promo.bannerUrl} alt={promo.brand} className="promo-image" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="voucher-modal-overlay" onClick={() => setSelectedVoucher(null)}>
          <div className="voucher-modal-content" onClick={e => e.stopPropagation()}>
            <button type="button" className="btn-close-modal" onClick={() => setSelectedVoucher(null)}>
              <X size={20} />
            </button>
            
            <div className="modal-header">
              <div className="modal-brand-logo" style={{ backgroundColor: selectedVoucher.brandBg }}>
                {selectedVoucher.brandLogo}
              </div>
              <div className="modal-header-info">
                <h3>{selectedVoucher.brand}</h3>
                <div className="voucher-category" style={{ backgroundColor: selectedVoucher.categoryColor }}>
                  {selectedVoucher.category}
                </div>
              </div>
            </div>
            
            <div className="modal-body">
              <h2 className="modal-title">{selectedVoucher.title}</h2>
              <p className="modal-desc">{selectedVoucher.description}</p>
              
              <div className="modal-meta">
                <div className="meta-item">
                  <CalendarIcon size={16} /> 
                  <span>HSD: {selectedVoucher.expiryDate}</span>
                </div>
                <div className="meta-item conditions">
                  <Info size={16} />
                  <span>Điều kiện áp dụng</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-use-voucher-modal">Sử dụng ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
