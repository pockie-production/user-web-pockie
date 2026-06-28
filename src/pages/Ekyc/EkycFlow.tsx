import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { StepIdUpload } from './components/StepIdUpload';
import { StepSelfieUpload } from './components/StepSelfieUpload';
import { StepStatus } from './components/StepStatus';

export default function EkycFlow() {
  const [step, setStep] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khởi tạo session khi bắt đầu
  useEffect(() => {
    async function initSession() {
      try {
        setLoading(true);
        const res = await api.post('/ekyc/sessions');
        setSessionId(res.data.id);
        setStep(1); // Chuyển sang bước upload ID
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể khởi tạo phiên eKYC');
      } finally {
        setLoading(false);
      }
    }
    
    if (step === 0 && !sessionId && !error) {
      initSession();
    }
  }, [step, sessionId, error]);

  const nextStep = () => setStep((s) => s + 1);

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-red-500 font-bold mb-4">Lỗi</h2>
        <p>{error}</p>
        <button 
          onClick={() => { setError(null); setStep(0); setSessionId(null); }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (loading || step === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Đang khởi tạo phiên định danh...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded shadow">
      <h1 className="text-2xl font-bold text-center mb-6">Xác thực tài khoản (eKYC)</h1>
      
      {/* ProgressBar */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`flex-1 h-2 mx-1 rounded ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {step === 1 && sessionId && (
        <StepIdUpload sessionId={sessionId} onNext={nextStep} />
      )}
      
      {step === 2 && sessionId && (
        <StepSelfieUpload sessionId={sessionId} onNext={nextStep} />
      )}

      {step === 3 && sessionId && (
        <StepStatus sessionId={sessionId} />
      )}
    </div>
  );
}
