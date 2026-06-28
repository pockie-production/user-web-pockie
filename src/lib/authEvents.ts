export const AUTH_STATE_CHANGED_EVENT = 'pockie:auth-state-changed';

export function emitAuthStateChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}
