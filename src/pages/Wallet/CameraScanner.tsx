import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Image as ImageIcon, HelpCircle } from 'lucide-react';
import './CameraScanner.css';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CameraScanner({ isOpen, onClose }: CameraScannerProps) {
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);

  if (!isOpen) return null;

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      onClose();
      navigate('/dashboard');
    }, 600); // 600ms matches animation duration
  };

  return (
    <div className="camera-scanner-overlay">
      <div className={`camera-scanner-container ${isCapturing ? 'capturing-animate' : ''}`}>
        {/* Top Bar */}
        <div className="camera-top-bar">

          <div className="nav-bar">
            <button className="icon-btn" onClick={onClose}>
              <ArrowLeft size={24} color="white" />
            </button>
            <h2 className="title">Smart Scan</h2>
            <button className="icon-btn">
              <Zap size={24} color="white" />
            </button>
          </div>
        </div>

        {/* Camera View Area */}
        <div className="camera-view-area">
          <div className="scan-frame">
            {/* Green corner brackets */}
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>

            {/* Mockup Receipt */}
            <div className="mock-receipt">
              <h3>HÓA ĐƠN</h3>
              <p className="store-name">Siêu thị Pockie Mart</p>
              <p>123 Đường ABC, Hà Nội</p>
              <p>ĐT: 0123 456 789</p>

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>SP</th>
                    <th>SL</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cà phê sữa</td>
                    <td>2</td>
                    <td>60.000</td>
                  </tr>
                  <tr>
                    <td>Bánh mì</td>
                    <td>1</td>
                    <td>25.000</td>
                  </tr>
                  <tr>
                    <td>Nước suối</td>
                    <td>1</td>
                    <td>10.000</td>
                  </tr>
                </tbody>
              </table>

              <div className="receipt-total">
                <span>Tổng cộng</span>
                <span className="total-amount">95.000đ</span>
              </div>

              <p className="thank-you">Cám ơn quý khách!</p>
            </div>
          </div>

          <div className="instruction-text">
            <p>Đặt hóa đơn vào khung</p>
            <p>Chụp rõ nét, đầy đủ thông tin</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="camera-bottom-bar">
          <button className="bottom-icon-btn">
            <ImageIcon size={24} color="white" />
          </button>

          <button className="capture-btn" onClick={handleCapture} disabled={isCapturing}>
            <div className="capture-inner"></div>
          </button>

          <button className="bottom-icon-btn">
            <HelpCircle size={24} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
