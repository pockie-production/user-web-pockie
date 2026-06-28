import { useState } from 'react';
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
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold mb-2">Bước 1: Chụp ảnh CCCD/CMND</h2>
      <p className="text-sm text-gray-600 mb-4">
        Vui lòng chụp rõ nét mặt trước và mặt sau của thẻ. Không để hình bị loá sáng hay mờ, mất góc.
      </p>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-gray-50">
        <label className="cursor-pointer block">
          <span className="text-blue-600 font-medium">Tải lên mặt trước</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={(e) => e.target.files && setFrontFile(e.target.files[0])}
          />
        </label>
        {frontFile && <p className="text-sm text-green-600 mt-2">Đã chọn: {frontFile.name}</p>}
      </div>

      <div className="border border-dashed border-gray-300 rounded p-4 text-center cursor-pointer hover:bg-gray-50">
        <label className="cursor-pointer block">
          <span className="text-blue-600 font-medium">Tải lên mặt sau</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={(e) => e.target.files && setBackFile(e.target.files[0])}
          />
        </label>
        {backFile && <p className="text-sm text-green-600 mt-2">Đã chọn: {backFile.name}</p>}
      </div>

      <button 
        onClick={handleUpload} 
        disabled={loading || !frontFile || !backFile}
        className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Đang xử lý...' : 'Tiếp tục'}
      </button>
    </div>
  );
}
