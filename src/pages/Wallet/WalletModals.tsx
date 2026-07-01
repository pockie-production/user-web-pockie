import { X, UploadCloud, Camera } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={e => e.stopPropagation()}>
        <button className="wallet-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="wallet-modal-title">Thêm giao dịch mới</h2>
        
        <div className="wallet-form-group">
          <label>Số tiền</label>
          <input type="text" className="wallet-form-input" placeholder="0 đ" />
        </div>
        
        <div className="wallet-form-group">
          <label>Loại giao dịch</label>
          <select className="wallet-form-select">
            <option>Chi tiêu</option>
            <option>Thu nhập</option>
            <option>Chuyển khoản</option>
          </select>
        </div>
        
        <div className="wallet-form-group">
          <label>Danh mục</label>
          <select className="wallet-form-select">
            <option>Ăn uống</option>
            <option>Mua sắm</option>
            <option>Di chuyển</option>
            <option>Khác</option>
          </select>
        </div>
        
        <div className="wallet-form-group">
          <label>Ghi chú</label>
          <input type="text" className="wallet-form-input" placeholder="Nhập ghi chú..." />
        </div>
        
        <button className="wallet-btn-primary" onClick={onClose}>Thêm giao dịch</button>
      </div>
    </div>
  );
}

interface SmartScanModalProps extends ModalProps {
  onOpenCamera?: () => void;
}

export function SmartScanModal({ isOpen, onClose, onOpenCamera }: SmartScanModalProps) {
  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={e => e.stopPropagation()}>
        <button className="wallet-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="wallet-modal-title">Smart Scan</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
          Quét hóa đơn để tự động trích xuất thông tin giao dịch nhờ Pockie AI.
        </p>
        
        <div className="scan-upload-area">
          <UploadCloud size={40} className="scan-upload-icon" />
          <div className="scan-upload-text">Tải ảnh lên</div>
          <div className="scan-upload-hint">PNG, JPG tối đa 5MB</div>
        </div>
        
        <div style={{ textAlign: 'center', margin: '16px 0', color: 'var(--color-text-muted)' }}>hoặc</div>
        
        <button 
          className="wallet-btn-primary" 
          style={{ background: 'var(--color-white)', color: 'var(--color-mint)', border: '1px solid var(--color-mint)' }}
          onClick={onOpenCamera}
        >
          <Camera size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Mở camera quét trực tiếp
        </button>
      </div>
    </div>
  );
}

export function AddWalletModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={e => e.stopPropagation()}>
        <button className="wallet-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        <h2 className="wallet-modal-title">Thêm ví mới</h2>
        
        <div className="wallet-form-group">
          <label>Tên ví</label>
          <input type="text" className="wallet-form-input" placeholder="VD: Ví tiền mặt, Ngân hàng A..." />
        </div>
        
        <div className="wallet-form-group">
          <label>Loại ví</label>
          <select className="wallet-form-select">
            <option>Tài khoản ngân hàng</option>
            <option>Ví điện tử</option>
            <option>Tiền mặt</option>
          </select>
        </div>
        
        <div className="wallet-form-group">
          <label>Số dư ban đầu</label>
          <input type="text" className="wallet-form-input" placeholder="0 đ" />
        </div>
        
        <button className="wallet-btn-primary" onClick={onClose}>Thêm ví</button>
      </div>
    </div>
  );
}
