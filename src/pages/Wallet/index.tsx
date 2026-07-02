import React, { useState, useRef } from 'react';
import {
  Plus,
  ScanLine,
  ArrowLeftRight,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { AddTransactionModal, SmartScanModal, AddWalletModal } from './WalletModals';
import { CameraScanner } from './CameraScanner';
import './Wallet.css';


import { api } from '../../lib/api';

interface AllocationData {
  id: string;
  title: string;
  percent: number;
  amount: string;
  color: string;
  offset: number;
}

interface WalletSummary {
  balance: string;
  diffAmount: string;
  diffType: 'up' | 'down';
  income: string;
  expense: string;
  savingsPercent: number;
}

interface WalletAccount {
  id: string;
  type: 'mb' | 'momo' | 'zalopay' | 'cash';
  name: string;
  balance: string;
  accountNumber: string;
  isPrimary: boolean;
}




export default function Wallet({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [showBalance, setShowBalance] = useState(true);
  const [timeFilter, setTimeFilter] = useState('3T');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [chartHoverX, setChartHoverX] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [allocations, setAllocations] = useState<AllocationData[]>([]);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);

  // Modal states
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isSmartScanOpen, setIsSmartScanOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);

  React.useEffect(() => {
    async function fetchWalletData() {
      try {
        // Map to backend Finance endpoints
        const [allocationsRes, summaryRes, accountsRes] = await Promise.all([
          api.get('/api/v1/wallets/overview'),
          api.get('/api/v1/wallets/overview'),
          api.get('/api/v1/wallets/accounts')
        ]);
        setAllocations(allocationsRes.data.allocations || []);
        setSummary(summaryRes.data.summary || null);
        setAccounts(accountsRes.data.accounts || []);
      } catch (e) {
        setAllocations([]);
        setSummary(null);
        setAccounts([]);
      }
    }
    fetchWalletData();
  }, []);

  const getHoverDate = (x: number) => {
    const daysSpan = timeFilter === '1T' ? 30 : timeFilter === '3T' ? 90 : timeFilter === '6T' ? 180 : 365;
    const fraction = x / 300;
    const daysAgo = Math.round((1 - fraction) * daysSpan);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scaleX = 300 / rect.width;
    setChartHoverX(x * scaleX);
  };

  const handleChartMouseLeave = () => {
    setChartHoverX(null);
  };

  const getSparklinePath = () => {
    switch (timeFilter) {
      case '1T': return "M 0,90 C 25,90 25,110 50,110 C 75,110 75,40 100,40 C 125,40 125,100 150,100 C 175,100 175,20 200,20 C 225,20 225,80 250,80 C 275,80 275,30 300,30";
      case '6T': return "M 0,110 C 25,110 25,90 50,90 C 75,90 75,100 100,100 C 125,100 125,70 150,70 C 175,70 175,80 200,80 C 225,80 225,50 250,50 C 275,50 275,30 300,30";
      case '1N': return "M 0,115 C 50,115 50,80 100,80 C 150,80 150,50 200,50 C 250,50 250,10 300,10";
      case '3T':
      default: return "M 0,100 C 25,100 25,80 50,80 C 75,80 75,110 100,110 C 125,110 125,50 150,50 C 175,50 175,70 200,70 C 225,70 225,30 250,30 C 275,30 275,20 300,20";
    }
  };
  const sparklinePath = getSparklinePath();

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = 300; // card width + gap
      const currentScroll = trackRef.current.scrollLeft;
      trackRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const content = (
        <main className="dashboard-main" style={{ padding: 0 }}>
        <div className="wallet-page" style={{ height: '100%', overflowY: 'auto' }}>
          <header className="wallet-page-header">
            <div className="wallet-title-group">
              <h1>
                <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Purse/3D/purse_3d.png" alt="Ví" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                Ví của bạn
              </h1>
              <p>Quản lý tài sản và theo dõi dòng tiền của bạn</p>
            </div>
            <div className="wallet-actions">
              <button className="wallet-action-btn btn-add-tx" onClick={() => setIsAddTxOpen(true)}>
                <Plus size={16} /> Thêm giao dịch
              </button>
              <button className="wallet-action-btn btn-scan" onClick={() => setIsSmartScanOpen(true)}>
                <ScanLine size={16} /> Smart Scan
              </button>
              <button className="wallet-action-btn btn-add-wallet" onClick={() => setIsAddWalletOpen(true)}>
                <Plus size={16} /> Thêm ví
              </button>
            </div>
          </header>

          <div className="wallet-main-cards">
            {/* Total Assets Card */}
            <div className="wallet-summary-card">
              <div className="wallet-summary-content">

                <div className="wallet-summary-top">
                  <div className="wallet-summary-label">
                    Tổng tài sản
                    <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                      {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                  <div className="wallet-balance">
                    {showBalance ? summary?.balance || '0đ' : '******'}
                  </div>
                  <div className="wallet-diff">
                    {summary?.diffType === 'up' ? '↑' : '↓'} {summary?.diffAmount} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>so với tháng trước</span>
                  </div>

                  <div className="wallet-time-filters">
                    {['1T', '3T', '6T', '1N'].map(t => (
                      <button
                        key={t}
                        className={`time-filter-btn ${timeFilter === t ? 'active' : ''}`}
                        onClick={() => setTimeFilter(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <svg
                    className="wallet-sparkline"
                    width="100%"
                    height="120"
                    viewBox="0 0 300 120"
                    preserveAspectRatio="none"
                    onMouseMove={handleChartMouseMove}
                    onMouseLeave={handleChartMouseLeave}
                  >
                    <path
                      d={sparklinePath}
                      fill="none"
                      stroke="var(--color-mint)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ transition: 'd 0.5s ease-in-out' }}
                    />
                    <path
                      d={`${sparklinePath} L300,120 L0,120 Z`}
                      fill="url(#sparkline-gradient)"
                      style={{ transition: 'd 0.5s ease-in-out' }}
                    />
                    {chartHoverX !== null && (
                      <line
                        x1={chartHoverX}
                        y1="0"
                        x2={chartHoverX}
                        y2="120"
                        stroke="var(--color-mint)"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="4 4"
                        opacity={0.5}
                      />
                    )}
                    <defs>
                      <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(92, 200, 156, 0.25)" />
                        <stop offset="100%" stopColor="rgba(92, 200, 156, 0)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {chartHoverX !== null && (
                    <div 
                      className="chart-hover-date"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% - 20px)',
                        left: `${(chartHoverX / 300) * 100}%`,
                        transform: 'translateX(-50%)',
                        background: 'var(--color-text-primary)',
                        color: 'white',
                        fontSize: '11px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        fontWeight: 600,
                      }}
                    >
                      {getHoverDate(chartHoverX)}
                    </div>
                  )}
                </div>

                <div className="wallet-summary-bottom">
                  <div className="stat-item">
                    <div className="label">Thu nhập</div>
                    <div className="value income">{summary?.income || '0đ'}</div>
                  </div>
                  <div className="stat-item">
                    <div className="label">Chi tiêu</div>
                    <div className="value">{summary?.expense || '0đ'}</div>
                  </div>
                  <div className="stat-item">
                    <div className="label">Tiết kiệm</div>
                    <div className="value savings">{summary?.savingsPercent || 0}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Allocation Card */}
            <div className="wallet-allocation-card">
              <h3>Phân bổ tài sản</h3>
              <div className="allocation-content">
                <div className="donut-chart-container">
                  <svg viewBox="0 0 42 42" className="donut-svg">
                    {allocations.map(slice => (
                      <circle
                        key={slice.id}
                        cx="21"
                        cy="21"
                        r="15.9155"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="8"
                        strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
                        strokeDashoffset={slice.offset}
                        className={`donut-segment ${hoveredSlice === slice.id ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    ))}
                  </svg>
                  <div className="donut-center-info">
                    {hoveredSlice ? (
                      <>
                        <div className="donut-center-title">{allocations.find(d => d.id === hoveredSlice)?.title}</div>
                        <div className="donut-center-value">{allocations.find(d => d.id === hoveredSlice)?.percent}%</div>
                      </>
                    ) : (
                      <>
                        <div className="donut-center-title">Tổng</div>
                        <div className="donut-center-value">100%</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="allocation-legend">
                  {allocations.map(item => (
                    <div
                      className={`legend-item ${hoveredSlice === item.id ? 'active' : ''}`}
                      key={item.id}
                      onMouseEnter={() => setHoveredSlice(item.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <div className="legend-left">
                        <div className="legend-dot" style={{ background: item.color }}></div>
                        <div className="legend-title">{item.title}</div>
                      </div>
                      <div className="legend-right">
                        <div className="legend-percent">{item.percent}%</div>
                        <div className="legend-amount">{item.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="smart-insight-box">
                💡 Ngân hàng đang chiếm tỷ trọng lớn nhất trong tài sản của bạn.
              </div>
            </div>
          </div>

          <div className="my-wallets-section">
            <h3>Ví của tôi</h3>
            <div className="wallets-carousel-container">
              <button className="carousel-nav-btn" onClick={() => scrollCarousel('left')}>
                <ChevronLeft size={20} />
              </button>

              <div className="wallets-track" ref={trackRef}>
                {accounts.map((acc) => (
                  <div key={acc.id} className={`wallet-card ${acc.type === 'mb' ? 'mb-bank' : acc.type}`}>
                    <div className="wallet-card-header">
                      <div className="wallet-card-brand">
                        {acc.type === 'mb' && (
                          <div className="mb-logo">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                            <span>MB</span>
                          </div>
                        )}
                        {acc.type === 'momo' && (
                          <div className="momo-logo"><span>mo</span><span>mo</span></div>
                        )}
                        {acc.type === 'zalopay' && (
                          <div className="zalopay-logo"><span>Zalo</span><span>Pay</span></div>
                        )}
                        {acc.type === 'cash' && (
                          <div className="cash-logo">
                            <svg width="20" height="14" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="24" height="16" rx="3" fill="#10C16C" />
                              <circle cx="12" cy="8" r="4" fill="white" />
                              <path d="M11 6h2v4h-2z" fill="#10C16C" />
                            </svg>
                          </div>
                        )}

                        {acc.isPrimary && (
                          <div className="mb-badge">
                            <ArrowLeftRight size={10} /> Thẻ chính
                          </div>
                        )}
                      </div>
                      <Star size={20} style={{ opacity: acc.isPrimary ? 0.8 : 0.5 }} />
                    </div>
                    <div className="wallet-card-body">
                      <h4>{acc.name}</h4>
                      <div className="wallet-card-balance">{acc.balance}</div>
                      <div className="wallet-card-account">{acc.accountNumber}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="carousel-nav-btn" onClick={() => scrollCarousel('right')}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="carousel-dots">
              <div className="carousel-dot active"></div>
              <div className="carousel-dot"></div>
              <div className="carousel-dot"></div>
              <div className="carousel-dot"></div>
            </div>
          </div>
        </div>
      </main>
  );

  const modals = (
    <>
      <AddTransactionModal isOpen={isAddTxOpen} onClose={() => setIsAddTxOpen(false)} />
      <SmartScanModal 
        isOpen={isSmartScanOpen} 
        onClose={() => setIsSmartScanOpen(false)} 
        onOpenCamera={() => {
          setIsSmartScanOpen(false);
          setIsCameraScannerOpen(true);
        }}
      />
      <CameraScanner isOpen={isCameraScannerOpen} onClose={() => setIsCameraScannerOpen(false)} />
      <AddWalletModal isOpen={isAddWalletOpen} onClose={() => setIsAddWalletOpen(false)} />
    </>
  );

  if (isEmbedded) {
    return (
      <>
        {content}
        {modals}
      </>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      {content}
      {modals}
    </div>
  );
}
