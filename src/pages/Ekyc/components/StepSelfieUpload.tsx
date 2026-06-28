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
    <div>
      <h2 className="ekyc-step-title">Bước 2: Chụp ảnh chân dung</h2>
      <p className="ekyc-step-desc">
        Hãy để khuôn mặt nằm trong khung hình và không đeo kính đen hay khẩu trang.
      </p>

      {error && <div className="ekyc-error">{error}</div>}

      <div className="ekyc-upload-box">
        <label className="ekyc-upload-label">
          {selfieFile ? `Đã chọn: ${selfieFile.name}` : '+ Mở Camera / Tải ảnh lên'}
          <input 
            type="file" 
            accept="image/*" 
            capture="user"
            onChange={(e) => e.target.files && setSelfieFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <button 
        className="ekyc-btn"
        disabled={!selfieFile || loading}
        onClick={handleUpload}
      >
        {loading ? 'Đang tải lên...' : 'Hoàn tất và Gửi'}
      </button>
    </div>
  );
}
