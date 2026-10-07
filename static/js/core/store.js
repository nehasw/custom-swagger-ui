/*
 * Chhota state store: get / set / subscribe. UI modules ek doosre ko call nahi karte,
 * sirf store se state padhte aur badalte hain.
 *
 * Saved preferences (theme, env, sidebar) localStorage mein jaate hain.
 * JWT token yahan kabhi persist nahi hoga (auth.js usse memory mein rakhega).
 */
const PREF_KEY = 'apiPortal.prefs';

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
}
function savePrefs(prefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* private mode etc. */ }
}

export function createStore(initial, persistKeys = []) {
  const saved = loadPrefs();
  let state = { ...initial };
  for (const k of persistKeys) if (k in saved) state[k] = saved[k];

  const listeners = new Set();

  return {
    get: () => state,
    set(patch) {
      const prev = state;
      state = { ...state, ...patch };
      if (persistKeys.some(k => k in patch)) {
        savePrefs(Object.fromEntries(persistKeys.map(k => [k, state[k]])));
      }
      listeners.forEach(fn => fn(state, prev));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
