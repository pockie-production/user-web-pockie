import { useState, useEffect } from 'react';
import { 
  Calendar, Download, Lock, Wallet, ShoppingCart, 
  TrendingUp, PieChart, ChevronDown
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { api } from '../../lib/api';
import './Reports.css';

interface ReportOverview {
  income: string;
  incomeDiff: number;
  expense: string;
  expenseDiff: number;
  balance: string;
  balanceDiff: number;
  savingsRate: number;
  savingsDiff: number;
}

interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
}

interface CategoryData {
  id: string;
  name: string;
  percent: number;
  amount: string;
  color: string;
  iconUrl: string;
}

interface Transaction {
  id: string;
  title: string;
  date: string;
  amount: string;
  type: 'income' | 'expense';
  iconUrl: string;
}

const MOCK_OVERVIEW: ReportOverview = {
  income: '15.240.000đ', incomeDiff: 12,
  expense: '9.850.000đ', expenseDiff: 8,
  balance: '5.390.000đ', balanceDiff: 18,
  savingsRate: 35, savingsDiff: 5
};

const MOCK_TRENDS: TrendDataPoint[] = [
  { date: '01/05', income: 12, expense: 9 },
  { date: '04/05', income: 14, expense: 8 },
  { date: '08/05', income: 13, expense: 10 },
  { date: '12/05', income: 15, expense: 7 },
  { date: '16/05', income: 20, expense: 6 },
  { date: '20/05', income: 14, expense: 8 },
  { date: '24/05', income: 11, expense: 4 },
  { date: '28/05', income: 14, expense: 7 },
  { date: '31/05', income: 16, expense: 8 },
];

const MOCK_CATEGORIES: CategoryData[] = [
  { id: 'food', name: 'Ăn uống', percent: 38, amount: '3.743.000đ', color: '#A7F3D0', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hamburger/3D/hamburger_3d.png' },
  { id: 'shopping', name: 'Mua sắm', percent: 20, amount: '1.970.000đ', color: '#BAE6FD', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Shopping%20bags/3D/shopping_bags_3d.png' },
  { id: 'transport', name: 'Đi lại', percent: 15, amount: '1.478.000đ', color: '#FED7AA', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Oncoming%20bus/3D/oncoming_bus_3d.png' },
  { id: 'entertainment', name: 'Giải trí', percent: 10, amount: '985.000đ', color: '#C7D2FE', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Video%20game/3D/video_game_3d.png' },
  { id: 'bills', name: 'Hóa đơn', percent: 8, amount: '788.000đ', color: '#FEF08A', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Receipt/3D/receipt_3d.png' },
  { id: 'other', name: 'Khác', percent: 9, amount: '886.000đ', color: '#E5E7EB', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Package/3D/package_3d.png' }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', title: 'Highlands Coffee', date: 'Hôm nay, 08:30', amount: '-55.000đ', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hot%20beverage/3D/hot_beverage_3d.png' },
  { id: '2', title: 'Chuyển khoản lương', date: 'Hôm qua, 14:00', amount: '+15.240.000đ', type: 'income', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Money%20bag/3D/money_bag_3d.png' },
  { id: '3', title: 'Shopee', date: '25/05/2025, 10:15', amount: '-450.000đ', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Shopping%20cart/3D/shopping_cart_3d.png' },
  { id: '4', title: 'GrabBike', date: '24/05/2025, 09:00', amount: '-32.000đ', type: 'expense', iconUrl: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Motor%20scooter/3D/motor_scooter_3d.png' }
];

export default function Reports({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [overview, setOverview] = useState<ReportOverview>(MOCK_OVERVIEW);
  const [trends, setTrends] = useState<TrendDataPoint[]>(MOCK_TRENDS);
  const [categories, setCategories] = useState<CategoryData[]>(MOCK_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      try {
        const [ovRes, trRes, catRes, txnRes] = await Promise.all([
          api.get('/api/v1/wallets/overview').catch(() => ({ data: MOCK_OVERVIEW })),
          api.get('/api/v1/reports/trends').catch(() => ({ data: MOCK_TRENDS })),
          api.get('/api/v1/transactions/categories').catch(() => ({ data: MOCK_CATEGORIES })),
          api.get('/api/v1/transactions/recent').catch(() => ({ data: MOCK_TRANSACTIONS }))
        ]);
        // Safe fallbacks to prevent empty rendering when API returns {}
        const rawOv = ovRes?.data?.data || ovRes?.data;
        setOverview(rawOv && rawOv.income ? rawOv : MOCK_OVERVIEW);
        
        const rawTr = trRes?.data?.data || trRes?.data;
        setTrends(Array.isArray(rawTr) && rawTr.length > 0 ? rawTr : MOCK_TRENDS);
        
        const rawCat = catRes?.data?.data || catRes?.data;
        setCategories(Array.isArray(rawCat) && rawCat.length > 0 ? rawCat : MOCK_CATEGORIES);
        
        const rawTxn = txnRes?.data?.data || txnRes?.data;
        setTransactions(Array.isArray(rawTxn) && rawTxn.length > 0 ? rawTxn : MOCK_TRANSACTIONS);
      } catch (err) {
        // Mocks are already initial state
      }
    }
    fetchReportData();
  }, []);

  // Helper to generate line chart paths
  const generatePath = (dataKey: 'income' | 'expense') => {
    if (!trends || !Array.isArray(trends) || !trends.length) return '';
    const maxVal = 25; // Y axis max value (e.g., 25M)
    const points = trends.map((pt, i) => {
      const x = (i / (trends.length - 1)) * 300; // SVG width 300
      const y = 120 - ((pt[dataKey] || 0) / maxVal) * 120; // SVG height 120
      return `${x},${y}`;
    });
    
    // Smooth curve approximation (Catmull-Rom or simple bezier)
    // For simplicity, using simple lines here, but normally would use d3 or curve smoothing
    return `M ${points.join(' L ')}`;
  };

  // Helper for donut chart layout
  let currentOffset = 0;
  const categoriesWithOffset = (categories || []).map(cat => {
    const offset = currentOffset;
    currentOffset -= cat.percent;
    return { ...cat, offset };
  });

  const content = (
        <div className="reports-page">
          
          <header className="reports-header">
            <div className="reports-title">
              <h1>
                Báo cáo
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10M12 20V4M6 20V14" stroke="var(--color-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 14L8 10L12 14L20 6" stroke="var(--color-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </h1>
              <p>Tổng quan tài chính của bạn</p>
            </div>
            
            <div className="reports-actions">
              <button className="date-picker-btn">
                <Calendar size={16} />
                01/05/2025 - 31/05/2025
                <ChevronDown size={14} />
              </button>
              <button className="export-btn">
                <Download size={16} />
                Xuất báo cáo
              </button>
            </div>
          </header>

          <div className="metrics-grid">
            <div className="metric-card mint">
              <div className="metric-icon-wrap"><Wallet size={24} /></div>
              <div className="metric-info">
                <div className="metric-title">Tổng thu nhập</div>
                <div className="metric-value">{overview.income}</div>
                <div className="metric-diff up">↑ {overview.incomeDiff}% <span style={{color: 'var(--color-text-secondary)', fontWeight: 400}}>so với tháng trước</span></div>
              </div>
            </div>

            <div className="metric-card danger">
              <div className="metric-icon-wrap"><ShoppingCart size={24} /></div>
              <div className="metric-info">
                <div className="metric-title">Tổng chi tiêu</div>
                <div className="metric-value">{overview.expense}</div>
                <div className="metric-diff down">↑ {overview.expenseDiff}% <span style={{color: 'var(--color-text-secondary)', fontWeight: 400}}>so với tháng trước</span></div>
              </div>
            </div>

            <div className="metric-card blue">
              <div className="metric-icon-wrap"><TrendingUp size={24} /></div>
              <div className="metric-info">
                <div className="metric-title">Số dư ròng</div>
                <div className="metric-value">{overview.balance}</div>
                <div className="metric-diff up">↑ {overview.balanceDiff}% <span style={{color: 'var(--color-text-secondary)', fontWeight: 400}}>so với tháng trước</span></div>
              </div>
            </div>

            <div className="metric-card yellow">
              <div className="metric-icon-wrap"><PieChart size={24} /></div>
              <div className="metric-info">
                <div className="metric-title">Tỷ lệ tiết kiệm</div>
                <div className="metric-value">{overview.savingsRate}%</div>
                <div className="metric-diff up">↑ {overview.savingsDiff}% <span style={{color: 'var(--color-text-secondary)', fontWeight: 400}}>so với tháng trước</span></div>
              </div>
            </div>
          </div>

          <div className="reports-main-grid">
            {/* Cột trái */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="report-card" style={{ flex: 1 }}>
                <div className="report-card-header">
                  <h3>Xu hướng thu chi <span style={{color:'var(--color-text-muted)'}}>ⓘ</span></h3>
                  <select className="report-filter-select">
                    <option>Theo ngày</option>
                    <option>Theo tuần</option>
                  </select>
                </div>
                <div className="line-chart-area">
                  <div className="line-chart-legend">
                    <div className="legend-item"><div className="legend-dot" style={{background: 'var(--color-mint)'}}></div> Thu nhập</div>
                    <div className="legend-item"><div className="legend-dot" style={{background: 'var(--color-error)'}}></div> Chi tiêu</div>
                  </div>
                  
                  <div className="chart-svg-container">
                    <div className="chart-y-axis">
                      <span>20M</span>
                      <span>15M</span>
                      <span>10M</span>
                      <span>5M</span>
                      <span>0</span>
                    </div>
                    
                    <svg viewBox="0 0 300 120" style={{ width: 'calc(100% - 40px)', height: '100%', position: 'absolute', left: '40px', overflow: 'visible' }} preserveAspectRatio="none">
                      {/* Grid lines */}
                      <path d="M0,0 L300,0" stroke="var(--color-border)" strokeDasharray="4 4" strokeWidth="1" opacity="0.5"/>
                      <path d="M0,30 L300,30" stroke="var(--color-border)" strokeDasharray="4 4" strokeWidth="1" opacity="0.5"/>
                      <path d="M0,60 L300,60" stroke="var(--color-border)" strokeDasharray="4 4" strokeWidth="1" opacity="0.5"/>
                      <path d="M0,90 L300,90" stroke="var(--color-border)" strokeDasharray="4 4" strokeWidth="1" opacity="0.5"/>
                      <path d="M0,120 L300,120" stroke="var(--color-border)" strokeWidth="1" opacity="0.5"/>

                      {/* Expense Area & Line */}
                      <path d={`${generatePath('expense')} L 300,120 L 0,120 Z`} fill="rgba(224, 85, 85, 0.1)" />
                      <path d={generatePath('expense')} fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
                      
                      {/* Income Area & Line */}
                      <path d={`${generatePath('income')} L 300,120 L 0,120 Z`} fill="rgba(92, 200, 156, 0.1)" />
                      <path d={generatePath('income')} fill="none" stroke="var(--color-mint)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
                      
                    </svg>

                    <div style={{ position: 'absolute', left: '40px', top: 0, width: 'calc(100% - 40px)', height: '100%', pointerEvents: 'none' }}>
                      {(trends || []).map((pt, i) => {
                        const maxVal = 25;
                        const x = (i / (trends.length - 1)) * 100;
                        const yInc = 100 - (pt.income / maxVal) * 100;
                        const yExp = 100 - (pt.expense / maxVal) * 100;
                        return (
                          <div key={i}>
                            <div style={{ position: 'absolute', left: `${x}%`, top: `${yInc}%`, width: 8, height: 8, borderRadius: '50%', background: 'white', border: '2px solid var(--color-mint)', transform: 'translate(-50%, -50%)', boxSizing: 'border-box' }} />
                            <div style={{ position: 'absolute', left: `${x}%`, top: `${yExp}%`, width: 8, height: 8, borderRadius: '50%', background: 'white', border: '2px solid var(--color-error)', transform: 'translate(-50%, -50%)', boxSizing: 'border-box' }} />
                          </div>
                        );
                      })}
                    </div>

                    <div className="chart-x-axis">
                      <span>01/05</span>
                      <span>08/05</span>
                      <span>15/05</span>
                      <span>22/05</span>
                      <span>31/05</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="report-card">
                <div className="report-card-header">
                  <h3>Top danh mục chi tiêu</h3>
                </div>
                <div className="progress-list">
                  {categories.slice(0, 5).map(cat => (
                    <div key={cat.id} className="progress-row">
                      <div className="progress-name">
                        <div className="icon">
                          <img src={cat.iconUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        {cat.name}
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${cat.percent}%`, background: cat.color }}></div>
                      </div>
                      <div className="progress-stats">
                        <span>{cat.percent}%</span>
                        <span>{cat.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-outline">Xem tất cả danh mục</button>
              </div>
            </div>

            {/* Cột phải */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="report-card" style={{ flex: 1 }}>
                <div className="report-card-header">
                  <h3>Chi tiêu theo danh mục</h3>
                </div>
                <div className="donut-chart-wrapper">
                  <div className="donut-chart-container">
                    <svg viewBox="0 0 42 42" className="donut-svg">
                      {categoriesWithOffset.map(slice => (
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
                          className="donut-segment"
                          onMouseEnter={() => setHoveredSlice(slice.id)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      ))}
                    </svg>
                    <div className="donut-center-info">
                      {hoveredSlice ? (
                        <>
                          <div className="donut-center-value">{categories.find(c => c.id === hoveredSlice)?.amount}</div>
                          <div className="donut-center-title">{categories.find(c => c.id === hoveredSlice)?.name}</div>
                        </>
                      ) : (
                        <>
                          <div className="donut-center-value">{overview.expense}</div>
                          <div className="donut-center-title">Tổng chi tiêu</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="donut-legend-list">
                    {categories.map(cat => (
                      <div key={cat.id} className="donut-legend-row"
                           onMouseEnter={() => setHoveredSlice(cat.id)}
                           onMouseLeave={() => setHoveredSlice(null)}
                           style={{ opacity: hoveredSlice && hoveredSlice !== cat.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                        <div className="donut-legend-name">
                          <div className="icon">
                            <img src={cat.iconUrl} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          {cat.name}
                        </div>
                        <div className="donut-legend-stats">
                          <span style={{ width: '30px' }}>{cat.percent}%</span>
                          <span style={{ fontWeight: 500, width: '70px', textAlign: 'right' }}>{cat.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn-outline" style={{ marginTop: '24px' }}>Xem chi tiết</button>
              </div>

              <div className="report-card">
                <div className="report-card-header">
                  <h3>Giao dịch gần đây</h3>
                </div>
                <div className="transaction-list">
                  {(transactions || []).map(txn => (
                    <div key={txn.id} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-icon">
                          <img src={txn.iconUrl} alt={txn.title} />
                        </div>
                        <div className="transaction-details">
                          <h4>{txn.title}</h4>
                          <p>{txn.date}</p>
                        </div>
                      </div>
                      <div className={`transaction-amount ${txn.type}`}>
                        {txn.amount}
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-outline" style={{ marginTop: '24px' }}>Xem tất cả giao dịch</button>
              </div>
            </div>
          </div>

          <footer className="reports-footer">
            <Lock size={14} /> Dữ liệu được mã hóa và bảo mật tuyệt đối bởi Pockie
          </footer>
        </div>
  );

  if (isEmbedded) return content;
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main" style={{ padding: 0 }}>
        {content}
      </main>
    </div>
  );
}
