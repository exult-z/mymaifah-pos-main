import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    const user = login(email, password);
    if (user) {
      navigate('/select');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs flex flex-col items-center gap-6"
      >
        <img src={logo} alt="Maifah Tea Bong's Cafe" className="w-28 h-auto" />
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>

        {error && (
          <div className="w-full p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center">
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
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            className="w-full py-3 rounded-xl gradient-orange text-primary-foreground font-bold text-base shadow-float mt-2"
          >
            Sign In
          </motion.button>
        </div>

        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-primary font-bold">
            Sign Up
          </button>
        </p>

        <div className="w-full p-3 rounded-xl bg-secondary text-muted-foreground text-xs text-center">
          <p className="font-semibold">Demo Credentials</p>
          <p>admin@maifah.com / admin123</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
