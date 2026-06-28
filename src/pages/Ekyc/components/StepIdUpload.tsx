import { useState, type ChangeEvent } from 'react';
import { api } from '../../../lib/api';

interface Props {
  sessionId: string;
  onNext: () => void;
}

export function StepIdUpload({ sessionId, onNext }: Props) {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back',
  ) => {
    const file = event.target.files?.[0] || null;
    if (side === 'front') {
      setFrontFile(file);
      return;
    }

    setBackFile(file);
  };

  const handleUpload = async () => {
    if (!frontFile || !backFile) {
      setError('Vui lòng chọn đủ 2 mặt của thẻ');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Upload front
      const formDataFront = new FormData();
      formDataFront.append('documentType', 'ID_CARD');
      formDataFront.append('side', 'FRONT');
      formDataFront.append('file', frontFile);
      
      await api.post(`/ekyc/sessions/${sessionId}/documents`, formDataFront, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Upload back
      const formDataBack = new FormData();
      formDataBack.append('documentType', 'ID_CARD');
      formDataBack.append('side', 'BACK');
      formDataBack.append('file', backFile);
      
      await api.post(`/ekyc/sessions/${sessionId}/documents`, formDataBack, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="ekyc-step-title">Bước 1: Giấy tờ tùy thân</h2>
      <p className="ekyc-step-desc">Tải lên mặt trước và mặt sau CMND/CCCD hoặc Hộ chiếu của bạn.</p>

      {error && <div className="ekyc-error">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="ekyc-upload-box">
          <label className="ekyc-upload-label">
            {frontFile ? `Đã chọn: ${frontFile.name}` : '+ Tải lên mặt trước'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'front')} 
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="ekyc-upload-box">
          <label className="ekyc-upload-label">
            {backFile ? `Đã chọn: ${backFile.name}` : '+ Tải lên mặt sau'}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'back')} 
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <button 
        className="ekyc-btn"
        disabled={!frontFile || !backFile || loading}
        onClick={handleUpload}
      >
        {loading ? 'Đang tải lên...' : 'Tiếp tục'}
      </button>
    </div>
  );
}
