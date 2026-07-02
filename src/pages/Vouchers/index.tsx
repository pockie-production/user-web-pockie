import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  List,
  Grid,
  Ticket,
  Wallet,
  Clock,
  Info,
  X,
  Gift,
  ShoppingBag,
  Coffee,
  Car,
  BriefcaseBusiness,
  Sparkles,
  BadgePercent,
  CreditCard,
} from 'lucide-react';
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
  brandLogoUrl: string;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  expiryDate: string;
  brandBg: string;
  expiryTs: number;
  searchIndex: string;
}

interface PromoItem {
  id: string;
  brand: string;
  title: string;
  subtitle: string;
  ctaText: string;
  bgColor: string;
  btnColor: string;
  icon: 'card' | 'ride' | 'voucher';
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
    brandLogoUrl: shopeeLogo,
    brandBg: '#ffffffff',
    category: 'Mua sắm',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 15% tối đa 100K',
    description: 'Đơn tối thiểu 250K',
    expiryDate: '25/05/2025',
    expiryTs: 0,
    searchIndex: '',
  },
  {
    id: '2',
    brand: 'Grab',
    brandLogoUrl: grabLogo,
    brandBg: '#ffffff',
    category: 'Di chuyển',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 20% tối đa 30K',
    description: 'Cho mọi chuyến xe',
    expiryDate: '28/05/2025',
    expiryTs: 0,
    searchIndex: '',
  },
  {
    id: '3',
    brand: 'Highlands Coffee',
    brandLogoUrl: hcLogo,
    brandBg: '#ffffff',
    category: 'Ăn uống',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 15% tối đa 25K',
    description: 'Áp dụng tại Highlands Coffee',
    expiryDate: '05/06/2025',
    expiryTs: 0,
    searchIndex: '',
  },
  {
    id: '4',
    brand: 'Tiki',
    brandLogoUrl: tikiLogo,
    brandBg: '#ffffff',
    category: 'Mua sắm',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 50K cho đơn từ 500K',
    description: 'Áp dụng cho sản phẩm Tiki Trading',
    expiryDate: '15/06/2025',
    expiryTs: 0,
    searchIndex: '',
  },
  {
    id: '5',
    brand: 'Momo',
    brandLogoUrl: momoLogo,
    brandBg: '#ffffff',
    category: 'Dịch vụ',
    categoryColor: 'var(--color-mint-light)',
    title: 'Giảm 10K khi nạp điện thoại',
    description: 'Cho đơn từ 50K',
    expiryDate: '20/06/2025',
    expiryTs: 0,
    searchIndex: '',
  }
];

const MOCK_PROMOS: PromoItem[] = [
  {
    id: 'p1',
    brand: 'Techcombank Inspire',
    title: 'Hoàn tiền đến 1,5%',
    subtitle: 'khi chi tiêu qua thẻ',
    ctaText: 'Tìm hiểu ngay',
    bgColor: 'var(--color-mint-light)',
    btnColor: 'var(--color-mint)',
    icon: 'card',
  },
  {
    id: 'p2',
    brand: 'Ưu đãi độc quyền cho bạn',
    title: 'Giảm đến 50%',
    subtitle: 'khi đặt xe Grab',
    ctaText: 'Nhận ưu đãi',
    bgColor: 'var(--color-mint-light)',
    btnColor: 'var(--color-mint)',
    icon: 'ride',
  },
  {
    id: 'p3',
    brand: 'Shopee Voucher',
    title: 'Siêu ưu đãi mỗi ngày',
    subtitle: 'Săn voucher cực hời chỉ có trên Shopee',
    ctaText: 'Săn ngay',
    bgColor: 'var(--color-mint-light)',
    btnColor: 'var(--color-mint)',
    icon: 'voucher',
  }
];

const EXPIRING_SOON_MS = new Date(2025, 4, 31).getTime();
const INITIAL_VISIBLE_COUNT = 8;

function parseVoucherDate(value: string) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) {
    return Number.POSITIVE_INFINITY;
  }
  const timestamp = new Date(year, month - 1, day).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function prepareVoucherItem(item: Partial<VoucherItem> & {
  id?: string;
  brand?: string;
  category?: string;
  title?: string;
  description?: string;
  expiryDate?: string;
  brandBg?: string;
  categoryColor?: string;
  brandLogoUrl?: string;
}) {
  const expiryDate = item.expiryDate ?? '';
  const prepared: VoucherItem = {
    id: item.id ?? crypto.randomUUID(),
    brand: item.brand ?? 'Đối tác',
    brandLogoUrl: item.brandLogoUrl ?? momoLogo,
    brandBg: item.brandBg ?? '#ffffff',
    category: item.category ?? 'Khác',
    categoryColor: item.categoryColor ?? 'var(--color-mint-light)',
    title: item.title ?? 'Ưu đãi dành cho bạn',
    description: item.description ?? 'Chi tiết ưu đãi đang được cập nhật',
    expiryDate,
    expiryTs: parseVoucherDate(expiryDate),
    searchIndex: '',
  };
  prepared.searchIndex = `${prepared.brand} ${prepared.title} ${prepared.description} ${prepared.category}`.toLowerCase();
  return prepared;
}

function sanitizeVouchers(rawVouchers: unknown) {
  if (!Array.isArray(rawVouchers) || rawVouchers.length === 0) {
    return MOCK_VOUCHERS.map(prepareVoucherItem);
  }

  return rawVouchers.map((item) => prepareVoucherItem(item as VoucherItem));
}

function sanitizePromos(rawPromos: unknown) {
  return Array.isArray(rawPromos) && rawPromos.length > 0 ? rawPromos : MOCK_PROMOS;
}

function renderPromoIcon(icon: PromoItem['icon']) {
  switch (icon) {
    case 'card':
      return <CreditCard size={36} />;
    case 'ride':
      return <Sparkles size={36} />;
    case 'voucher':
      return <BadgePercent size={36} />;
    default:
      return <Gift size={36} />;
  }
}

function renderCategoryIcon(category: string) {
  switch (category) {
    case 'Mua sắm':
      return <ShoppingBag size={18} />;
    case 'Ăn uống':
      return <Coffee size={18} />;
    case 'Di chuyển':
      return <Car size={18} />;
    case 'Dịch vụ':
      return <BriefcaseBusiness size={18} />;
    default:
      return <Gift size={18} />;
  }
}

export default function Vouchers({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [stats, setStats] = useState<VoucherStats>(MOCK_STATS);
  const [vouchers, setVouchers] = useState<VoucherItem[]>(() => MOCK_VOUCHERS.map(prepareVoucherItem));
  const [promos, setPromos] = useState<PromoItem[]>(MOCK_PROMOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [sortMode, setSortMode] = useState<'expiring' | 'brand'>('expiring');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
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
        setVouchers(sanitizeVouchers(rawVouchers));

        const rawPromos = promosRes?.data?.data || promosRes?.data;
        setPromos(sanitizePromos(rawPromos));
      } catch (error) {
        console.error("Failed to fetch vouchers", error);
      }
    }
    fetchVouchersData();
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeFilter, deferredSearchTerm, sortMode]);

  const filters = useMemo(() => {
    const categoryCount = new Map<string, number>();
    let expiringSoon = 0;

    vouchers.forEach((voucher) => {
      categoryCount.set(voucher.category, (categoryCount.get(voucher.category) ?? 0) + 1);
      if (voucher.expiryTs <= EXPIRING_SOON_MS) {
        expiringSoon += 1;
      }
    });

    return [
      { name: 'Tất cả', count: vouchers.length },
      { name: 'Sắp hết hạn', count: expiringSoon },
      { name: 'Mua sắm', count: categoryCount.get('Mua sắm') ?? 0 },
      { name: 'Ăn uống', count: categoryCount.get('Ăn uống') ?? 0 },
      { name: 'Di chuyển', count: categoryCount.get('Di chuyển') ?? 0 },
      { name: 'Dịch vụ', count: categoryCount.get('Dịch vụ') ?? 0 },
    ];
  }, [vouchers]);

  const normalizedQuery = deferredSearchTerm.trim().toLowerCase();
  const filteredVouchers = useMemo(() => {
    const next = vouchers.filter((voucher) => {
      if (activeFilter === 'Sắp hết hạn' && voucher.expiryTs > EXPIRING_SOON_MS) {
        return false;
      }
      if (activeFilter !== 'Tất cả' && activeFilter !== 'Sắp hết hạn' && voucher.category !== activeFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return voucher.searchIndex.includes(normalizedQuery);
    });

    next.sort((a, b) => {
      if (sortMode === 'brand') {
        return a.brand.localeCompare(b.brand, 'vi');
      }
      return a.expiryTs - b.expiryTs;
    });

    return next;
  }, [activeFilter, normalizedQuery, sortMode, vouchers]);

  const visibleVouchers = useMemo(
    () => filteredVouchers.slice(0, visibleCount),
    [filteredVouchers, visibleCount]
  );

  const hasMoreVouchers = visibleCount < filteredVouchers.length;

  return (
    <div className={`dashboard-layout ${isEmbedded ? 'vouchers-embedded-layout' : ''}`}>
      {!isEmbedded && <Sidebar />}
      <main className="dashboard-main vouchers-main" style={{ padding: 0 }}>
        <div className="vouchers-page">

          {/* Header */}
          <header className="vouchers-header">
            <div className="vouchers-title-area">
              <h1>
                Voucher của tôi
                <span className="title-emoji" aria-hidden="true">
                  <Gift size={22} />
                </span>
              </h1>
              <p>Tiết kiệm thông minh - Chi tiêu thật vui</p>
            </div>
            <div className="vouchers-actions">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Tìm voucher..."
                  value={searchTerm}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setSearchTerm(nextValue);
                    });
                  }}
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
                    onChange={(event) => {
                      startTransition(() => {
                        setActiveFilter(event.target.value);
                      });
                    }}
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
                    onChange={(event) => {
                      startTransition(() => {
                        setSortMode(event.target.value as 'expiring' | 'brand');
                      });
                    }}
                  >
                    <option value="expiring">Sắp hết hạn</option>
                    <option value="brand">Theo thương hiệu</option>
                  </select>
                  <div className="view-toggles">
                    <button
                      type="button"
                      className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => {
                        startTransition(() => {
                          setViewMode('grid');
                        });
                      }}
                      aria-label="Hiển thị dạng lưới"
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      type="button"
                      className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => {
                        startTransition(() => {
                          setViewMode('list');
                        });
                      }}
                      aria-label="Hiển thị dạng danh sách"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`vouchers-list ${viewMode}-view`}>
                {visibleVouchers.map(voucher => (
                  <div key={voucher.id} className="voucher-card" onClick={() => setSelectedVoucher(voucher)}>
                    <div className="voucher-brand-col" style={{ backgroundColor: voucher.brandBg }}>
                      <img src={voucher.brandLogoUrl} alt={voucher.brand} className="brand-logo-img" loading="lazy" />
                    </div>
                    <div className="voucher-content-col">
                      <div className="voucher-category" style={{ backgroundColor: voucher.categoryColor }}>
                        <span className="voucher-category-icon" aria-hidden="true">
                          {renderCategoryIcon(voucher.category)}
                        </span>
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

              {hasMoreVouchers && (
                <button
                  type="button"
                  className="btn-load-more"
                  onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT)}
                >
                  Xem thêm voucher
                </button>
              )}

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
                    <div className="promo-image" aria-hidden="true">
                      {renderPromoIcon(promo.icon)}
                    </div>
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
                <img src={selectedVoucher.brandLogoUrl} alt={selectedVoucher.brand} className="brand-logo-img" loading="lazy" />
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
