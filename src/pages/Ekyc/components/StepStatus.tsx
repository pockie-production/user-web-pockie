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
    <div className="flex flex-col items-center justify-center text-center py-8">
      {loading ? (
        <>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Đang xử lý hồ sơ...</h2>
          <p className="text-sm text-gray-600">
            Hệ thống đang tự động nhận diện và đối chiếu khuôn mặt. Vui lòng không đóng trang này.
          </p>
        </>
      ) : status === 'APPROVED' ? (
        <>
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 text-4xl">
            ✓
          </div>
          <h2 className="text-xl font-bold text-green-700 mb-2">Xác thực thành công!</h2>
          <p className="text-sm text-gray-600 mb-6">
            Tài khoản của bạn đã được xác minh. Bây giờ bạn có thể sử dụng tất cả các dịch vụ.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium"
          >
            Về trang chủ
          </button>
        </>
      ) : status === 'REJECTED' ? (
        <>
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 text-4xl">
            ✕
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Xác thực thất bại</h2>
          <p className="text-sm text-gray-600 mb-6">
            Hình ảnh không khớp hoặc thông tin không rõ ràng. Vui lòng thực hiện lại từ đầu.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium"
          >
            Thử lại
          </button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 text-4xl">
            !
          </div>
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Lỗi kết nối</h2>
          <p className="text-sm text-gray-600 mb-6">
            Có lỗi xảy ra trong quá trình nộp hồ sơ. Vui lòng thử lại sau.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium"
          >
            Thử lại
          </button>
        </>
      )}
    </div>
  );
}
