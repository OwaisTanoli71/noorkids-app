import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail } from '../../services/auth';
import { getUserProfile } from '../../services/profile';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setResetMessage('');
      
      const userCredential = await loginUser(email, password);
      const user = userCredential.user;
      
      const profile = await getUserProfile(user.id);
      if (profile && !profile.profileComplete) {
        navigate('/complete-profile');
      } else {
        navigate('/');
      }
      
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('invalid')) {
        setError("Incorrect email or password.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first to reset your password.");
      return;
    }
    
    try {
      setError('');
      await sendPasswordResetEmail(email);
      setResetMessage("Check your email for a reset link.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Please ensure your email is correct.");
    }
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] w-full max-w-md mx-auto text-white">
      <h2 className="text-3xl font-black mb-8 text-center text-white tracking-tight">Welcome Back</h2>
      
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-6 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {resetMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl mb-6 text-sm flex items-start gap-3">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p>{resetMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300 placeholder:text-slate-500"
              placeholder="parent@example.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300 placeholder:text-slate-500"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Forgot password?
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 py-4 rounded-full hover:scale-[1.02] transition-all font-bold text-lg disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          {loading ? "Signing in..." : <>Log In <ArrowRight size={20} /></>}
        </button>
      </form>
      
      <p className="mt-8 text-center text-slate-400">
        Don't have an account? <Link to="/register" className="text-white hover:text-amber-400 font-bold transition-colors ml-1">Create one</Link>
      </p>
    </div>
  );
}
