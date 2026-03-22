import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppUser } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

const roles: AppUser['role'][] = ['Cashier', 'Manager', 'Owner'];

const SignUpPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppUser['role']>('Cashier');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSignUp = () => {
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    const result = register(fullName, email, password, role);
    if (result.success) {
      navigate('/select');
    } else {
      setError(result.error || 'Registration failed');
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
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>

        {error && (
          <div className="w-full p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => { setFullName(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
          />
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
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as AppUser['role'])}
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
          >
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSignUp}
            className="w-full py-3 rounded-xl gradient-orange text-primary-foreground font-bold text-base shadow-float mt-2"
          >
            Create Account
          </motion.button>
        </div>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary font-bold">
            Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUpPage;
