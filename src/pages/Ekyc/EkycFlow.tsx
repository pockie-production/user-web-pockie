import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { StepIdUpload } from './components/StepIdUpload';
import { StepSelfieUpload } from './components/StepSelfieUpload';
import { StepStatus } from './components/StepStatus';
import './Ekyc.css';

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
        const res = await api.post('/api/v1/ekyc/sessions');
        setSessionId(res.data.sessionId);
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
      <div className="ekyc-container">
        <h2 className="ekyc-title" style={{ color: '#ef4444' }}>Lỗi</h2>
        <p style={{ textAlign: 'center' }}>{error}</p>
        <button 
          onClick={() => { setError(null); setStep(0); setSessionId(null); }}
          className="ekyc-btn"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (loading || step === 0) {
    return (
      <div className="ekyc-container ekyc-loading">
        <div className="ekyc-spinner"></div>
        <p>Đang khởi tạo phiên định danh...</p>
      </div>
    );
  }

  return (
    <div className="ekyc-container">
      <h1 className="ekyc-title">Xác thực tài khoản (eKYC)</h1>
      
      {/* ProgressBar */}
      <div className="ekyc-progress-bar">
        {[1, 2, 3].map((s) => (
          <div 
            key={s} 
            className={`ekyc-progress-step ${s <= step ? 'active' : ''}`}
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
