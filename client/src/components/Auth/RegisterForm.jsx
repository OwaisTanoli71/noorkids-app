import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { createUserProfile } from '../../services/profile';
import { Mail, Lock, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid.";
    
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      setGlobalError('');
      
      const userCredential = await registerUser(email, password);
      const user = userCredential.user;
      
      await createUserProfile(user.id, {
        email: user.email,
        createdAt: new Date().toISOString(),
        profileComplete: false
      });
      
      navigate('/complete-profile');
      
    } catch (err) {
      console.error(err);
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        setGlobalError("This email is already registered — try logging in instead.");
      } else if (err.message && err.message.toLowerCase().includes('password')) {
        setGlobalError(err.message);
      } else {
        setGlobalError(err.message || "Failed to create an account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] w-full max-w-md mx-auto text-white">
      <h2 className="text-3xl font-black mb-2 text-center text-white tracking-tight flex items-center justify-center gap-3">
        Join NoorKids <Sparkles className="text-amber-400" />
      </h2>
      <p className="text-center text-slate-400 mb-8 font-medium">Create a parent account to begin</p>
      
      {globalError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-6 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{globalError}</p>
        </div>
      )}
      
      <form onSubmit={handleRegister} className="flex flex-col gap-5">
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
              className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border ${errors.email ? 'border-rose-400' : 'border-white/10'} focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300 placeholder:text-slate-500`}
              placeholder="parent@example.com"
            />
          </div>
          {errors.email && <p className="text-rose-400 text-xs mt-2 font-bold ml-1">{errors.email}</p>}
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
              className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border ${errors.password ? 'border-rose-400' : 'border-white/10'} focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300 placeholder:text-slate-500`}
              placeholder="•••••••• (min 6 chars)"
            />
          </div>
          {errors.password && <p className="text-rose-400 text-xs mt-2 font-bold ml-1">{errors.password}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Lock size={18} />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border ${errors.confirmPassword ? 'border-rose-400' : 'border-white/10'} focus:outline-none focus:border-amber-400/50 focus:bg-white/10 text-white transition-all duration-300 placeholder:text-slate-500`}
              placeholder="••••••••"
            />
          </div>
          {errors.confirmPassword && <p className="text-rose-400 text-xs mt-2 font-bold ml-1">{errors.confirmPassword}</p>}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 py-4 rounded-full hover:scale-[1.02] transition-all font-bold text-lg disabled:opacity-50 mt-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          {loading ? "Creating Account..." : <>Sign Up <ArrowRight size={20} /></>}
        </button>
      </form>
      
      <p className="mt-8 text-center text-slate-400">
        Already have an account? <Link to="/login" className="text-white hover:text-amber-400 font-bold transition-colors ml-1">Log in</Link>
      </p>
    </div>
  );
}
