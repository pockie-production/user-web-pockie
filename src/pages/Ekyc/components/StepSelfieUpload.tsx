import { useState } from 'react';
import { api } from '../../../lib/api';

interface Props {
  sessionId: string;
  onNext: () => void;
}

export function StepSelfieUpload({ sessionId, onNext }: Props) {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!selfieFile) {
      setError('Vui lòng chụp ảnh chân dung (selfie)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('documentType', 'SELFIE');
      formData.append('side', 'FRONT');
      formData.append('file', selfieFile);
      
      await api.post(`/ekyc/sessions/${sessionId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh selfie lên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">Bước 2: Chụp ảnh chân dung</h2>
      <p className="text-sm text-gray-600 mb-4">
        Hãy để khuôn mặt nằm trong khung hình và không đeo kính đen hay khẩu trang.
      </p>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-gray-50 h-32 flex flex-col justify-center items-center">
        <label className="cursor-pointer block w-full h-full flex flex-col items-center justify-center">
          <span className="text-blue-600 font-medium text-lg">Mở Camera / Tải ảnh lên</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="user"
            className="hidden" 
            onChange={(e) => e.target.files && setSelfieFile(e.target.files[0])}
          />
        </label>
        {selfieFile && <p className="text-sm text-green-600 mt-2">Đã chọn: {selfieFile.name}</p>}
      </div>

      <button 
        onClick={handleUpload} 
        disabled={loading || !selfieFile}
        className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Đang xử lý...' : 'Hoàn tất và Gửi'}
      </button>
    </div>
  );
}
