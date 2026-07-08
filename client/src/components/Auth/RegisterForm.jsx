import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { createUserProfile } from '../../services/profile';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [shake, setShake] = useState(false);
  
  const navigate = useNavigate();

  const triggerShake = () => {
    setShake(false);
    setTimeout(() => setShake(true), 10);
  };

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid.";
    
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      triggerShake();
    }
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
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full text-white ${shake ? 'animate-shake' : ''}`}>
      {globalError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3.5 rounded-xl mb-6 text-sm flex items-start gap-3 animate-fade-in-up">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{globalError}</p>
        </div>
      )}
      
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
              className={`w-full pl-11 pr-4 py-3 bg-[#141824] border ${errors.email ? 'border-rose-400' : 'border-[#2A2F3E]'} rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white transition-all placeholder:text-slate-500/70 shadow-inner`}
              placeholder="parent@example.com"
            />
          </div>
          {errors.email && <p className="text-rose-400 text-xs mt-1 animate-fade-in-up">{errors.email}</p>}
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
              className={`w-full pl-11 pr-12 py-3 bg-[#141824] border ${errors.password ? 'border-rose-400' : 'border-[#2A2F3E]'} rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white transition-all placeholder:text-slate-500/70 shadow-inner`}
              placeholder="•••••••• (min 6 chars)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-rose-400 text-xs mt-1 animate-fade-in-up">{errors.password}</p>}
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
          <div className="relative group/input">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within/input:text-amber-400 transition-colors duration-300">
              <Lock size={18} />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-11 pr-12 py-3 bg-[#141824] border ${errors.confirmPassword ? 'border-rose-400' : 'border-[#2A2F3E]'} rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white transition-all placeholder:text-slate-500/70 shadow-inner`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-rose-400 text-xs mt-1 animate-fade-in-up">{errors.confirmPassword}</p>}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="relative overflow-hidden w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 py-3 rounded-xl transition-all font-bold text-[15px] shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] disabled:opacity-50 mt-2 flex justify-center items-center gap-2 group/btn"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>
      
      <p className="mt-6 text-center text-slate-400 text-sm">
        Already have an account? <Link to="/login" className="text-white hover:text-amber-400 font-bold transition-colors ml-1">Log in</Link>
      </p>
    </div>
  );
}
