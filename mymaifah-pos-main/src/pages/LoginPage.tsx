import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/assets/logo';
import { toast } from 'sonner';
import { User, ArrowLeft, AlertCircle, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, isAuthenticated, isLoading } = useAuth();

  // Use useEffect for redirect, not during render
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'cashier') {
        navigate('/pos', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = login(email, password);
    
    if (result.success && result.user) {
      toast.success(`Welcome back, ${result.user.fullName}!`);
      // Navigation will happen in useEffect after state updates
    } else {
      setError(result.error || 'Invalid email or password');
      toast.error(result.error || 'Login failed');
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'cashier') => {
    if (type === 'admin') {
      setEmail('admin@maifah.com');
      setPassword('admin123');
    } else {
      setEmail('cashier1@maifah.com');
      setPassword('cashier123');
    }
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-secondary transition-colors z-10"
      >
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>
      
      <div className="w-full max-w-xs flex flex-col items-center gap-6">
        <Logo />
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>

        {error && (
          <div className="w-full p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl gradient-orange text-primary-foreground font-bold text-base shadow-float mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </div>

        <div className="w-full space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Demo Accounts</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fillDemoCredentials('admin')}
              className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-left transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4" />
                <span className="font-bold text-sm">Admin</span>
              </div>
              <p className="text-xs text-white/80">admin@maifah.com</p>
              <p className="text-xs text-white/80">•••••••</p>
            </button>
            
            <button
              onClick={() => fillDemoCredentials('cashier')}
              className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-left transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4" />
                <span className="font-bold text-sm">Cashier</span>
              </div>
              <p className="text-xs text-white/80">cashier1@maifah.com</p>
              <p className="text-xs text-white/80">•••••••</p>
            </button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground bg-secondary/50 rounded-lg p-2">
            <p>Click on a demo account to auto-fill credentials, then click Sign In</p>
            <p className="text-[10px] mt-1">Admin: full access • Cashier: POS only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;