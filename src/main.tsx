import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useAuth } from "./hooks/useAuth";
import { createContext } from 'react';

type AuthContextType = ReturnType<typeof useAuth>;
const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Fresh start: wipes old prototype data on version change ──────────────
// To reset all data on next install, just bump APP_VERSION (e.g. '3.0')
const APP_VERSION     = '2.0';
const APP_VERSION_KEY = 'maifah_app_version';

const STALE_KEYS = [
  'pos_sales',
  'pos_expenses',
  'pos_shifts',
  'pos_cart_temp',
  'pos_voids',
  'pos_order_counter',
  'maifah_sample_data_loaded', // old prototype key
];

(function clearOldData() {
  if (localStorage.getItem(APP_VERSION_KEY) === APP_VERSION) return;
  STALE_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.setItem(APP_VERSION_KEY, APP_VERSION);
  console.log('[Maifah] ✅ Fresh start — all data reset to zero.');
})();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
