import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail } from '../../services/auth';
import { getUserProfile } from '../../services/profile';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      triggerShake();
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
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(false);
    setTimeout(() => setShake(true), 10);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first to reset your password.");
      triggerShake();
      return;
    }
    
    try {
      setError('');
      await sendPasswordResetEmail(email);
      setResetMessage("Check your email for a reset link.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Please ensure your email is correct.");
      triggerShake();
    }
  };

  return (
    <div className={`w-full text-white ${shake ? 'animate-shake' : ''}`}>
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl mb-6 text-sm flex items-start gap-3 animate-fade-in-up">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {resetMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl mb-6 text-sm flex items-start gap-3 animate-fade-in-up">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p>{resetMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Email address</label>
          <div className="relative group/input">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-amber-400 transition-colors duration-300">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#141824] border border-[#2A2F3E] rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white transition-all placeholder:text-slate-500/70 shadow-inner"
              placeholder="Enter your email address"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Password</label>
          <div className="relative group/input">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-amber-400 transition-colors duration-300">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-[#141824] border border-[#2A2F3E] rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white transition-all placeholder:text-slate-500/70 shadow-inner"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-1 mb-2">
          <button 
            type="button" 
            onClick={handleForgotPassword}
            className="text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="relative overflow-hidden w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 py-3 rounded-xl transition-all font-bold text-[15px] shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] disabled:opacity-50 mt-1 flex justify-center items-center gap-2 group/btn"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Log In"
          )}
        </button>
      </form>
      
      <p className="mt-6 text-center text-slate-400 text-sm">
        Don't have an account? <Link to="/register" className="text-white hover:text-amber-400 font-bold transition-colors ml-1">Sign up</Link>
      </p>
    </div>
  );
}
