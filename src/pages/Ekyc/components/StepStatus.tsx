import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';

interface Props {
  sessionId: string;
}

export function StepStatus({ sessionId }: Props) {
  const [status, setStatus] = useState<string>('SUBMITTING');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let intervalId: any;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/ekyc/sessions/${sessionId}/status`);
        const currentStatus = res.data.status;
        setStatus(currentStatus);

        if (currentStatus === 'APPROVED' || currentStatus === 'REJECTED') {
          setLoading(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error fetching eKYC status', err);
      }
    };

    const submitSession = async () => {
      try {
        await api.post(`/ekyc/sessions/${sessionId}/submit`);
        setStatus('PROCESSING');
        // Bắt đầu poll status sau khi submit thành công
        intervalId = setInterval(checkStatus, 3000);
      } catch (err) {
        console.error('Submit session failed', err);
        setStatus('ERROR');
        setLoading(false);
      }
    };

    submitSession();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId]);

  return (
    <div className="ekyc-status">
      {loading ? (
        <>
          <div className="ekyc-spinner" style={{ margin: '0 auto 24px' }}></div>
          <h2 className="ekyc-step-title">Đang xử lý hồ sơ...</h2>
          <p className="ekyc-step-desc">
            Hệ thống đang tự động nhận diện và đối chiếu khuôn mặt. Vui lòng không đóng trang này.
          </p>
        </>
      ) : status === 'APPROVED' ? (
        <div className="ekyc-status-success">
          <div className="ekyc-status-icon">✓</div>
          <h2 className="ekyc-step-title" style={{ color: '#16a34a' }}>Xác thực thành công!</h2>
          <p className="ekyc-step-desc">
            Tài khoản của bạn đã được xác minh. Bây giờ bạn có thể sử dụng tất cả các dịch vụ.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="ekyc-btn"
            style={{ width: 'auto', padding: '12px 24px' }}
          >
            Về trang chủ
          </button>
        </div>
      ) : status === 'REJECTED' ? (
        <div className="ekyc-status-error">
          <div className="ekyc-status-icon">✕</div>
          <h2 className="ekyc-step-title" style={{ color: '#dc2626' }}>Xác thực thất bại</h2>
          <p className="ekyc-step-desc">
            Hình ảnh không khớp hoặc thông tin không rõ ràng. Vui lòng thực hiện lại từ đầu.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="ekyc-btn"
            style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#dc2626' }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="ekyc-status-error">
          <div className="ekyc-status-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>!</div>
          <h2 className="ekyc-step-title" style={{ color: '#d97706' }}>Lỗi kết nối</h2>
          <p className="ekyc-step-desc">
            Có lỗi xảy ra trong quá trình nộp hồ sơ. Vui lòng thử lại sau.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="ekyc-btn"
            style={{ width: 'auto', padding: '12px 24px' }}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
