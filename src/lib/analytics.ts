import { api } from './api';

type AnalyticsEventInput = {
  eventName: string;
  page?: string;
  feature?: string;
  payload?: Record<string, unknown>;
};

const SESSION_KEY = 'pockie_user_session_id';

function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function trackUserEvent(input: AnalyticsEventInput) {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  void api.post('/api/v1/analytics/events', {
    ...input,
    sessionId: getSessionId(),
  }).catch(() => undefined);
}
